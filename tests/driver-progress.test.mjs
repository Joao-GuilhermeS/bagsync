import test from "node:test";
import assert from "node:assert/strict";
import {sumBagMovements} from "../src/lib/production/driver-progress.ts";
test("recolhimentos parciais e estornos são somados sem duplicar o original",()=>{
 assert.equal(sumBagMovements(["200","150","-200"]),"150");
 assert.equal(sumBagMovements([]),"0");
});
test("total de bolsas preserva inteiros grandes e rejeita frações reais ou valores especiais",()=>{
 assert.equal(sumBagMovements(["9007199254740993","7.00"]),"9007199254741000");
 for(const value of ["0.5","NaN","Infinity","2,5",""])assert.throws(()=>sumBagMovements([value]));
});
