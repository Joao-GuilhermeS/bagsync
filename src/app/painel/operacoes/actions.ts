"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {parseOrder,parseOperation,allowedOperation,operationError} from "@/lib/operations/validation";
import {operationWarnings} from "@/lib/operations/data";
import type {TransactionState} from "@/lib/operations/types";
export async function submitTransaction(_previous:TransactionState,form:FormData):Promise<TransactionState> {
 const fail=(message:string,uncertain=false):TransactionState=>({message,success:false,uncertain,warnings:[]});
 const access=await requireAccess();if(!access)return fail("Acesso à empresa não configurado.");
 const task=form.get("task");
 if(task!=="order"&&task!=="operation")return fail("Ação inválida.");
 let order:ReturnType<typeof parseOrder>|undefined;let operation:ReturnType<typeof parseOperation>|undefined;
 try {
  if(task==="order"){if(access.role!=="gerente_logistico")return fail("Somente o Gerente Logístico pode criar pedidos.");order=parseOrder(form);}
  else {operation=parseOperation(form);if(!allowedOperation(access.role,operation.p_kind))return fail("Seu perfil não permite esta operação.");}
 }catch(error){return fail(error instanceof Error?error.message:"Dados inválidos.");}
 try {
  const client=await createClient();
  const {data,error}=order?await client.rpc("create_production_order",order):await client.rpc("register_inventory_operation",operation!);
  if(error) {
   const definitive=["23505","23503","42501","22023","22P02","23514","22003"].includes(error.code);
   return fail(definitive?operationError(error.code):"A conexão não confirmou o resultado. Repita a mesma tentativa sem alterar os dados.",!definitive);
  }
  const id=order?data?.order_id:data?.operation_id;
  if(typeof id!=="string")return fail("Resultado não confirmado. Repita a mesma tentativa.",true);
  revalidatePath("/painel","layout");
  return {success:true,uncertain:false,message:order?"Pedido criado.":"Operação registrada.",id,warnings:operationWarnings(data)};
 }catch{return fail("Resultado não confirmado. Repita a mesma tentativa sem alterar os dados; não inicie um novo lançamento antes de conferir o histórico.",true);}
}
