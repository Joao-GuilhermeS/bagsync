import PDFDocument from "pdfkit";
import path from "node:path";
import {formatQuantity} from "../operations/validation.ts";
import type {ChecklistReport} from "./report.ts";

export async function generateChecklistPdf(report:ChecklistReport):Promise<Buffer> {
 const root=path.join(process.cwd(),"src/assets/fonts");
 const doc=new PDFDocument({size:"A4",margins:{top:80,bottom:55,left:48,right:48},bufferPages:true,font:path.join(root,"NotoSans-Regular.woff"),info:{Title:"Controle de saída - BagSync",Author:report.company}});
 doc.registerFont("regular",path.join(root,"NotoSans-Regular.woff"));doc.registerFont("bold",path.join(root,"NotoSans-Bold.woff"));
 const chunks:Buffer[]=[];const result=new Promise<Buffer>((resolve,reject)=>{doc.on("data",chunk=>chunks.push(Buffer.from(chunk)));doc.on("end",()=>resolve(Buffer.concat(chunks)));doc.on("error",reject);});
 const width=doc.page.width-96;
 const paragraph=(label:string,value:string)=>{
  if(doc.y>doc.page.height-120)doc.addPage();
  doc.font("bold").fontSize(9).fillColor("#475569").text(label,48,doc.y,{width});
  doc.font("regular").fontSize(11).fillColor("#111827").text(value.replace(/\0/g,""),{width,lineGap:2});doc.moveDown(0.6);
 };
 const fields=(leftLabel:string,leftValue:string,rightLabel:string,rightValue:string)=>{
  let y=doc.y;const leftWidth=width*0.58;const gap=24;const rightX=48+leftWidth+gap;const rightWidth=width-leftWidth-gap;
  doc.font("regular").fontSize(11);
  const height=Math.max(doc.heightOfString(leftValue,{width:leftWidth}),doc.heightOfString(rightValue,{width:rightWidth}));
  if(height>300){paragraph(leftLabel,leftValue);paragraph(rightLabel,rightValue);return;}
  if(y+16+height+15>doc.page.height-55){doc.addPage();y=doc.y;}
  doc.font("bold").fontSize(9).fillColor("#475569").text(leftLabel,48,y,{width:leftWidth});
  doc.font("regular").fontSize(11).fillColor("#111827").text(leftValue,48,y+16,{width:leftWidth});
  doc.font("bold").fontSize(9).fillColor("#475569").text(rightLabel,rightX,y,{width:rightWidth});
  doc.font("regular").fontSize(11).fillColor("#111827").text(rightValue,rightX,y+16,{width:rightWidth});doc.x=48;doc.y=y+16+height+15;
 };
 const date=new Date(report.created_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"});
 fields("NOME DE QUEM RECEBE",report.workshop,"DATA DA SAÍDA / REGISTRO",date);
 fields("QUANTIDADE DE BOLSAS",formatQuantity(report.bag_quantity),"MODELO",report.model);
 paragraph("PEDIDO",report.order);
 if(report.is_reversed)paragraph("SITUAÇÃO","ENVIO ESTORNADO - documento original preservado.");
 else if(!report.operation_id)paragraph("SITUAÇÃO","Preenchimento sem novo envio de materiais; não gerou baixa de estoque.");
 doc.font("bold").fontSize(13).fillColor("#155e59").text("KIT / CHECKLIST",48,doc.y,{width});doc.moveDown(0.6);
 for(const [index,item] of report.items.entries()){
  if(doc.y>doc.page.height-145)doc.addPage();
  doc.font("bold").fontSize(11).fillColor("#111827").text(`${index+1}. ${item.label}`,48,doc.y,{width});doc.moveDown(0.3);
  const y=doc.y;const checkbox=item.input_type==="checkbox";
  if(checkbox){doc.rect(48,y+1,11,11).strokeColor("#334155").lineWidth(0.8).stroke();
   if(item.mode==="complete")doc.moveTo(50,y+6).lineTo(53,y+9).lineTo(58,y+3).lineWidth(1.5).stroke();}
  doc.font("regular").fontSize(10).text(item.mode==="complete"?"Conferido":item.mode==="partial"?"Quantidade informada":"- Não enviado nesta saída",checkbox?68:48,y,{width:checkbox?width-20:width});
  doc.x=48;doc.moveDown(0.4);
  paragraph("PREVISTO / ENVIADO NESTA SAÍDA",`${formatQuantity(item.expected_quantity)} / ${formatQuantity(item.quantity)} ${item.unit}`);
  if(item.input_type==="text")paragraph("RESPOSTA LIVRE",item.response_text||"Sem resposta escrita.");
  doc.moveDown(0.2);
 }
 paragraph("ANOTAÇÕES DESTA SAÍDA",report.note||"Sem anotações.");
 if(report.kit_note)paragraph("ANOTAÇÕES DA REMESSA",report.kit_note);
 paragraph("CONTROLE",`Remessa: ${report.kit_id}\nPreenchimento: ${report.id}`);
 paragraph("LEITURA","Este documento registra um preenchimento. Quantidades enviadas são adicionais nesta saída. Material não enviado não gera baixa; estornos preservam o original e reabrem pendências.");
 const pages=doc.bufferedPageRange();
 for(let page=0;page<pages.count;page++){
  doc.switchToPage(page);doc.font("bold").fontSize(12).fillColor("#155e59").text(`${report.company} | CONTROLE DE SAÍDA`,48,30,{width,height:34,ellipsis:true});
  doc.moveTo(48,65).lineTo(doc.page.width-48,65).strokeColor("#cbd5e1").lineWidth(0.6).stroke();
  const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;
  doc.font("regular").fontSize(8).fillColor("#64748b").text(`BagSync | Página ${page+1} de ${pages.count}`,48,doc.page.height-30,{width,align:"right",lineBreak:false});doc.page.margins.bottom=bottom;
 }
 doc.end();return result;
}
