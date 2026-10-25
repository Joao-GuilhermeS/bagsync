"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {canAccess} from "@/lib/auth/authorization";
import {createClient} from "@/lib/supabase/server";
import {catalogs,isCatalog,isUuid,validateCatalog,catalogError} from "@/lib/catalogs/validation";
export type CatalogState = {message: string; success: boolean};
export async function saveCatalog(_previous: CatalogState, form: FormData): Promise<CatalogState> {
 const access=await requireAccess();
 if(!access || !canAccess(access,access.companyId,"gerenciar_operacoes")) return {message:"Você não tem permissão para alterar cadastros.",success:false};
 const catalog=form.get("catalog");
 if(typeof catalog!=="string" || !isCatalog(catalog)) return {message:"Cadastro inválido.",success:false};
 const id=form.get("id");
 if(id && !isUuid(id)) return {message:"Registro inválido.",success:false};
 const remove=form.get("operation")==="delete";
 if(remove && (!id || form.get("confirm")!=="sim")) return {message:"Confirme a exclusão do registro.",success:false};
 let values: Record<string,string> = {};
 if(!remove) {
  try { values=validateCatalog(catalog,form); }
  catch(error) {return {message:error instanceof Error ? error.message : "Dados inválidos.",success:false};}
 }
 try {
  const client=await createClient();
  const table=catalogs[catalog].table;
  const query=remove ? client.from(table).delete().eq("id",id).eq("company_id",access.companyId)
   : id ? client.from(table).update(values).eq("id",id).eq("company_id",access.companyId)
   : client.from(table).insert({...values,company_id:access.companyId});
  const {data,error}=await query.select("id");
  if(error) return {message:catalogError(error.code),success:false};
  if(!data?.length) return {message:"Registro não encontrado ou sem permissão de acesso.",success:false};
 } catch {return {message:"Falha de conexão. Confira a lista antes de repetir um cadastro.",success:false};}
 revalidatePath("/painel","layout");
 return {message:remove ? "Registro excluído." : "Dados salvos.",success:true};
}
