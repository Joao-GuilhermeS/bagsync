"use server";
import {revalidatePath} from "next/cache";
import {requireAccess} from "@/lib/auth/context";
import {hasFeature,features} from "@/lib/auth/features";
import {roles} from "@/lib/auth/authorization";
import {parseAccessForm,type AccountActionState} from "@/lib/auth/admin-validation";
import {createClient} from "@/lib/supabase/server";
export async function saveAccount(_prior:AccountActionState,form:FormData):Promise<AccountActionState>{
 const access=await requireAccess();if(!access||!hasFeature(access,"contas"))return {success:false,message:"Administração não autorizada."};
 try{
  const input=parseAccessForm(form),client=await createClient();
  if(input.userId){
   if(!/^[0-9a-f-]{36}$/i.test(input.userId))return {success:false,message:"Conta inválida."};
   const result=await client.rpc("update_account_access",{p_request_key:input.requestKey,p_user_id:input.userId,p_name:input.name,p_role:input.role,p_permissions:input.permissions,p_active:input.active});
   if(result.error)return {success:false,uncertain:!['22023','42501'].includes(result.error.code),message:"Não foi possível confirmar a alteração. Confira a conta e os limites de concessão."};
  }else{
   const password=form.get("password"),confirm=form.get("password_confirm");
   if(!/^\S+@\S+\.\S+$/.test(input.email)||input.email.length>254||typeof password!=="string"||password.length<12||password.length>128||password!==confirm)return {success:false,message:"Revise o e-mail e confirme a senha de 12 a 128 caracteres."};
   const result=await client.functions.invoke("create-account",{body:{requestKey:input.requestKey,name:input.name,email:input.email,role:input.role,permissions:input.permissions,password}});
   if(result.error||!result.data?.success){
    let body=result.data;
    if(!body&&result.error&&"context" in result.error&&result.error.context instanceof Response)body=await result.error.context.clone().json().catch(()=>null);
    return {success:false,uncertain:body?.uncertain!==false,message:typeof body?.message==="string"?body.message:"Criação não confirmada. Confira a lista e repita os mesmos dados após 30 segundos."};
   }
  }
  revalidatePath("/painel","layout");return {success:true,message:input.userId?"Acesso atualizado. As permissões já estão em vigor.":"Conta criada. O acesso usa e-mail e senha, sem confirmação por e-mail."};
 }catch(error){return {success:false,message:error instanceof Error&&error.message.length<120?error.message:"Não foi possível confirmar a operação. Confira a lista antes de repetir.",uncertain:true};}
}
export async function saveRoleLimit(_prior:AccountActionState,form:FormData):Promise<AccountActionState>{
 const access=await requireAccess();if(!access?.isPrimary)return {success:false,message:"Somente a conta principal define os limites."};
 const grants=form.getAll("grant_permissions");const role=form.get("role"),permissions=form.getAll("permissions"),key=form.get("request_key");
 if(grants.some(value=>typeof value!=="string"||!features.includes(value as typeof features[number]))||typeof role!=="string"||!roles.includes(role as typeof roles[number])||permissions.some(value=>typeof value!=="string"||!features.includes(value as typeof features[number]))||typeof key!=="string"||!/^[0-9a-f-]{36}$/i.test(key))return {success:false,message:"Dados inválidos."};
 try{const client=await createClient();const result=await client.rpc("set_account_role_limit",{p_request_key:key,p_role:role,p_permissions:[...new Set(permissions)].sort(),p_grant_permissions:[...new Set(grants)].sort()});if(result.error)return {success:false,message:"Limite não confirmado. Confira o perfil antes de repetir.",uncertain:!['22023','42501'].includes(result.error.code)};revalidatePath("/painel","layout");return {success:true,message:"Limite atualizado. Os acessos desse perfil já respeitam a nova seleção."};}catch{return {success:false,uncertain:true,message:"Resultado não confirmado. Repita a mesma tentativa."};}
}
