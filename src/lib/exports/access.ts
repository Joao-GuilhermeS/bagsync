import {createClient} from "@/lib/supabase/server";
import {roles} from "@/lib/auth/authorization";
import type {ExportResult} from "./types";
export class ExportError extends Error {constructor(message:string,public status:number){super(message);}}
export async function exportAccess(){
 const client=await createClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user)throw new ExportError("Entre no sistema para exportar.",401);
 const membership=await client.from("company_users").select("company_id,role").eq("user_id",user.id).maybeSingle();
 if(membership.error)throw new ExportError("Não foi possível validar o acesso.",503);
 if(!membership.data||!roles.includes(membership.data.role))throw new ExportError("Acesso à empresa não configurado.",403);
 return client;
}
export async function exportData(client:Awaited<ReturnType<typeof exportAccess>>,filters:Record<string,string|null>):Promise<ExportResult>{
 const {data,error}=await client.rpc("export_inventory_operations",filters);
 if(error)throw new ExportError("Não foi possível consultar o relatório. Tente novamente.",503);
 const report=data as ExportResult;
 if(!report||typeof report.too_large!=="boolean"||!Array.isArray(report.operations))throw new ExportError("Resposta inválida do relatório.",503);
 if(report.too_large)throw new ExportError("Relatório muito grande. Reduza o período ou filtre pedido e facção.",413);
 return report;
}
export const downloadHeaders={"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
export function exportFailure(error:unknown):Response{return Response.json({error:error instanceof ExportError?error.message:"Não foi possível gerar o arquivo."},{status:error instanceof ExportError?error.status:500,headers:downloadHeaders});}
