import PDFDocument from "pdfkit";
import path from "node:path";
import {formatQuantity} from "../operations/validation.ts";
import type {ChecklistReport} from "./report.ts";

/** A4 vetorial: usa o registro da emissão e nunca recalcula quantidades históricas. */
export async function generateChecklistPdf(report:ChecklistReport):Promise<Buffer> {
 const root=path.join(process.cwd(),"src/assets/fonts");
 const doc=new PDFDocument({size:"A4",margin:36,bufferPages:true,font:path.join(root,"NotoSans-Regular.woff"),info:{Title:"Romaneio de Expedição de Materiais",Author:report.company}});
 doc.registerFont("regular",path.join(root,"NotoSans-Regular.woff"));
 doc.registerFont("bold",path.join(root,"NotoSans-Bold.woff"));
 const chunks:Buffer[]=[];
 const result=new Promise<Buffer>((resolve,reject)=>{doc.on("data",chunk=>chunks.push(Buffer.from(chunk)));doc.on("end",()=>resolve(Buffer.concat(chunks)));doc.on("error",reject);});
 const left=36,width=doc.page.width-72,bottom=doc.page.height-64;
 const green="#1B3B2B",ink="#202625",muted="#56605D",border="#C8CECB",pale="#F4F6F5";
 let y=94;
 const clean=(value:string)=>value.replace(/\0/g,"").replace(/\r\n?/g,"\n");
 const text=(value:string,x:number,top:number,size=9,bold=false,color=ink)=>{
  doc.font(bold?"bold":"regular").fontSize(size).fillColor(color).text(clean(value),x,top,{lineBreak:false});
 };
 const wrap=(value:string,w:number,size=9,bold=false):string[]=>{
  doc.font(bold?"bold":"regular").fontSize(size);
  const output:string[]=[];
  for(const paragraph of clean(value).split("\n")){
   let line="";
   for(const word of paragraph.split(/\s+/).filter(Boolean)){
    const candidate=line?`${line} ${word}`:word;
    if(doc.widthOfString(candidate)<=w){line=candidate;continue;}
    if(line){output.push(line);line="";}
    for(const char of Array.from(word)){
     if(line&&doc.widthOfString(line+char)>w){output.push(line);line="";}
     line+=char;
    }
   }
   output.push(line);
  }
  return output;
 };
 const lines=(values:string[],x:number,top:number,size=9,bold=false,color=ink,leading=13)=>values.forEach((value,index)=>text(value,x,top+index*leading,size,bold,color));
 const rule=(top:number,color=border)=>doc.moveTo(left,top).lineTo(left+width,top).lineWidth(0.6).strokeColor(color).stroke();
 const header=()=>{
  const brand=wrap(`${report.company} - Produção & Logística`,width,14,true);
  lines(brand,left,25,14,true,green,17);
  const titleY=25+brand.length*17+8;
  text("ROMANEIO DE EXPEDIÇÃO DE MATERIAIS",left,titleY,12,true);
  rule(titleY+22,green);y=titleY+34;
 };
 const newPage=()=>{doc.addPage();header();};
 const ensure=(height:number)=>{if(y+height>bottom)newPage();};
 const section=(label:string)=>{ensure(45);text(label,left,y,8.5,true,green);y+=19;};
 const flowBox=(label:string,value:string)=>{
  const content=wrap(value,width-22,9);let offset=0;
  while(offset<content.length){
   ensure(56);
   const count=Math.min(content.length-offset,Math.max(1,Math.floor((bottom-y-28)/12)));
   const height=26+count*12;
   doc.roundedRect(left,y,width,height,5).fillAndStroke(pale,border);
   text(offset?`${label} · continuação`:label,left+11,y+6,8,true,muted);
   lines(content.slice(offset,offset+count),left+11,y+20,9,false,ink,12);
   y+=height+7;offset+=count;
   if(offset<content.length)newPage();
  }
 };
 const fields=(entries:{label:string;value:string}[])=>{
  const gap=12,cell=(width-gap*(entries.length-1))/entries.length;
  const content=entries.map(entry=>wrap(entry.value,cell-20,9));
  const height=24+Math.max(...content.map(value=>value.length))*11;
  if(height>190){entries.forEach(entry=>flowBox(entry.label,entry.value));return;}
  ensure(height+6);
  entries.forEach((entry,index)=>{
   const x=left+index*(cell+gap);
   doc.roundedRect(x,y,cell,height,4).lineWidth(0.6).strokeColor(border).stroke();
   text(entry.label,x+10,y+6,7.5,true,muted);lines(content[index],x+10,y+19,9,false,ink,11);
  });y+=height+6;
 };
 header();
 const emission=new Date(report.created_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",hour12:false});
 fields([{label:"Nº DO ROMANEIO / EMISSÃO",value:report.id},{label:"DATA / HORA · BRASÍLIA",value:emission}]);
 fields([{label:"REMESSA",value:report.kit_id},{label:"OPERADOR RESPONSÁVEL",value:report.operator_name||"Nome não cadastrado"}]);
 if(report.operator_id&&!report.operator_name){text(`Identificação do autor da emissão: ${report.operator_id}`,left,y,7,false,muted);y+=17;}
 if(report.is_reversed)flowBox("ENVIO ESTORNADO","Documento original preservado. Este envio foi estornado e não representa uma saída válida.");
 else if(!report.operation_id)flowBox("SEM NOVO ENVIO","Conferência registrada sem saída de materiais e sem baixa de estoque.");
 y+=3;section("DESTINATÁRIO / ENTREGA");
 const c=report.contact;
 fields([{label:"FACÇÃO / COSTUREIRO",value:report.workshop},{label:"CONTATO · TELEFONE / WHATSAPP",value:c?.phone?.trim()||"Não informado"}]);
 const street=c?[c.street?.trim(),c.address_number?.trim()].filter(Boolean).join(", "):"";
 const address=c?[street,c.address_complement?.trim(),c.neighborhood?.trim(),[c.city?.trim(),c.state?.trim()].filter(Boolean).join(" / "),c.postal_code?.trim()?`CEP ${c.postal_code.trim()}`:""].filter(Boolean).join(" · "):"";
 fields([{label:"ENDEREÇO COMPLETO DE ENTREGA",value:address||"Não informado"}]);
 fields([{label:"PEDIDO / MODELO DA BOLSA",value:`${report.order}\nModelo: ${report.model}`},{label:"QUANTIDADE TOTAL DO KIT",value:`${formatQuantity(report.bag_quantity)} bolsas`}]);
 y+=3;section("MATERIAIS DESTA EMISSÃO");
 const columns=[194,37,98,98,width-427];
 let tableHeaderPage=doc.page;
 const tableHeader=()=>{
  tableHeaderPage=doc.page;
  doc.rect(left,y,width,30).fill(pale);rule(y);let x=left;
  ["Item / Material","Un.","Qtd. prevista","Qtd. enviada","Conferência"].forEach((title,index)=>{text(title,x+6,y+9,7.5,true,muted);x+=columns[index];});
  rule(y+30);y+=30;
 };
 const tablePage=()=>{newPage();section("MATERIAIS DESTA EMISSÃO · CONTINUAÇÃO");tableHeader();};
 ensure(70);tableHeader();
 for(const item of report.items){
  if(tableHeaderPage!==doc.page){ensure(70);tableHeader();}
  const sent=item.mode!=="pending"&&/[1-9]/.test(item.quantity);
  const content=[wrap(item.label,columns[0]-12,9,true),wrap(item.unit,columns[1]-12,8),wrap(formatQuantity(item.expected_quantity),columns[2]-12,8),wrap(formatQuantity(item.quantity),columns[3]-12,8),[sent?"OK":"Pendente"]];
  let offset=0;const total=Math.max(...content.map(value=>value.length));
  while(offset<total){
   if(bottom-y<42)tablePage();
   const count=Math.min(total-offset,Math.max(1,Math.floor((bottom-y-16)/13))),height=count*13+16;
   let x=left;
   content.forEach((values,index)=>{
    if(index===4&&offset===0){
     doc.rect(x+6,y+9,9,9).lineWidth(0.7).strokeColor(ink).stroke();
     if(sent)doc.moveTo(x+8,y+13).lineTo(x+10,y+16).lineTo(x+14,y+11).lineWidth(1).stroke();
     text(values[0],x+19,y+8,7.5,true);
    }else lines(values.slice(offset,offset+count),x+6,y+8,index===0?9:8,index===0);
    x+=columns[index];
   });
   y+=height;rule(y);offset+=count;if(offset<total)tablePage();
  }
  if(item.response_text){y+=6;flowBox("ANOTAÇÃO DO ITEM",item.response_text);}
 }
 y+=8;
 const legend="Previsto = planejamento da remessa. Enviado = quantidade adicional nesta emissão. OK confirma o envio informado, inclusive parcial; não declara o kit completo. Vazio/Pendente = sem envio. Não somar unidades diferentes.";
 const legendLines=wrap(legend,width,7);ensure(legendLines.length*11+16);lines(legendLines,left,y,7,false,muted,11);y+=legendLines.length*11+14;
 section("ANOTAÇÕES DA PRODUÇÃO / INSTRUÇÕES ESPECIAIS DE COSTURA");
 flowBox("OBSERVAÇÕES / INSTRUÇÕES",[report.note||"Sem anotações registradas.",report.kit_note?`Remessa: ${report.kit_note}`:""].filter(Boolean).join("\n"));
 // Mantém espaço manuscrito e protocolo juntos, apenas na última página.
 ensure(144);
 doc.roundedRect(left,y,width,58,4).lineWidth(0.6).strokeColor(border).stroke();
 text("OBSERVAÇÕES NO ATO DA ENTREGA",left+10,y+6,8,true,muted);
 [y+32,y+47].forEach(top=>doc.moveTo(left+10,top).lineTo(left+width-10,top).lineWidth(0.35).strokeColor(border).stroke());
 y+=74;
 const signatureY=Math.max(y+17,bottom-48),half=(width-28)/2;
 [left,left+half+28].forEach(x=>doc.moveTo(x,signatureY).lineTo(x+half,signatureY).lineWidth(0.7).strokeColor(ink).stroke());
 lines(wrap("Assinatura / Visto do Entregador (Motorista)",half,8),left,signatureY+7,8,false,muted,11);
 lines(wrap("Assinatura / Recebido por (Facção / Costureiro)",half,8),left+half+28,signatureY+7,8,false,muted,11);
 text("Data do recebimento: ____ / ____ / ______",left+half+28,signatureY+33,8);
 const pages=doc.bufferedPageRange();
 for(let page=pages.start;page<pages.start+pages.count;page++){
  doc.switchToPage(page);
  const bottomMargin=doc.page.margins.bottom;doc.page.margins.bottom=0;
  rule(doc.page.height-43);
  text("BagSync · Contato e endereço conforme cadastro atual da facção.",left,doc.page.height-32,6.7,false,muted);
  text(`Página ${page+1} de ${pages.count}`,left+width-76,doc.page.height-32,7,false,muted);
  doc.page.margins.bottom=bottomMargin;
 }
 doc.end();return result;
}
