import {exportAccess,exportData,ExportError,exportFailure,downloadHeaders} from "@/lib/exports/access";
import {exportFilters,generateCsv} from "@/lib/exports/core";
export async function GET(request:Request){try{
 const client=await exportAccess();let filters:ReturnType<typeof exportFilters>;
 try{filters=exportFilters(new URL(request.url).searchParams);}catch(error){throw new ExportError(error instanceof Error?error.message:"Filtro inválido.",400);}
 const report=await exportData(client,filters);const csv=generateCsv(report.operations);
 if(Buffer.byteLength(csv,"utf8")>20*1024*1024)throw new ExportError("Arquivo muito grande. Reduza os filtros.",413);
 return new Response(csv,{headers:{...downloadHeaders,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=extrato-bagsync.csv"}});
}catch(error){return exportFailure(error);}}
