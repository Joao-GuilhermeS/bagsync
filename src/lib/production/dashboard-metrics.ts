export type ModelMetrics = {
 id: string;
 name: string;
 ordered: string;
 inProduction: string;
 ready: string;
};
type Order = {bag_id:string;expected_quantity:string};
type Production = {bag_id:string;remaining_quantity:string;received_quantity:string};

function quantity(value:string):bigint {
 if(!/^\d+(?:\.0+)?$/.test(value))throw new Error("Quantidade de bolsas inválida no dashboard.");
 return BigInt(value.split(".")[0]);
}

/** Pedidos são somados separadamente dos contextos de facção, evitando multiplicação. */
export function modelMetrics(models:readonly {id:string;name:string}[],orders:readonly Order[],production:readonly Production[]):ModelMetrics[] {
 const totals=new Map(models.map(model=>[model.id,{...model,ordered:BigInt(0),inProduction:BigInt(0),ready:BigInt(0)}]));
 for(const order of orders){
  const model=totals.get(order.bag_id);
  if(!model)throw new Error("Modelo do pedido indisponível.");
  model.ordered+=quantity(order.expected_quantity);
 }
 for(const row of production){
  const model=totals.get(row.bag_id);
  if(!model)throw new Error("Modelo da produção indisponível.");
  model.inProduction+=quantity(row.remaining_quantity);
  model.ready+=quantity(row.received_quantity);
 }
 return Array.from(totals.values(),row=>({...row,ordered:String(row.ordered),inProduction:String(row.inProduction),ready:String(row.ready)}))
  .sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")||a.id.localeCompare(b.id));
}

const normalized=(value:string)=>value.normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().toLocaleLowerCase("pt-BR");
export function matchingModels(models:readonly ModelMetrics[],search:string):ModelMetrics[] {
 const query=normalized(search);
 return models.filter(model=>normalized(model.name).includes(query));
}

export function summarizeModels(models:readonly ModelMetrics[]) {
 return models.reduce((total,model)=>({
  ordered:String(quantity(total.ordered)+quantity(model.ordered)),
  inProduction:String(quantity(total.inProduction)+quantity(model.inProduction)),
  ready:String(quantity(total.ready)+quantity(model.ready)),
 }),{ordered:"0",inProduction:"0",ready:"0"});
}

/** Converter apenas a proporção limitada da barra; os quantitativos continuam exatos. */
export function chartPercent(value:string,maximum:string):number {
 const amount=quantity(value),max=quantity(maximum);
 if(max===BigInt(0))return 0;
 return Number((amount>max?max:amount)*BigInt(10000)/max)/100;
}

/** Percentual calculado com inteiros, exibido em centésimos, sem limitar excedentes. */
export function completionPercent(value:string,ordered:string):string|null {
 const denominator=quantity(ordered);
 if(denominator===BigInt(0))return null;
 const hundredths=quantity(value)*BigInt(10000)/denominator;
 return `${hundredths/BigInt(100)},${String(hundredths%BigInt(100)).padStart(2,"0")}%`;
}

/** Projeção limitada para o SVG; valores de negócio ficam nas strings originais. */
export function groupedChartData(models:readonly ModelMetrics[]) {
 let max=BigInt(0);
 for(const row of models)for(const key of ["ordered","inProduction","ready"] as const){
  const value=quantity(row[key]);if(value>max)max=value;
 }
 const step=max===BigInt(0)?BigInt(1):(max+BigInt(3))/BigInt(4);
 const axisMaximum=step*BigInt(4);
 const rows=models.map(row=>({
  ...row,
  orderedPlot:Number(quantity(row.ordered)*BigInt(1000000)/axisMaximum),
  inProductionPlot:Number(quantity(row.inProduction)*BigInt(1000000)/axisMaximum),
  readyPlot:Number(quantity(row.ready)*BigInt(1000000)/axisMaximum),
 }));
 return {rows,ticks:[0,250000,500000,750000,1000000],labels:Array.from({length:5},(_,index)=>String(step*BigInt(index)))};
}
