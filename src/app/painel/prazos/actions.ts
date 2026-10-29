"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {parseDeadlineExtension} from "@/lib/deadlines/validation";
import type {TransactionState} from "@/lib/operations/types";
export async function extendDeadline(_previous:TransactionState,form:FormData):Promise<TransactionState>{
 const fail=(message:string,uncertain=false):TransactionState=>({success:false,uncertain,message,warnings:[]});
 const access=await requireAccess();if(!access||access.role!=="gerente_logistico")return fail("Somente o Gerente Logístico pode prorrogar prazos.");
 let input:ReturnType<typeof parseDeadlineExtension>;try{input=parseDeadlineExtension(form);}catch(reason){return fail(reason instanceof Error?reason.message:"Dados inválidos.");}
 try{
  const client=await createClient();const {data,error}=await client.rpc("extend_shipment_deadline",input);
  if(error){const known=["22023","22P02","23503","23505","23514","42501"].includes(error.code);return fail(known?"Revise a nova data e a justificativa. Se o prazo já mudou, atualize a página antes de tentar novamente.":"Resultado não confirmado. Repita a mesma tentativa.",!known);}
  if(typeof data?.event_id!=="string")return fail("Resultado não confirmado. Repita a mesma tentativa.",true);
  revalidatePath("/painel","layout");return {success:true,uncertain:false,message:"Prazo atualizado com justificativa no histórico.",id:data.event_id,warnings:[]};
 }catch{return fail("Resultado não confirmado. Repita a mesma tentativa antes de sair ou recarregar.",true);}
}
