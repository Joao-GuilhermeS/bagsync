import test from "node:test";
import assert from "node:assert/strict";
import {exportFilters,csvCell,generateCsv,exportQuantity} from "../src/lib/exports/core.ts";
test("datas do período incluem dia de Brasília e rejeitam datas impossíveis",()=>{
 const f=exportFilters(new URLSearchParams("inicio=2026-10-25&fim=2026-10-25"));assert.equal(f.p_since,"2026-10-25T03:00:00.000Z");assert.equal(f.p_until,"2026-10-26T03:00:00.000Z");
 for(const query of ["inicio=2026-02-30","inicio=2026-10-26&fim=2026-10-25","inicio=25/10/2026","empresa=outra","pedido=invalido","inicio=2026-10-25&inicio=2026-10-26"])assert.throws(()=>exportFilters(new URLSearchParams(query)));
});
test("CSV protege fórmulas e escapa aspas, quebras e delimitadores",()=>{
 for(const v of ["=1+1","+cmd","-cmd","@SUM(A1)","  =1","\t=cmd","\n+cmd"])assert.ok(csvCell(v).startsWith('"\''));
 assert.equal(csvCell('Facção; "São José"\nCostura'),'"Facção; ""São José""\nCostura"');assert.equal(csvCell("-2,5",true),'"-2,5"');
});
test("extrato vazio tem cabeçalho; valores exatos e originais estornados são preservados",()=>{
 assert.ok(generateCsv([]).startsWith("\uFEFF"));
 const csv=generateCsv([{id:"id",company:"RL Bolsas",kind:"material_delivery",created_at:"2026-10-25T03:00:00Z",order_id:"p",order_name:"=pedido",workshop_id:"f",workshop_name:"Facção São José",reversal_of:null,is_reversed:true,note:'Teste; "nota"',warnings:[],items:[{name:"Tecido",unit:"m",quantity:"-9007199254740993.123456789"}]}]);
 assert.ok(csv.includes("-9007199254740993,123456789"));assert.ok(csv.includes("Estornada"));assert.ok(csv.includes("'="));
 assert.throws(()=>exportQuantity("=1+1"));
});
