import test from "node:test";
import assert from "node:assert/strict";
import {activeWorkshopCount} from "../src/lib/production/dashboard-scope.ts";
test("facções ativas são distintas entre pedidos e modelos filtrados",()=>{
 const rows=[{bag_id:"a",workshop_id:"x",remaining_quantity:"10"},{bag_id:"a",workshop_id:"x",remaining_quantity:"20"},{bag_id:"b",workshop_id:"x",remaining_quantity:"5"},{bag_id:"b",workshop_id:"y",remaining_quantity:"2"},{bag_id:"a",workshop_id:"z",remaining_quantity:"0"}];
 assert.equal(activeWorkshopCount(rows,[{id:"a"}]),1);assert.equal(activeWorkshopCount(rows,[{id:"a"},{id:"b"}]),2);assert.equal(activeWorkshopCount(rows,[]),0);
});
