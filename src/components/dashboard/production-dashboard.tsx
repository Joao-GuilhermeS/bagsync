"use client";

import dynamic from "next/dynamic";
import {useId,useMemo,useState} from "react";
import {completionPercent,matchingModels,summarizeModels,type ModelMetrics} from "@/lib/production/dashboard-metrics";
import {formatQuantity} from "@/lib/operations/validation";
import {Icon} from "../ui/icon";
import {ModelSelect} from "./model-select";
import {dashboardStages,type DashboardStage} from "./dashboard-config";

const ProductionChart=dynamic(()=>import("./production-chart").then(module=>module.ProductionChart),{
 ssr:false,
 loading:()=> <div className="h-80 animate-pulse rounded-xl bg-slate-100" role="status"><span className="sr-only">Carregando gráfico…</span></div>,
});

export function ProductionDashboard({models}:{models:ModelMetrics[]}) {
 const id=useId();
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState("");
 const [stage,setStage]=useState<DashboardStage|null>(null);
 const matches=useMemo(()=>matchingModels(models,search),[models,search]);
 const filtered=useMemo(()=>selected?matches.filter(model=>model.id===selected):matches,[matches,selected]);
 const totals=summarizeModels(filtered);
 const completion=completionPercent(totals.ready,totals.ordered);
 const toggle=(value:DashboardStage)=>setStage(current=>current===value?null:value);
 const scope=selected?filtered[0]?.name??"Modelo indisponível":search.trim()?`${matches.length} modelo(s) encontrado(s)`:"Todos os modelos";

 return <div className="mb-6 space-y-5">
  <section aria-label="Filtros do dashboard" className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
   <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
    <div className="min-w-0"><label htmlFor={`${id}-search`} className="mb-2 block text-xs font-medium text-slate-600">Pesquisar modelo</label><div className="relative"><Icon name="bag" className="pointer-events-none absolute top-4 left-3 size-4 text-slate-400"/><input id={`${id}-search`} type="search" placeholder="Digite o nome do modelo..." value={search} onChange={event=>{setSearch(event.target.value);setSelected("");}} className="field-input pl-10 text-base sm:text-sm"/></div></div>
    <ModelSelect models={matches} value={selected} onChange={setSelected}/>
    <button type="button" className="min-h-12 rounded-lg px-3 text-sm text-slate-500 underline-offset-4 hover:bg-slate-50 hover:text-forest hover:underline disabled:opacity-40" disabled={!search&&!selected&&!stage} onClick={()=>{setSearch("");setSelected("");setStage(null);}}>Limpar filtros</button>
   </div>
  </section>

  <section aria-label="Métricas principais" className="grid gap-4 sm:grid-cols-3">
   {dashboardStages.map(item=><button key={item.key} type="button" aria-pressed={stage===item.key} aria-controls={`${id}-chart`} onClick={()=>toggle(item.key)} className={`min-w-0 rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors hover:border-olive/50 sm:p-6 ${stage===item.key?"border-forest ring-1 ring-forest/15":""}`}>
    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-500">{item.label}</span><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint/70 text-forest"><Icon name={item.icon}/></span></div>
    <p className="mt-3 break-all text-3xl font-semibold tracking-tight text-forest tabular-nums lg:text-4xl">{formatQuantity(totals[item.key])}</p>
    <div className="mt-3 flex min-h-6 flex-wrap items-center gap-2 text-xs text-slate-500">{item.key==="ready"?<><span className="rounded-full bg-mint px-2 py-1 font-medium text-forest">{completion??"—"}</span><span>{completion?"do total em pedido":"Sem previsão cadastrada"}</span></>:item.key==="inProduction"?<><span aria-hidden="true" className={`size-1.5 rounded-full ${totals.inProduction!=="0"?"bg-olive":"bg-slate-300"}`}/><span>{totals.inProduction!=="0"?"Produção ativa":"Sem bolsas em produção"}</span></>:<span>{item.description}</span>}</div>
   </button>)}
  </section>

  <section id={`${id}-chart`} aria-labelledby={`${id}-title`} className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
   <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 id={`${id}-title`} className="text-base font-semibold text-forest">Panorama da produção</h2><p className="mt-1 break-words text-xs text-slate-500" role="status">{scope} · {filtered.length} de {models.length} modelo(s)</p></div><span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-500">Quantidades em bolsas</span></div>
   <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar etapas do gráfico">
    <button type="button" aria-pressed={stage===null} onClick={()=>setStage(null)} className={`min-h-11 rounded-lg border px-3 text-xs ${stage===null?"border-forest bg-mint/50 text-forest":"text-slate-500"}`}>Todas as etapas</button>
    {dashboardStages.map(item=><button key={item.key} type="button" aria-pressed={stage===item.key} onClick={()=>toggle(item.key)} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs ${stage===item.key?"border-forest bg-mint/50 text-forest":"text-slate-500 hover:bg-slate-50"}`}><span aria-hidden="true" className="size-2 rounded-full" style={{background:item.color}}/>{item.label}</button>)}
   </div>
   {filtered.length?<ProductionChart key={`${search}:${selected}`} models={filtered} stage={stage}/>:<div className="grid min-h-80 place-items-center rounded-xl border border-dashed p-8 text-center"><div><Icon name="chart" className="mx-auto mb-4 size-8 text-slate-300"/><h3 className="font-semibold text-forest">{models.length?"Nenhum resultado encontrado":"Nenhum modelo cadastrado"}</h3><p className="mt-2 text-sm text-slate-500">{models.length?"Tente outro nome ou limpe os filtros.":"Cadastre modelos e pedidos para acompanhar os quantitativos."}</p></div></div>}
   <p className="mt-4 text-xs leading-relaxed text-slate-500">Pedido geral é a referência. Produção e prontas não devem ser somadas ao pedido. Prontas são bolsas recolhidas, com estornos considerados.</p>
  </section>
 </div>;
}
