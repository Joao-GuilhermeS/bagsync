import test from "node:test";
import assert from "node:assert/strict";
import {positiveQuantity,formatQuantity,parseOrder,parseOperation,allowedOperation} from "../src/lib/operations/validation.ts";
const id="11111111-1111-4111-8111-111111111111";
const form=values=>{const f=new FormData();for(const [key,val] of Object.entries(values)){for(const item of Array.isArray(val)?val:[val])f.append(key,item);}return f;};
test("decimais preservam precisão, aceitam vírgula e normalizam sem Number",()=>{
 assert.equal(positiveQuantity("0002,5000"),"2.5");assert.equal(positiveQuantity("9007199254740993.000000000000000001"),"9007199254740993.000000000000000001");
 for(const q of ["0","0.0","NaN","Infinity","-1","1e3","1.000,50","1,2,3",null])assert.throws(()=>positiveQuantity(q));
 assert.throws(()=>positiveQuantity("1.5",true));assert.equal(positiveQuantity("0012",true),"12");
});
test("formatação pt-BR não perde decimais nem sinal de saldo",()=>{
 assert.equal(formatQuantity("9007199254740993.123456789"),"9.007.199.254.740.993,123456789");assert.equal(formatQuantity("-2.5"),"-2,5");
});
test("pedido e operação ignoram empresa e autor enviados pelo cliente",()=>{
 const order=parseOrder(form({request_key:id,name:" Pedido ",bag_id:id,expected_quantity:"5",company_id:"outra",created_by:"outro"}));
 assert.equal(order.p_name,"Pedido");assert.equal(order.p_expected_quantity,"5");assert.ok(!("company_id" in order));
 const op=parseOperation(form({request_key:id,kind:"bag_receipt",kit_id:id,order_id:id,workshop_id:id,quantity:"2",bag_id:"injetado"}));
 assert.deepEqual(op.p_items,[{quantity:"2"}]);assert.ok(!("bag_id" in op));
});
test("materiais devem ter quantidades correspondentes e não podem se repetir",()=>{
 const base={request_key:id,kind:"material_entry",material_id:[id,id],material_quantity:["1","2"]};assert.throws(()=>parseOperation(form(base)));
 assert.throws(()=>parseOperation(form({...base,material_quantity:["1"]})));
 const op=parseOperation(form({request_key:id,kind:"material_delivery",order_id:id,workshop_id:id,material_id:id,material_quantity:"0,5"}));assert.equal(op.p_items[0].quantity,"0.5");
});
test("estorno exige confirmação e referências; perfil não concede ações extras",()=>{
 assert.throws(()=>parseOperation(form({request_key:id,kind:"reversal",reversal_of:id})));
 assert.equal(parseOperation(form({request_key:id,kind:"reversal",reversal_of:id,confirm:"sim"})).p_reversal_of,id);
 for(const kind of ["material_entry","reversal"])assert.equal(allowedOperation("motorista",kind),false);
 for(const kind of ["material_entry","material_delivery","bag_receipt","reversal"]) {assert.equal(allowedOperation("gestor",kind),false);assert.equal(allowedOperation("gerente_logistico",kind),true);}
 assert.equal(allowedOperation("motorista","bag_receipt"),true);
 assert.throws(()=>parseOperation(form({request_key:id,kind:"constructor"})));
});
