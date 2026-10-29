import test from "node:test";
import assert from "node:assert/strict";
import {parseShipment} from "../src/lib/checklists/shipment-validation.ts";
const id="12345678-1234-1234-1234-123456789abc";
function form(){
 const data=new FormData();
 for(const [key,value] of Object.entries({request_key:id,order_id:id,workshop_id:id,bag_quantity:"1000",due_on:"2026-11-10",template_item_id:id,expected_quantity:"001,2500",note:" Observação livre ",company_id:"outra",created_by:"outro"}))data.set(key,value);
 return data;
}
test("remessa preserva precisão, previsões manuais e anotações sem aceitar empresa/autor do cliente",()=>{
 assert.deepEqual(parseShipment(form()),{p_request_key:id,p_order_id:id,p_workshop_id:id,p_bag_quantity:"1000",p_items:[{template_item_id:id,expected_quantity:"1.25"}],p_note:"Observação livre",p_due_on:"2026-11-10"});
});
test("remessa rejeita previsão ausente, referência inválida e quantidade de bolsas fracionária",()=>{
 for(const [key,value] of [["request_key","x"],["order_id",""],["workshop_id","x"],["bag_quantity","1.5"],["expected_quantity","0"],["expected_quantity","NaN"]]){const data=form();data.set(key,value);assert.throws(()=>parseShipment(data));}
 const missing=form();missing.delete("expected_quantity");assert.throws(()=>parseShipment(missing));
});
test("remessa rejeita itens repetidos mesmo com UUID em outra capitalização",()=>{
 const data=form();data.append("template_item_id",id.toUpperCase());data.append("expected_quantity","5");assert.throws(()=>parseShipment(data));
});
