import test from "node:test";
import assert from "node:assert/strict";
import {parseChecklist} from "../src/lib/checklists/validation.ts";

const id="12345678-1234-1234-1234-123456789abc";
function form(changes={}) {
 const data=new FormData();
 for(const [key,value] of Object.entries({operation:"insert",id,bag_id:id,material_id:id,label:" Corpo ",position:"0",active:"sim",input_type:"checkbox",...changes}))data.set(key,value);
 return data;
}
test("checklist ignora empresa e perfil enviados pelo cliente",()=>{
 const result=parseChecklist(form({company_id:id,role:"gerente_logistico",quantity:"999"}));
 assert.deepEqual(result,{operation:"insert",id,bag_id:id,material_id:id,label:"Corpo",input_type:"checkbox",position:0,active:true});
});
test("checklist valida referências, posição e rótulo sem alterar quantidades de estoque",()=>{
 for(const changes of [{id:"invalido"},{bag_id:""},{material_id:"x"},{label:" "},{position:"-1"},{position:"1.5"},{position:"2147483648"},{position:"NaN"},{operation:"delete"}])assert.throws(()=>parseChecklist(form(changes)));
 assert.equal(parseChecklist(form({position:"2147483647"})).position,2147483647);
});
test("checklist permite edição e desativação explícita para novas remessas",()=>{
 const data=form({operation:"update"});data.delete("active");
 assert.equal(parseChecklist(data).active,false);
 assert.equal(parseChecklist(data).operation,"update");
});
test("tipo de resposta exige escolha e aceita texto livre sem convertê-lo em quantidade",()=>{
 assert.equal(parseChecklist(form({input_type:"text"})).input_type,"text");
 for(const input_type of ["","number","qualquer"]){assert.throws(()=>parseChecklist(form({input_type})));}
 const missing=form();missing.delete("input_type");assert.throws(()=>parseChecklist(missing));
});
