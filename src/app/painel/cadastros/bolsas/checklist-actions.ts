"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {parseChecklist} from "@/lib/checklists/validation";
import {catalogError} from "@/lib/catalogs/validation";

export type ChecklistState={success:boolean;message:string};
export async function saveChecklist(_previous:ChecklistState,form:FormData):Promise<ChecklistState> {
 const access=await requireAccess();
 if(!access||access.role!=="gerente_logistico")return {success:false,message:"Somente o Gerente Logístico pode alterar o checklist."};
 let input:ReturnType<typeof parseChecklist>;
 try{input=parseChecklist(form);}catch(error){return {success:false,message:error instanceof Error?error.message:"Dados inválidos."};}
 const {operation,...item}=input;
 try{
  const client=await createClient();
  // ID estável no formulário evita duplicação ao repetir uma inclusão de resultado incerto.
  const query=operation==="insert"
   ?client.from("bag_checklist_items").insert({...item,company_id:access.companyId})
   :client.from("bag_checklist_items").update({material_id:item.material_id,label:item.label,input_type:item.input_type,position:item.position,active:item.active}).eq("company_id",access.companyId).eq("bag_id",item.bag_id).eq("id",item.id);
  const {data,error}=await query.select("id");
  if(error)return {success:false,message:error.code==="23505"?"Este identificador já foi cadastrado. Confira a lista antes de iniciar outro item.":catalogError(error.code)};
  if(!data?.length)return {success:false,message:"Item não encontrado ou sem permissão."};
 }catch{return {success:false,message:"Resultado não confirmado. Confira a lista antes de tentar novamente; não inicie outro item sem verificar."};}
 revalidatePath(`/painel/cadastros/bolsas/${item.bag_id}/checklist`);
 return {success:true,message:"Checklist salvo. As remessas existentes e o estoque foram preservados."};
}
