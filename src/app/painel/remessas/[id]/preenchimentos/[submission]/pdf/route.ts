import {exportAccess,exportFailure,downloadHeaders,ExportError} from "@/lib/exports/access";
import {exportUuid} from "@/lib/exports/core";
import {checklistReport} from "@/lib/checklists/report";
import {generateChecklistPdf} from "@/lib/checklists/pdf";
export async function GET(_request:Request,{params}:{params:Promise<{id:string;submission:string}>}) {
 try{
  const client=await exportAccess();const raw=await params;let id:string,submission:string;
  try{id=exportUuid(raw.id);submission=exportUuid(raw.submission);}catch{throw new ExportError("Referência inválida.",400);}
  const report=await checklistReport(client,id,submission);const pdf=await generateChecklistPdf(report);
  if(pdf.length>20*1024*1024)throw new ExportError("PDF muito grande para geração.",413);
  return new Response(new Uint8Array(pdf),{headers:{...downloadHeaders,"Content-Type":"application/pdf","Content-Disposition":`inline; filename=controle-saida-${submission}.pdf`}});
 }catch(error){return exportFailure(error);}
}
