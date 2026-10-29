import test from "node:test";
import assert from "node:assert/strict";
import {incompleteKit,matchesExpeditionFilter} from "../src/lib/shipments/expedition-filters.ts";
const kit={itemCount:"4",pendingItems:"0",kitIncomplete:false,status:"transito"};
test("alerta manual e falta quantitativa mantêm kit incompleto independentemente da entrega",()=>{
 assert.equal(incompleteKit(kit),false);
 assert.equal(matchesExpeditionFilter({...kit,kitIncomplete:true},"incompletos"),true);
 assert.equal(matchesExpeditionFilter({...kit,pendingItems:"1"},"incompletos"),true);
 assert.equal(matchesExpeditionFilter({...kit,kitIncomplete:true},"transito"),true);
 assert.equal(incompleteKit({...kit,itemCount:"0"}),true);
});
test("filtros de transporte e todas preservam a seleção independente",()=>{
 assert.equal(matchesExpeditionFilter(kit,"todos"),true);
 assert.equal(matchesExpeditionFilter(kit,"transito"),true);
 assert.equal(matchesExpeditionFilter(kit,"pendentes"),false);
 assert.equal(matchesExpeditionFilter({...kit,status:"entregues"},"entregues"),true);
});
