import {exportAccess,exportData,ExportError,exportFailure,downloadHeaders} from "@/lib/exports/access";
import {exportUuid} from "@/lib/exports/core";
import {generateWaybill} from "@/lib/exports/pdf";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const client=await exportAccess();let id:string;try{id=exportUuid((await params).id);}catch{throw new ExportError("Referência inválida.",400);}
 const report=await exportData(client,{p_operation:id});const op=report.operations[0];if(!op)throw new ExportError("Operação não encontrada.",404);
 const pdf=await generateWaybill(op);if(pdf.length>20*1024*1024)throw new ExportError("Arquivo muito grande para geração em PDF.",413);
 return new Response(new Uint8Array(pdf),{headers:{...downloadHeaders,"Content-Type":"application/pdf","Content-Disposition":`attachment; filename=romaneio-${id}.pdf`}});
}catch(error){return exportFailure(error);}}
