import test from "node:test";
import assert from "node:assert/strict";
import {modelMetrics,matchingModels,summarizeModels,chartPercent,completionPercent,groupedChartData} from "../src/lib/production/dashboard-metrics.ts";

const models=[{id:"a",name:"Maracanaú"},{id:"b",name:"Quixadá"},{id:"c",name:"Sem pedidos"}];
test("pedido conta uma vez; várias facções e pedidos compartilham o modelo",()=>{
 const result=modelMetrics(models,[{bag_id:"a",expected_quantity:"1000"},{bag_id:"a",expected_quantity:"200"},{bag_id:"b",expected_quantity:"400"}],[{bag_id:"a",remaining_quantity:"300",received_quantity:"200"},{bag_id:"a",remaining_quantity:"100",received_quantity:"100"},{bag_id:"b",remaining_quantity:"0",received_quantity:"0"}]);
 assert.deepEqual(result.find(row=>row.id==="a"),{id:"a",name:"Maracanaú",ordered:"1200",inProduction:"400",ready:"300"});
 assert.deepEqual(summarizeModels(result),{ordered:"1600",inProduction:"400",ready:"300"});
 assert.equal(result.find(row=>row.id==="c").ordered,"0");
});
test("recolhimento excedente não é limitado ao pedido nem descontado de outra facção",()=>{
 const result=modelMetrics(models,[{bag_id:"a",expected_quantity:"10"}],[{bag_id:"a",remaining_quantity:"0",received_quantity:"15"},{bag_id:"a",remaining_quantity:"5",received_quantity:"0"}]);
 assert.equal(result[0].ready,"15");assert.equal(result[0].inProduction,"5");
});
test("filtro ignora acentos e caixa, mantém modelos homônimos separados e aceita pesquisa vazia",()=>{
 const rows=modelMetrics([...models,{id:"d",name:"Maracanaú"}],[],[]);
 assert.equal(matchingModels(rows," MARACANAU ").length,2);
 assert.equal(matchingModels(rows,"quixada")[0].id,"b");
 assert.equal(matchingModels(rows,"").length,4);
 assert.deepEqual(summarizeModels(matchingModels(rows,"não existe")),{ordered:"0",inProduction:"0",ready:"0"});
});
test("totais acima do limite seguro continuam exatos e barras usam proporção limitada",()=>{
 const result=modelMetrics([{id:"a",name:"Modelo"}],[{bag_id:"a",expected_quantity:"9007199254740993"},{bag_id:"a",expected_quantity:"2.000"}],[]);
 assert.equal(result[0].ordered,"9007199254740995");
 assert.equal(chartPercent("9007199254740993","18014398509481986"),50);
 assert.equal(chartPercent("0","0"),0);assert.equal(chartPercent("12","10"),100);
 assert.equal(chartPercent("1","3"),33.33);
});
test("dados inválidos e referências ausentes não viram indicadores zero silenciosos",()=>{
 for(const value of ["-1","NaN","Infinity","1.5"]){assert.throws(()=>chartPercent(value,"10"));}
 assert.throws(()=>modelMetrics([], [{bag_id:"ausente",expected_quantity:"1"}],[]));
 assert.throws(()=>modelMetrics([],[],[{bag_id:"ausente",remaining_quantity:"1",received_quantity:"0"}]));
});
test("conclusão tem percentual exato, excedente e ausência de denominador",()=>{
 assert.equal(completionPercent("1","3"),"33,33%");
 assert.equal(completionPercent("15","10"),"150,00%");
 assert.equal(completionPercent("0","10"),"0,00%");
 assert.equal(completionPercent("2","0"),null);
 assert.equal(completionPercent("9007199254740993","9007199254740993"),"100,00%");
});
test("barras agrupadas projetam a geometria sem perder o valor exato do tooltip",()=>{
 const models=[{id:"a",name:"Modelo A",ordered:"9007199254740993",inProduction:"4503599627370496",ready:"4"}];
 const chart=groupedChartData(models);
 assert.equal(chart.rows[0].ordered,"9007199254740993");
 assert.equal(chart.rows[0].ready,"4");
 for(const key of ["orderedPlot","inProductionPlot","readyPlot"])assert.ok(Number.isSafeInteger(chart.rows[0][key])&&chart.rows[0][key]>=0&&chart.rows[0][key]<=1000000);
 assert.equal(BigInt(chart.labels[4])%BigInt(4),BigInt(0));
 assert.ok(BigInt(chart.labels[4])>=BigInt(models[0].ordered));
});
test("eixo usa intervalos inteiros em quantidades pequenas e dados vazios",()=>{
 assert.deepEqual(groupedChartData([]).labels,["0","1","2","3","4"]);
 const chart=groupedChartData([{id:"a",name:"A",ordered:"1",inProduction:"0",ready:"1"}]);
 assert.equal(chart.rows[0].orderedPlot,250000);
 assert.deepEqual(chart.labels,["0","1","2","3","4"]);
});
