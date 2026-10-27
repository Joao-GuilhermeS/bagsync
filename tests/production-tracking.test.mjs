import test from "node:test";
import assert from "node:assert/strict";
import {parseProductionNote,parseTrackingHistory} from "../src/lib/production/tracking-validation.ts";
import {canAccess} from "../src/lib/auth/authorization.ts";
const id="12345678-1234-1234-1234-123456789abc";
test("os três perfis registram observações sem ampliar permissão de estoque do gestor",()=>{
 for(const role of ["gerente_logistico","motorista","gestor"]){
  const context={userId:id,companyId:"empresa",role};assert.equal(canAccess(context,"empresa","registrar_observacao_producao"),true);
  assert.equal(canAccess(context,"alheia","registrar_observacao_producao"),false);
 }
 const gestor={userId:id,companyId:"empresa",role:"gestor"};
 assert.equal(canAccess(gestor,"empresa","gerenciar_operacoes"),false);assert.equal(canAccess(gestor,"empresa","registrar_entrega_recebimento"),false);
 assert.equal(canAccess(null,"empresa","registrar_observacao_producao"),false);
});
test("observação aceita texto e ignora empresa, autor e perfil forjados",()=>{
 const form=new FormData();for(const [key,value] of Object.entries({request_key:id,order_id:id,workshop_id:id,note:" Observação\ncom detalhes ",company_id:"alheia",created_by:"outro",created_role:"gerente_logistico"}))form.set(key,value);
 assert.deepEqual(parseProductionNote(form),{p_request_key:id,p_order_id:id,p_workshop_id:id,p_note:"Observação\ncom detalhes"});
 form.set("note"," ");assert.throws(()=>parseProductionNote(form));form.set("note","Texto");form.set("order_id","invalido");assert.throws(()=>parseProductionNote(form));
});
test("histórico valida contexto, tipo e página sem aceitar filtros arbitrários ou repetidos",()=>{
 const params=new URLSearchParams({modelo:id,pedido:id,faccao:id,tipo:"receipts",pagina:"2"});
 assert.deepEqual(parseTrackingHistory(params),{p_bag_id:id,p_order_id:id,p_workshop_id:id,p_kind:"receipts",p_page:2});
 for(const [field,value] of [["tipo","arbitrario"],["pagina","0"],["pagina","1000001"],["pagina","1.5"],["modelo","outro"]]){const changed=new URLSearchParams(params);changed.set(field,value);assert.throws(()=>parseTrackingHistory(changed));}
 const repeated=new URLSearchParams(params);repeated.append("pedido",id);assert.throws(()=>parseTrackingHistory(repeated));
 const extra=new URLSearchParams(params);extra.set("company_id",id);assert.throws(()=>parseTrackingHistory(extra));
});
