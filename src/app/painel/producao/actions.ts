"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {canAccess} from "@/lib/auth/authorization";
import {createClient} from "@/lib/supabase/server";
import {parseProductionNote} from "@/lib/production/tracking-validation";
import {operationError} from "@/lib/operations/validation";
import type {TransactionState} from "@/lib/operations/types";
export async function saveProductionNote(_previous:TransactionState,form:FormData):Promise<TransactionState> {
 const fail=(message:string,uncertain=false):TransactionState=>({success:false,uncertain,message,warnings:[]});
 const access=await requireAccess();if(!access||!canAccess(access,access.companyId,"registrar_observacao_producao"))return fail("Sem permissão para registrar observações.");
 let input:ReturnType<typeof parseProductionNote>;
 try{input=parseProductionNote(form);}catch(error){return fail(error instanceof Error?error.message:"Observação inválida.");}
 try{
  const client=await createClient();const {data,error}=await client.rpc("add_production_note",input);
  if(error){const definitive=["22023","22P02","23503","23505","23514","42501"].includes(error.code);return fail(definitive?operationError(error.code):"Resultado não confirmado. Repita a mesma tentativa.",!definitive);}
  if(typeof data?.note_id!=="string")return fail("Resultado não confirmado. Repita a mesma tentativa.",true);
  revalidatePath("/painel","layout");return {success:true,uncertain:false,message:"Observação registrada. O histórico foi preservado.",id:data.note_id,warnings:[]};
 }catch{return fail("Resultado não confirmado. Confira o histórico ou repita a mesma tentativa sem alterar os dados.",true);}
}
