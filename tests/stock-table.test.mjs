import test from "node:test";
import assert from "node:assert/strict";
import {compareBalances,balanceStatus,compareStockNames} from "../src/lib/stock/table.ts";
test("ordena saldos exatos sem perder unidades decimais ou inteiros grandes",()=>{
 const values=["9007199254740993.001","-554","2.000","0.0001","9007199254740993.002","-0.001"];
 assert.deepEqual(values.sort(compareBalances),["-554","-0.001","0.0001","2.000","9007199254740993.001","9007199254740993.002"]);
 assert.equal(compareBalances("1.2","1.200"),0);
});
test("saldo zero é neutro e valores negativos continuam sinalizados",()=>{
 assert.equal(balanceStatus("-0.000"),"zero");assert.equal(balanceStatus("0.000"),"zero");
 assert.equal(balanceStatus("-0.001"),"negativo");assert.equal(balanceStatus("0.001"),"positivo");
});
test("ordena nomes em português e usa ID como desempate estável",()=>{
 const row=(id,name)=>({id,name,unit:"m",balance:"0"});
 const rows=[row("3","zíper"),row("2","Alça"),row("1","alça"),row("4","Castelinho")];
 assert.deepEqual(rows.sort(compareStockNames).map(row=>row.id),["1","2","4","3"]);
});
