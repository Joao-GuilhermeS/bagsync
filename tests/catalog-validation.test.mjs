import test from "node:test";
import assert from "node:assert/strict";
import {isCatalog,validateCatalog,catalogError,pageNumber} from "../src/lib/catalogs/validation.ts";
const form=(values)=>{const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;};
test("lista de cadastros nega nomes arbitrários e propriedades herdadas",()=>{for(const name of ["companies","company_users","constructor","__proto__"])assert.equal(isCatalog(name),false);assert.equal(isCatalog("materiais"),true);});
test("payload permite somente os campos aprovados e não recebe empresa/perfil do formulário",()=>{assert.deepEqual(validateCatalog("bolsas",form({name:" Bolsa ",company_id:"outra",role:"gestor",id:"arbitrario"})),{name:"Bolsa"});});
test("nome e símbolo não podem ser vazios; material precisa de UUID de unidade",()=>{assert.throws(()=>validateCatalog("faccoes",form({name:" "})));assert.throws(()=>validateCatalog("unidades",form({name:"Metro",symbol:" "})));assert.throws(()=>validateCatalog("materiais",form({name:"Tecido",unit_id:"invalido"})));assert.deepEqual(validateCatalog("unidades",form({name:" Metro ",symbol:" m "})),{name:"Metro",symbol:"m"});});
test("paginação limita valores inválidos e mensagens não expõem detalhes do banco",()=>{for(const value of [undefined,"-1","0","1.5","1e3","999999999999999999"])assert.equal(pageNumber(value),1);assert.equal(pageNumber("2"),2);assert.ok(catalogError("23503").includes("vinculado"));assert.equal(catalogError("erro_interno_com_detalhes"),"Não foi possível concluir a operação. Tente novamente.");});
