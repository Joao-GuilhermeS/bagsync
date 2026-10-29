"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {parseShipment,parseShipmentChecklist} from "@/lib/checklists/shipment-validation";
import {operationError} from "@/lib/operations/validation";
import {operationWarnings} from "@/lib/operations/data";
import type {TransactionState} from "@/lib/operations/types";

export async function createShipment(_previous:TransactionState,form:FormData):Promise<TransactionState> {
 const fail=(message:string,uncertain=false):TransactionState=>({success:false,uncertain,message,warnings:[]});
 const access=await requireAccess();
 if(!access||access.role!=="gerente_logistico")return fail("Somente o Gerente Logístico pode criar remessas.");
 let input:ReturnType<typeof parseShipment>;
 try{input=parseShipment(form);}catch(error){return fail(error instanceof Error?error.message:"Dados inválidos.");}
 try{
  const client=await createClient();const {data,error}=await client.rpc("create_shipment_kit",input);
  if(error){
   if(["22023","22P02","23503","23505","23514","42501","22003"].includes(error.code))return fail(error.code==="22023"?"Revise as previsões e confira se todos os itens ativos do modelo têm tipo de resposta configurado. Se a chave já foi usada, confira a lista de remessas.":operationError(error.code));
   return fail("Resultado não confirmado. Repita a mesma tentativa sem mudar os dados.",true);
  }
  if(typeof data?.kit_id!=="string")return fail("Resultado não confirmado. Repita a mesma tentativa.",true);
  revalidatePath("/painel","layout");
  return {success:true,uncertain:false,id:data.kit_id,message:"Remessa criada com previsões manuais. Nenhum material foi baixado nesta etapa.",warnings:[]};
 }catch{return fail("A conexão não confirmou o resultado. Confira as remessas antes de iniciar outro lançamento ou repita a mesma tentativa.",true);}
}

export async function submitChecklist(_previous:TransactionState,form:FormData):Promise<TransactionState> {
 const fail=(message:string,uncertain=false):TransactionState=>({success:false,uncertain,message,warnings:[]});
 const access=await requireAccess();if(!access||access.role!=="gerente_logistico")return fail("Somente o Gerente Logístico pode concluir a Expedição.");
 let input:ReturnType<typeof parseShipmentChecklist>;
 try{input=parseShipmentChecklist(form);}catch(error){return fail(error instanceof Error?error.message:"Dados inválidos.");}
 try{
  const client=await createClient();const {data,error}=await client.rpc("submit_shipment_checklist_review",{...input,p_incomplete:form.get("manual_incomplete")==="sim"});
  if(error){
   const definitive=["22023","22P02","23503","23505","23514","42501","22003"].includes(error.code);
   return fail(definitive?operationError(error.code):"Resultado não confirmado. Repita a mesma tentativa sem alterar os dados.",!definitive);
  }
  if(typeof data?.submission_id!=="string")return fail("Resultado não confirmado. Repita a mesma tentativa.",true);
  revalidatePath("/painel","layout");
  return {success:true,uncertain:false,id:data.submission_id,warnings:operationWarnings(data),message:(data.operation_id?"Romaneio emitido. Materiais a entregar à facção.":"Conferência salva sem nova baixa de estoque.")+(data.kit_status==="completo"?" Kit Completo.":" Kit Incompleto: confira materiais faltantes ou alerta manual.")};
 }catch{return fail("Resultado não confirmado. Repita a mesma tentativa ou confira o histórico antes de iniciar outra saída.",true);}
}
