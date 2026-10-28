"use client";

import {useState,useSyncExternalStore} from "react";
import {Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {completionPercent,groupedChartData,type ModelMetrics} from "@/lib/production/dashboard-metrics";
import {formatQuantity} from "@/lib/operations/validation";
import {dashboardStages,type DashboardStage} from "./dashboard-config";
import {Icon} from "../ui/icon";

const reducedQuery="(prefers-reduced-motion: reduce)";
const subscribeMotion=(listener:()=>void)=>{
 const media=window.matchMedia(reducedQuery);media.addEventListener("change",listener);
 return ()=>media.removeEventListener("change",listener);
};
const motionSnapshot=()=>window.matchMedia(reducedQuery).matches;
const serverMotion=()=>true;
type ChartRow=ReturnType<typeof groupedChartData>["rows"][number];

function ModelTooltip({active,row,stage}:{active?:boolean;row?:ChartRow;stage:DashboardStage|null}) {
 if(!active||!row)return null;
 return <div role="status" aria-live="polite" className="max-w-[min(21rem,calc(100vw-3rem))] rounded-xl border bg-white p-4 text-sm shadow-lg">
  <p className="mb-3 break-words font-semibold text-forest">{row.name}</p>
  <div className="space-y-3">{dashboardStages.filter(item=>!stage||stage===item.key).map(item=><div key={item.key}>
   <p className="flex items-center gap-2 text-xs text-slate-500"><span aria-hidden="true" className="size-2 rounded-full" style={{background:item.color}}/>{item.label}</p>
   <p className="mt-1 break-words font-semibold tabular-nums">{formatQuantity(row[item.key])} bolsas <span className="font-normal text-slate-500">· {completionPercent(row[item.key],row.ordered)??"Sem previsão"}{row.ordered!=="0"?" do pedido":""}</span></p>
  </div>)}</div>
 </div>;
}

export function ProductionChart({models,stage}:{models:ModelMetrics[];stage:DashboardStage|null}) {
 const reduced=useSyncExternalStore(subscribeMotion,motionSnapshot,serverMotion);
 const [requestedPage,setPage]=useState(0);
 const {rows,ticks,labels}=groupedChartData(models);
 const page=Math.min(requestedPage,Math.max(Math.ceil(rows.length/6)-1,0));
 const visible=rows.slice(page*6,page*6+6);
 const stages=dashboardStages.filter(item=>!stage||stage===item.key);

 return <div>
  <div className="overflow-x-auto rounded-lg focus-visible:outline-offset-2" tabIndex={0} role="region" aria-label="Gráfico de quantidades por modelo; role horizontalmente se necessário">
   <div className="h-80 w-full" style={{minWidth:Math.max(300,visible.length*150)}}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:600,height:320}}>
     <BarChart data={visible} margin={{top:14,right:12,bottom:10,left:4}} barGap={5} accessibilityLayer>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5"/>
      <XAxis dataKey="id" axisLine={false} tickLine={false} interval={0} tickMargin={14} tick={{fontSize:12,fill:"#64748b"}} tickFormatter={value=>{const name=visible.find(row=>row.id===value)?.name??"";return name.length>18?`${name.slice(0,17)}…`:name;}}/>
      <YAxis domain={[0,1000000]} ticks={ticks} axisLine={false} tickLine={false} width={78} tick={{fontSize:11,fill:"#64748b"}} tickFormatter={value=>formatQuantity(labels[ticks.indexOf(value)]??"0")}/>
      <Tooltip cursor={{fill:"var(--mint)",fillOpacity:0.35}} content={info=><ModelTooltip active={info.active} row={info.payload?.[0]?.payload as ChartRow|undefined} stage={stage}/>}/>
      {stages.map(item=><Bar key={item.key} dataKey={`${item.key}Plot`} name={item.label} fill={item.color} radius={[5,5,0,0]} maxBarSize={46} isAnimationActive={!reduced} animationDuration={350} animationEasing="ease-out"/>)}
     </BarChart>
    </ResponsiveContainer>
   </div>
  </div>
  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p>Modelos {page*6+1}–{page*6+visible.length} de {rows.length} · unidade: bolsas</p>{rows.length>6&&<div className="flex gap-2"><button type="button" aria-label="Modelos anteriores" disabled={page===0} className="btn-secondary min-h-11 px-3 py-2" onClick={()=>setPage(page-1)}><Icon name="back" className="size-4"/></button><button type="button" aria-label="Próximos modelos" disabled={(page+1)*6>=rows.length} className="btn-secondary min-h-11 px-3 py-2" onClick={()=>setPage(page+1)}><Icon name="arrow" className="size-4"/></button></div>}</div>
  <details className="mt-4 border-t pt-3"><summary className="min-h-11 py-3 text-xs font-medium text-slate-500">Ver quantidades exatas em tabela</summary><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Quantidades dos modelos desta página do gráfico</caption><thead><tr><th scope="col" className="py-3 pr-4">Modelo</th>{stages.map(item=><th key={item.key} scope="col" className="px-3 py-3 text-right">{item.label}</th>)}</tr></thead><tbody>{visible.map(row=><tr key={row.id} className="border-t"><th scope="row" className="py-3 pr-4 font-medium">{row.name}</th>{stages.map(item=><td key={item.key} className="px-3 py-3 text-right tabular-nums">{formatQuantity(row[item.key])}</td>)}</tr>)}</tbody></table></div></details>
 </div>;
}
