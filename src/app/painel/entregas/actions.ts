"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {parseDeliveryConfirmation} from "@/lib/shipments/delivery-validation";
import {operationError} from "@/lib/operations/validation";
import type {TransactionState} from "@/lib/operations/types";
export async function confirmDelivery(_previous:TransactionState,form:FormData):Promise<TransactionState> {
 const fail=(message:string,uncertain=false):TransactionState=>({success:false,message,uncertain,warnings:[]});
 const access=await requireAccess();
 if(!access||!["gerente_logistico","motorista"].includes(access.role))return fail("Seu perfil não permite confirmar entregas.");
 let input:ReturnType<typeof parseDeliveryConfirmation>;
 try{input=parseDeliveryConfirmation(form);}catch(error){return fail(error instanceof Error?error.message:"Dados inválidos.");}
 try{
  const client=await createClient();const {data,error}=await client.rpc("confirm_shipment_delivery",input);
  if(error){
   const definitive=["22023","22P02","23503","23505","23514","42501"].includes(error.code);
   return fail(definitive?(error.code==="22023"?"Romaneio já entregue, estornado ou indisponível. Atualize a consulta antes de repetir.":operationError(error.code)):"Resultado não confirmado. Repita a mesma tentativa.",!definitive);
  }
  if(typeof data?.confirmation_id!=="string")return fail("Resultado não confirmado. Repita a mesma tentativa.",true);
  revalidatePath("/painel","layout");
  return {success:true,uncertain:false,id:data.confirmation_id,message:"Entrega confirmada na facção. Nenhuma nova baixa de estoque foi realizada.",warnings:[]};
 }catch{return fail("Resultado não confirmado. Repita a mesma tentativa ou confira a consulta antes de sair.",true);}
}
