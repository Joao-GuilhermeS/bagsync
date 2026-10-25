import test from "node:test";
import assert from "node:assert/strict";
import {parseComposition} from "../src/lib/operations/validation.ts";
const id="11111111-1111-4111-8111-111111111111";
const form=(values)=>{const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;};
const base={operation:"insert",bag_id:id,material_id:id,quantity:"0,125",company_id:"empresa-injetada",role:"gerente_logistico"};
test("composição preserva decimal e ignora empresa/perfil do cliente",()=>{
 assert.deepEqual(parseComposition(form(base)),{operation:"insert",bag_id:id,material_id:id,quantity:"0.125"});
 assert.equal(parseComposition(form({...base,operation:"update",quantity:"9007199254740993.123456789"})).quantity,"9007199254740993.123456789");
});
test("quantidades e referências inválidas são rejeitadas",()=>{
 for(const quantity of ["0","-1","NaN","Infinity","1e3"])assert.throws(()=>parseComposition(form({...base,quantity})));
 assert.throws(()=>parseComposition(form({...base,bag_id:"outra"})));
 assert.throws(()=>parseComposition(form({...base,material_id:""})));
 assert.throws(()=>parseComposition(form({...base,operation:"upsert"})));
});
test("remover item exige confirmação e não aceita quantidade como instrução",()=>{
 assert.throws(()=>parseComposition(form({...base,operation:"delete"})));
 assert.equal(parseComposition(form({...base,operation:"delete",confirm:"sim",quantity:"invalida"})).quantity,null);
});
