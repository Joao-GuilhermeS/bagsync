import test from "node:test";
import assert from "node:assert/strict";
import {businessDate,addDays,validDate,deadlineState} from "../src/lib/deadlines/dates.ts";
import {parseDeadlineExtension} from "../src/lib/deadlines/validation.ts";
import {parseOperation} from "../src/lib/operations/validation.ts";
test("prazo usa data de Brasília, incluindo virada de dia e ano bissexto",()=>{
 assert.equal(businessDate(new Date("2026-10-30T01:00:00Z")),"2026-10-29");
 assert.equal(addDays("2028-02-28",1),"2028-02-29");assert.equal(addDays("2026-12-31",5),"2027-01-05");
 assert.equal(validDate("2026-02-29"),false);assert.equal(validDate("2026-13-01"),false);
});
test("classifica fronteiras de prazo e mantém legado sem data",()=>{
 assert.equal(deadlineState("2026-10-28","2026-10-29").status,"atrasado");
 assert.equal(deadlineState("2026-10-29","2026-10-29").label,"Vence hoje");
 assert.equal(deadlineState("2026-10-30","2026-10-29").label,"Vence amanhã");
 assert.equal(deadlineState("2026-10-31","2026-10-29").status,"a_vencer");
 assert.equal(deadlineState("2026-11-01","2026-10-29").status,"no_prazo");
 assert.equal(deadlineState(null,"2026-10-29").status,"sem_prazo");
});
test("prorrogação exige motivo e referências, sem aceitar empresa do navegador",()=>{
 const id="11111111-1111-4111-8111-111111111111";const form=new FormData();
 for(const [key,value] of Object.entries({request_key:id,kit_id:id,due_on:"2026-11-20",expected_due_on:"2026-11-10",reason:" Acordo com a facção ",company_id:"injetado"}))form.set(key,value);
 const parsed=parseDeadlineExtension(form);assert.equal(parsed.p_reason,"Acordo com a facção");assert.equal(parsed.company_id,undefined);
 form.set("reason"," ");assert.throws(()=>parseDeadlineExtension(form));
});
test("novo recolhimento exige remessa explícita",()=>{
 const id="11111111-1111-4111-8111-111111111111";const form=new FormData();
 for(const [key,value] of Object.entries({request_key:id,kind:"bag_receipt",order_id:id,workshop_id:id,quantity:"10"}))form.set(key,value);
 assert.throws(()=>parseOperation(form));form.set("kit_id",id);assert.equal(parseOperation(form).p_kit_id,id);
});
