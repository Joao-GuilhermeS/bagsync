"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {canAccess} from "@/lib/auth/authorization";
import {createClient} from "@/lib/supabase/server";
import {parseComposition} from "@/lib/operations/validation";
import {catalogError} from "@/lib/catalogs/validation";
export type CompositionState={success:boolean;message:string};
export async function saveComposition(_previous:CompositionState,form:FormData):Promise<CompositionState> {
 const access=await requireAccess();
 if(!access||!canAccess(access,access.companyId,"gerenciar_operacoes"))return {success:false,message:"Somente o Gerente Logístico pode alterar a composição."};
 let input:ReturnType<typeof parseComposition>;
 try{input=parseComposition(form);}catch(error){return {success:false,message:error instanceof Error?error.message:"Dados inválidos."};}
 try{
  const client=await createClient();
  const query=input.operation==="insert"?client.from("bag_materials").insert({company_id:access.companyId,bag_id:input.bag_id,material_id:input.material_id,quantity:input.quantity})
   : input.operation==="update"?client.from("bag_materials").update({quantity:input.quantity}).eq("company_id",access.companyId).eq("bag_id",input.bag_id).eq("material_id",input.material_id)
   : client.from("bag_materials").delete().eq("company_id",access.companyId).eq("bag_id",input.bag_id).eq("material_id",input.material_id);
  const {data,error}=await query.select("bag_id,material_id");
  if(error)return {success:false,message:error.code==="23505"?"Este material já faz parte da composição. Edite a quantidade do item existente.":catalogError(error.code)};
  if(!data?.length)return {success:false,message:"Item não encontrado ou sem permissão de acesso."};
 }catch{return {success:false,message:"A conexão não confirmou o resultado. Confira a composição antes de tentar novamente."};}
 revalidatePath(`/painel/cadastros/bolsas/${input.bag_id}/composicao`);
 return {success:true,message:input.operation==="delete"?"Material removido da composição.":"Composição salva. O estoque não foi movimentado."};
}
