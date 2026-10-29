"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {parseExpedition,mapExpeditionAnswers} from "@/lib/shipments/expedition";
import {operationWarnings} from "@/lib/operations/data";
import type {TransactionState} from "@/lib/operations/types";

export type ExpeditionState=TransactionState&{kitId?:string;submissionId?:string};
export async function saveExpedition(_previous:ExpeditionState,form:FormData):Promise<ExpeditionState>{
 const fail=(message:string,uncertain=false,kitId?:string):ExpeditionState=>({success:false,uncertain,message,kitId,warnings:[]});
 const access=await requireAccess();if(!access||access.role!=="gerente_logistico")return fail("Somente o Gerente Logístico pode preparar e emitir remessas.");
 let input:ReturnType<typeof parseExpedition>;
 try{input=parseExpedition(form);}catch(error){return fail(error instanceof Error?error.message:"Dados inválidos.");}
 let kitId:string|undefined;
 try{
  const client=await createClient();
  const created=await client.rpc("create_shipment_kit",input.create);
  if(created.error){const definitive=["22023","22P02","23503","23505","23514","42501","22003"].includes(created.error.code);return fail(definitive?"Revise os previstos, o pedido e o checklist ativo do modelo. Nenhuma emissão foi feita.":"Não foi possível confirmar a criação. Repita a mesma tentativa.",!definitive);}
  if(typeof created.data?.kit_id!=="string")return fail("Resultado não confirmado. Repita a mesma tentativa.",true);
  kitId=created.data.kit_id;
  if(input.intent==="draft"){
   const review=await client.rpc("set_shipment_kit_review",{p_request_key:input.submissionKey,p_kit_id:kitId,p_incomplete:form.get("manual_incomplete")==="sim",p_note:input.note});
   if(review.error)return fail("A previsão foi salva, mas a revisão do kit não foi confirmada. Repita a mesma tentativa.",true,kitId);
   revalidatePath("/painel","layout");return {success:true,uncertain:false,kitId,message:"Remessa pendente salva. Nenhum material foi baixado.",warnings:[]};
  }
  const snapshot:{id:string;template_item_id:string|null}[]=[];
  for(let offset=0;;offset+=500){const rows=await client.from("shipment_kit_items").select("id,template_item_id").eq("company_id",access.companyId).eq("kit_id",kitId).order("id").range(offset,offset+499);if(rows.error)return fail("A previsão foi salva, mas a emissão não foi confirmada. Repita a mesma tentativa.",true,kitId);snapshot.push(...rows.data);if(rows.data.length<500)break;}
  const answers=mapExpeditionAnswers(input.answers,snapshot);
  const result=await client.rpc("submit_shipment_checklist_review",{p_request_key:input.submissionKey,p_kit_id:kitId,p_answers:answers,p_note:input.note,p_incomplete:form.get("manual_incomplete")==="sim"});
  if(result.error||typeof result.data?.submission_id!=="string")return fail("A remessa foi preparada, mas a emissão não foi confirmada. Repita a mesma tentativa ou consulte o histórico; o estoque não deve ser lançado manualmente.",true,kitId);
  revalidatePath("/painel","layout");
  return {success:true,uncertain:false,kitId,submissionId:result.data.submission_id,message:result.data.operation_id?"Romaneio emitido. Materiais baixados e card disponível para o motorista.":"Conferência salva sem novo envio. Não houve baixa nem card de entrega.",warnings:operationWarnings(result.data)};
 }catch{return fail("Resultado não confirmado. Os dados devem ser repetidos com as mesmas chaves; consulte a remessa antes de criar outra.",true,kitId);}
}
