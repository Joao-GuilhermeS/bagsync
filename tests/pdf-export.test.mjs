import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {generateWaybill} from "../src/lib/exports/pdf.ts";
test("romaneio gera PDF com acentos, nota longa e várias páginas sem dados de produção",async()=>{
 const op={id:"11111111-1111-4111-8111-111111111111",company:"EXEMPLO DE TESTE - NÃO É DOCUMENTO REAL",kind:"material_delivery",created_at:"2026-10-25T12:30:00Z",order_id:"pedido",order_name:"Pedido de validação - bolsas Maracanaú",workshop_id:"faccao",workshop_name:"Facção São José - Confecção",reversal_of:null,is_reversed:true,note:"Observação de teste: acentuação, precisão e paginação. ".repeat(40),warnings:[{code:"saldo_negativo",balance:"-0.125"}],items:Array.from({length:90},(_,i)=>({name:`Material de validação ${String(i+1).padStart(3,"0")} - Tecido, alça e zíper para confecção de bolsas`,unit:"m",quantity:i%2?"-9007199254740993.123456789":"-0.125"}))};
 const bytes=await generateWaybill(op,"2026-10-25T15:00:00Z");assert.equal(bytes.subarray(0,5).toString(),"%PDF-");assert.ok(bytes.length>5000);
 await mkdir("tmp/pdfs",{recursive:true});await writeFile("tmp/pdfs/romaneio-validacao.pdf",bytes);
});
