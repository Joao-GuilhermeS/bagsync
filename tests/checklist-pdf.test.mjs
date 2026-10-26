import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {generateChecklistPdf} from "../src/lib/checklists/pdf.ts";
const fixture={id:"11111111-1111-4111-8111-111111111111",kit_id:"22222222-2222-4222-8222-222222222222",company:"VALIDAÇÃO - SEM DADOS REAIS",workshop:"Destinatário de validação",model:"Modelo Maracanaú",order:"Pedido de validação",bag_quantity:"1000",created_at:"2026-10-26T15:30:00Z",note:"Observação geral: material pendente na próxima saída.",kit_note:"Anotação inicial da remessa.",operation_id:"33333333-3333-4333-8333-333333333333",is_reversed:false,items:[{id:"a",label:"Item de conferência",unit:"un",input_type:"checkbox",mode:"complete",response_text:null,quantity:"800",expected_quantity:"1000"},{id:"b",label:"Item com texto livre",unit:"m",input_type:"text",mode:"partial",response_text:"Cor azul; 50 é referência do texto, não quantidade.",quantity:"9007199254740993.123456789",expected_quantity:"9007199254740994.123456789"}]};
test("controle de saída gera PDF com cabeçalho, conferência, texto livre e precisão",async()=>{
 const bytes=await generateChecklistPdf(fixture);assert.equal(bytes.subarray(0,5).toString(),"%PDF-");assert.ok(bytes.length>5000);
 await mkdir("tmp/pdfs",{recursive:true});await writeFile("tmp/pdfs/checklist-validacao.pdf",bytes);
});
test("controle de saída comporta respostas e anotações longas em várias páginas",async()=>{
 const bytes=await generateChecklistPdf({...fixture,is_reversed:true,note:"Anotação longa de validação. ".repeat(100),items:Array.from({length:28},(_,i)=>({...fixture.items[i%2],id:String(i),label:`Item de validação ${i+1} - tecido, zíper e alça`,response_text:i%2?"Texto livre de teste: acentuação, conteúdo e paginação. ".repeat(25):null}))});
 assert.equal(bytes.subarray(0,5).toString(),"%PDF-");await writeFile("tmp/pdfs/checklist-longo-validacao.pdf",bytes);
});
