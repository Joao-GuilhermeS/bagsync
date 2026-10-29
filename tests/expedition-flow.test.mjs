import test from "node:test";
import assert from "node:assert/strict";
import {parseExpedition,mapExpeditionAnswers,expeditionTransport} from "../src/lib/shipments/expedition.ts";
import {workshopContact} from "../src/lib/shipments/contact.ts";
const id="11111111-1111-4111-8111-111111111111",key="22222222-2222-4222-8222-222222222222",snapshotId="33333333-3333-4333-8333-333333333333";
const form=()=>{const data=new FormData();for(const [name,value] of Object.entries({intent:"emit",request_key:id,submission_key:key,order_id:id,workshop_id:id,bag_quantity:"100",due_on:"2026-11-10",template_item_id:id,expected_quantity:"10,5",mode:"complete",response_text:"",quantity:"0",note:"Observação",company_id:"outra"}))data.set(name,value);return data;};
test("preparação e emissão usam chaves distintas e não aceitam empresa do formulário",()=>{
 const parsed=parseExpedition(form());assert.equal(parsed.create.p_items[0].expected_quantity,"10.5");assert.equal(parsed.submissionKey,key);assert.equal(parsed.create.company_id,undefined);
 const invalid=form();invalid.set("submission_key",id);assert.throws(()=>parseExpedition(invalid));
});
test("previsão pendente não exige envio; emissão exige item com envio informado",()=>{
 const data=form();data.set("mode","pending");assert.throws(()=>parseExpedition(data));data.set("intent","draft");assert.deepEqual(parseExpedition(data).answers,[]);
 data.set("intent","emit");data.set("mode","partial");data.set("quantity","0");assert.throws(()=>parseExpedition(data));
 data.set("quantity","2,75");data.set("response_text","Texto 500 livre");assert.equal(parseExpedition(data).answers[0].quantity,"2.75");assert.equal(parseExpedition(data).answers[0].text,"Texto 500 livre");
});
test("respostas usam IDs do snapshot criado, sem alterar o template ou inferir texto",()=>{
 const answers=parseExpedition(form()).answers;const mapped=mapExpeditionAnswers(answers,[{id:snapshotId,template_item_id:id}]);
 assert.equal(mapped[0].kit_item_id,snapshotId);assert.equal(answers[0].kit_item_id,id);assert.equal(mapped[0].mode,"complete");
 assert.throws(()=>mapExpeditionAnswers(answers,[]));assert.throws(()=>mapExpeditionAnswers(answers,[{id:snapshotId,template_item_id:key}]));
});
test("status logístico considera complementos, entregas parciais e estornos",()=>{
 assert.equal(expeditionTransport([]),"pendentes");assert.equal(expeditionTransport(["estornado"]),"pendentes");
 assert.equal(expeditionTransport(["entregue","a_entregar"]),"transito");assert.equal(expeditionTransport(["entregue","estornado"]),"entregues");assert.equal(expeditionTransport(["a_entregar"]),"transito");
});
test("atalhos codificam endereço, preservam telefone internacional e não inventam DDD",()=>{
 const workshop={name:"Facção",phone:"(85) 99999-1234",street:"Rua A & B",address_number:"10",address_complement:"",neighborhood:"Centro",city:"Quixadá",state:"CE",postal_code:"63900-000"};
 const contact=workshopContact(workshop);assert.equal(contact.whatsapp,"https://wa.me/5585999991234");assert.equal(new URL(contact.map).searchParams.get("query"),contact.address);assert.equal(contact.telephone,"tel:85999991234");
 assert.equal(workshopContact({...workshop,phone:"99999-1234"}).whatsapp,null);assert.equal(workshopContact({...workshop,phone:"+351 912345678"}).whatsapp,"https://wa.me/351912345678");assert.equal(workshopContact({...workshop,phone:"javascript:alert(1)"}).telephone,null);
});
