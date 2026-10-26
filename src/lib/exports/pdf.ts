import PDFDocument from "pdfkit";
import path from "node:path";
import {exportKinds,exportDate,exportQuantity} from "./core.ts";
import type {ExportOperation} from "./types";
export async function generateWaybill(op:ExportOperation,generatedAt=new Date().toISOString()):Promise<Buffer> {
 const root=path.join(process.cwd(),"src/assets/fonts");
 const doc=new PDFDocument({size:"A4",margins:{top:80,bottom:50,left:48,right:48},bufferPages:true,font:path.join(root,"NotoSans-Regular.woff"),info:{Title:"Romaneio BagSync",Author:op.company}});
 doc.registerFont("regular",path.join(root,"NotoSans-Regular.woff"));doc.registerFont("bold",path.join(root,"NotoSans-Bold.woff"));
 const chunks:Buffer[]=[];const finished=new Promise<Buffer>((resolve,reject)=>{doc.on("data",chunk=>chunks.push(Buffer.from(chunk)));doc.on("end",()=>resolve(Buffer.concat(chunks)));doc.on("error",reject);});
 const width=doc.page.width-96;
 const header=()=>{doc.font("bold").fontSize(13).fillColor("#155e59").text("BagSync | Romaneio",48,32,{width});doc.moveTo(48,58).lineTo(doc.page.width-48,58).strokeColor("#d1d5db").stroke();doc.x=48;doc.y=76;doc.fillColor("#111827");};

 const paragraph=(label:string,value:string)=>{doc.font("bold").fontSize(9).fillColor("#475569").text(label,{width});doc.font("regular").fontSize(11).fillColor("#111827").text(value,{width,lineGap:2});doc.moveDown(0.6);};
 paragraph("EMPRESA",op.company);paragraph("OPERAÇÃO",exportKinds[op.kind]??op.kind);paragraph("REFERÊNCIA",op.id);
 paragraph("DATA DO LANÇAMENTO (BRASÍLIA)",exportDate(op.created_at));paragraph("PEDIDO",op.order_name??"Não se aplica");paragraph("FACÇÃO / COSTUREIRA",op.workshop_name??"Não se aplica");
 paragraph("SITUAÇÃO",op.kind==="reversal"?"ESTORNO - registro original preservado":op.is_reversed?"ESTORNADA - este documento preserva o lançamento original":"REGISTRADA");
 if(op.reversal_of)paragraph("ESTORNO DA OPERAÇÃO",op.reversal_of);
 if(doc.y>doc.page.height-120)doc.addPage();
 doc.font("bold").fontSize(13).fillColor("#155e59").text("Itens e efeito no estoque",{width});doc.moveDown(0.5);
 for(const [index,item] of op.items.entries()){
  if(doc.y>doc.page.height-115)doc.addPage();
  doc.font("bold").fontSize(11).fillColor("#111827").text(`${index+1}. ${item.name}`,{width,lineGap:2});
  doc.font("regular").fontSize(10).text(`Quantidade: ${exportQuantity(item.quantity)} | Unidade: ${item.unit}`,{width,lineGap:2});doc.moveDown(0.8);
 }
 if(op.note)paragraph("OBSERVAÇÃO",op.note);
 for(const warning of op.warnings){if(warning.code==="saldo_negativo")paragraph("AVISO NO LANÇAMENTO",`Saldo negativo: ${exportQuantity(String(warning.balance))}.`);else if(warning.code==="recebimento_excedente")paragraph("AVISO NO LANÇAMENTO",`Recebido ${exportQuantity(String(warning.received))} acima do previsto ${exportQuantity(String(warning.expected))}.`);}
 paragraph("LEITURA DAS QUANTIDADES","Valor positivo representa entrada e negativo representa saída do estoque. Estorno mantém o original e registra o efeito oposto.");
 const range=doc.bufferedPageRange();
 for(let i=0;i<range.count;i++){doc.switchToPage(i);header();const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;doc.font("regular").fontSize(8).fillColor("#64748b").text(`Gerado em ${exportDate(generatedAt)} | Página ${i+1} de ${range.count}`,48,doc.page.height-30,{width,lineBreak:false,align:"right"});doc.page.margins.bottom=bottom;}
 doc.end();return finished;
}
