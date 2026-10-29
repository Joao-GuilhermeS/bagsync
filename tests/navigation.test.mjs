import test from "node:test";
import assert from "node:assert/strict";
import {navigationFor,navigationLocation,driverStep} from "../src/lib/navigation.ts";
test("páginas profundas mantêm a seção e o item de menu corretos",()=>{
 const groups=navigationFor("gerente_logistico");
 assert.equal(navigationLocation("/painel/cadastros/bolsas/id/checklist",groups).item.label,"Modelos de bolsas");
 assert.equal(navigationLocation("/painel/estoque/bolsas",groups).group,"Produto final");
 assert.equal(navigationLocation("/painel/expedicao/id/preencher",groups).item.label,"Expedição");
 assert.equal(navigationLocation("/painel",groups).item.label,"Visão geral");
});
test("menu do entregador prioriza a operação sem mudar as permissões do backend",()=>{
 const groups=navigationFor("motorista");const catalog=groups.find(g=>g.label==="Cadastros");
 assert.deepEqual(catalog.items.map(item=>item.href),["/painel/cadastros/faccoes","/painel/cadastros/bolsas"]);
 assert.equal(new Set(groups.flatMap(g=>g.items.map(i=>i.href))).size,groups.flatMap(g=>g.items).length);
});
test("etapas do entregador acompanham modelo, facção e operação",()=>{
 assert.equal(driverStep("/painel/entregador"),1);assert.equal(driverStep("/painel/entregador/modelo"),2);assert.equal(driverStep("/painel/entregador/modelo/faccao"),3);
});
