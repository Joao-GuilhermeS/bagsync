import test from "node:test";
import assert from "node:assert/strict";
import {parseDeliveryConfirmation} from "../src/lib/shipments/delivery-validation.ts";
import {allowedOperation} from "../src/lib/operations/validation.ts";
const id="11111111-1111-4111-8111-111111111111";
const form=values=>{const data=new FormData();for(const [key,value] of Object.entries(values))data.set(key,value);return data;};
test("confirmação aceita somente chave, romaneio e nota sem confiar em empresa ou autor",()=>{
 assert.deepEqual(parseDeliveryConfirmation(form({request_key:id,submission_id:id,note:" Recebido ",company_id:"outra",created_by:"outro",quantity:"999"})),{p_request_key:id,p_submission_id:id,p_note:"Recebido"});
});
test("confirmação rejeita referência inválida e nota excessiva",()=>{
 assert.throws(()=>parseDeliveryConfirmation(form({request_key:id,submission_id:"invalido"})));
 assert.throws(()=>parseDeliveryConfirmation(form({request_key:id,submission_id:id,note:"x".repeat(2001)})));
});
test("motorista recolhe bolsas mas não emite baixa na Expedição",()=>{
 assert.equal(allowedOperation("motorista","material_delivery"),false);
 assert.equal(allowedOperation("motorista","bag_receipt"),true);
 assert.equal(allowedOperation("gerente_logistico","material_delivery"),true);
});
