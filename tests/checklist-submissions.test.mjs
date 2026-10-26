import test from "node:test";
import assert from "node:assert/strict";
import {parseShipmentChecklist} from "../src/lib/checklists/shipment-validation.ts";
const id="12345678-1234-1234-1234-123456789abc";
function form(mode="partial",quantity="1,2500",response="Cor azul, referência 50") {
 const data=new FormData();for(const [key,value] of Object.entries({request_key:id,kit_id:id,kit_item_id:id,mode,quantity,response_text:response,note:" Observação ",company_id:"alheia",created_by:"outro"}))data.set(key,value);return data;
}
test("resposta livre preserva texto e quantidade separada sem aceitar identidade do formulário",()=>{
 assert.deepEqual(parseShipmentChecklist(form()),{p_request_key:id,p_kit_id:id,p_answers:[{kit_item_id:id,mode:"partial",text:"Cor azul, referência 50",quantity:"1.25"}],p_note:"Observação"});
});
test("conferência delega o saldo ao servidor e não usa quantidade manipulada",()=>{
 const answer=parseShipmentChecklist(form("complete","99999","")).p_answers[0];assert.equal(answer.mode,"complete");assert.equal(answer.quantity,undefined);
});
test("não enviado aceita texto sem gerar quantidade e rejeita valor contraditório",()=>{
 assert.deepEqual(parseShipmentChecklist(form("pending","0","Aguardando material")).p_answers[0],{kit_item_id:id,mode:"pending",text:"Aguardando material"});
 assert.throws(()=>parseShipmentChecklist(form("pending","1")));assert.throws(()=>parseShipmentChecklist(form("partial","0")));assert.throws(()=>parseShipmentChecklist(form("partial","NaN")));
});
test("respostas incompletas, duplicadas e referências inválidas são rejeitadas",()=>{
 const missing=form();missing.delete("quantity");assert.throws(()=>parseShipmentChecklist(missing));
 const duplicate=form();for(const [name,value] of [["kit_item_id",id.toUpperCase()],["mode","complete"],["quantity","0"],["response_text",""]])duplicate.append(name,value);assert.throws(()=>parseShipmentChecklist(duplicate));
 const invalid=form();invalid.set("kit_id","inválido");assert.throws(()=>parseShipmentChecklist(invalid));
});
