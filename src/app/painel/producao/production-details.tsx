"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {DownloadButton} from "../exportacoes/download";
import {ProductionNoteForm} from "./note-form";
import {FormDrawer} from "@/components/ui/drawer";
import {LoadingRegion,Skeleton} from "@/components/ui/skeleton";
import {Badge} from "@/components/ui/badge";
import {formatQuantity} from "@/lib/operations/validation";
import {historyKinds,type HistoryKind} from "@/lib/production/tracking-validation";
import type {ProductionHistory,ProductionRow} from "@/lib/production/tracking-types";
const labels={distributions:"Distribuições",receipts:"Recolhimentos",notes:"Observações"};
const roles={gerente_logistico:"Gerente Logístico",motorista:"Motorista",gestor:"Gestor"};
const date=(value:string|null|undefined)=>value?new Date(value).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"—";

export function ProductionDetails({bag,row}:{bag:string;row:ProductionRow}) {
 const [opened,setOpened]=useState(false),[kind,setKind]=useState<HistoryKind>("distributions");
 const [data,setData]=useState<ProductionHistory|null>(null),[pending,setPending]=useState(false),[error,setError]=useState("");
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function load(next:HistoryKind,page:number){
  controller.current?.abort();const current=new AbortController();controller.current=current;setPending(true);setError("");
  try{
   const query=new URLSearchParams({modelo:bag,pedido:row.order_id,faccao:row.workshop_id,tipo:next,pagina:String(page)});
   const response=await fetch(`/painel/producao/historico?${query}`,{cache:"no-store",signal:current.signal});const body=await response.json();
   if(!response.ok)throw new Error(typeof body.error==="string"?body.error:"Não foi possível consultar o histórico.");
   if(controller.current===current)setData(body as ProductionHistory);
  }catch(reason){if(!current.signal.aborted)setError(reason instanceof Error?reason.message:"Falha na consulta.");}
  finally{if(controller.current===current)setPending(false);}
 }
 const close=()=>{controller.current?.abort();setOpened(false);setPending(false);};
 return <FormDrawer title="Histórico de produção" description={`${row.workshop_name} · ${row.order_name}`} trigger="Histórico" triggerLabel={`Histórico: ${row.workshop_name} — ${row.order_name}`} variant="secondary" icon="history" compactOnMobile onOpen={()=>{setOpened(true);void load(kind,1);}} onClose={close}>
  {opened&&<div className="space-y-4">
   <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs"><div><p className="text-slate-500">Distribuídas</p><strong className="mt-1 block break-all tabular-nums">{formatQuantity(row.distributed_quantity)}</strong></div><div><p className="text-slate-500">Recolhidas</p><strong className="mt-1 block break-all tabular-nums">{formatQuantity(row.received_quantity)}</strong></div><div><p className="text-slate-500">Pendentes</p><strong className="mt-1 block break-all tabular-nums">{formatQuantity(row.remaining_quantity)}</strong></div></div>
   {row.has_excess&&<p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-950">Recolhido acima da quantidade distribuída: {formatQuantity(row.excess_quantity)} bolsas. Confira remessas e estornos.</p>}
   {row.unstarted_kit_count!=="0"&&<p className="text-xs text-slate-500">{row.unstarted_kit_count} remessa(s) sem saída válida, fora do total distribuído.</p>}
   <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de histórico">{historyKinds.map(value=><button type="button" key={value} aria-pressed={kind===value} onClick={()=>{setKind(value);void load(value,1);}} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${kind===value?"bg-mint text-olive":"border bg-white text-slate-600 hover:bg-slate-50"}`}>{labels[value]}{value==="notes"&&<span className="ml-1 text-slate-500">({data?.kind==="notes"?data.count:row.note_count})</span>}</button>)}</div>
   {pending&&<LoadingRegion label="Carregando histórico…" className="space-y-3">{[1,2,3].map(index=><Skeleton key={index} className="h-24"/>)}</LoadingRegion>}
   {error&&<div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm"><p>{error}</p><button type="button" className="mt-2 min-h-11 text-olive underline" onClick={()=>void load(kind,data?.kind===kind?data.page:1)}>Tentar novamente</button></div>}
   {!pending&&data?.kind===kind&&<div className="space-y-4">
    {!data.rows.length&&<p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">Nenhum registro neste histórico.</p>}
    <ol className="ml-2 space-y-4 border-l pl-5">{data.rows.map(event=><li key={event.id} className="relative"><span className="absolute top-4 -left-[1.6rem] size-2.5 rounded-full border-2 border-white bg-olive" aria-hidden="true"/><article className="space-y-2 rounded-xl border bg-white p-4 text-sm">
     <time className="block text-xs text-slate-500">{date(event.created_at)}</time>
     {kind==="distributions"?<><p className="font-semibold">{formatQuantity(event.quantity??"0")} bolsas na remessa</p><p className="text-xs text-slate-600">Primeira saída válida: {date(event.distributed_at)}</p>{event.distributed_at?<p className="text-xs text-slate-500">{event.delivery_count} envio(s) válido(s) · Último: {date(event.last_delivery_at)}</p>:<Badge tone="pending">Sem envio válido</Badge>}<Link href={`/painel/expedicao/${event.id}`} className="btn-secondary text-xs">Consultar remessa e materiais</Link></>:kind==="receipts"?<><p className="font-semibold">{formatQuantity(event.quantity??"0")} bolsas recolhidas</p>{event.is_reversed&&<Badge tone="danger">Estornado · fora do total recolhido</Badge>}{event.note&&<p className="whitespace-pre-wrap break-words">{event.note}</p>}<DownloadButton url={`/painel/exportacoes/romaneio/${event.id}`} filename={`romaneio-${event.id}.pdf`} label="Baixar romaneio do recolhimento"/></>:<><Badge>{event.created_role?roles[event.created_role]:"Perfil não informado"}</Badge><p className="whitespace-pre-wrap break-words">{event.note}</p></>}
    </article></li>)}</ol>
    <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={data.page<=1} onClick={()=>void load(kind,data.page-1)} className="btn-secondary text-xs">Anterior</button><span className="text-xs text-slate-500" role="status">Página {data.page} · {data.count} registro(s)</span><button type="button" disabled={data.page*25>=data.count} onClick={()=>void load(kind,data.page+1)} className="btn-secondary text-xs">Próxima</button></div>
   </div>}
   {kind==="notes"&&<ProductionNoteForm order={row.order_id} workshop={row.workshop_id} onSaved={()=>void load("notes",1)}/>}
  </div>}
 </FormDrawer>;
}
