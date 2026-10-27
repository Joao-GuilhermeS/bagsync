import {exportAccess,ExportError,exportFailure,downloadHeaders} from "@/lib/exports/access";
import {parseTrackingHistory} from "@/lib/production/tracking-validation";
export async function GET(request:Request){
 try{
  const client=await exportAccess();let filters:ReturnType<typeof parseTrackingHistory>;
  try{filters=parseTrackingHistory(new URL(request.url).searchParams);}catch{throw new ExportError("Consulta de histórico inválida.",400);}
  const {data,error}=await client.rpc("production_tracking_history",filters);
  if(error)throw new ExportError("Não foi possível consultar o histórico.",503);
  if(!data?.found)throw new ExportError("Contexto de produção não encontrado.",404);
  if(!Array.isArray(data.rows)||!Number.isSafeInteger(data.count)||data.kind!==filters.p_kind)throw new ExportError("Resposta de histórico inválida.",503);
  return Response.json({kind:data.kind,page:data.page,count:data.count,rows:data.rows},{headers:downloadHeaders});
 }catch(error){return exportFailure(error);}
}
