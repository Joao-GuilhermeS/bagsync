import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {createClient} from "@/lib/supabase/server";
import {roles,type AccessContext} from "./authorization";
import {features,roleFeatures,allowedPath,landingPath,type Feature} from "./features";
export async function requireAccess():Promise<AccessContext|null>{
 const client=await createClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user)redirect("/login");
 const result=await client.rpc("get_access_context");let access:AccessContext|null=null;
 if(result.error){
  if(!["PGRST202","42883"].includes(result.error.code))throw new Error("Não foi possível consultar suas permissões.");
  const membership=await client.from("company_users").select("company_id,role").eq("user_id",user.id).maybeSingle();
  if(membership.error)throw new Error("Não foi possível consultar seu acesso.");
  if(membership.data&&roles.includes(membership.data.role))access={userId:user.id,companyId:membership.data.company_id,role:membership.data.role,permissions:roleFeatures[membership.data.role as keyof typeof roleFeatures].filter(value=>value!=="contas"),isPrimary:false,configured:false};
 }else if(result.data&&result.data.active&&result.data.userId===user.id&&roles.includes(result.data.role)&&Array.isArray(result.data.permissions)){
  access={userId:user.id,companyId:result.data.companyId,role:result.data.role,permissions:result.data.permissions.filter((value:unknown):value is Feature=>typeof value==="string"&&features.includes(value as Feature)),isPrimary:result.data.isPrimary===true,configured:true};
 }
 if(access){const path=(await headers()).get("x-bagsync-path");if(path&&!allowedPath(access,path))redirect(landingPath(access));}
 return access;
}
