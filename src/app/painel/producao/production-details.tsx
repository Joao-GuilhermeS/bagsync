"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {DownloadButton} from "../exportacoes/download";
import {ProductionNoteForm} from "./note-form";
import {formatQuantity} from "@/lib/operations/validation";
import {historyKinds,type HistoryKind} from "@/lib/production/tracking-validation";
import type {ProductionHistory} from "@/lib/production/tracking-types";
const labels={distributions:"Distribuições",receipts:"Recolhimentos",notes:"Observações"};
const roles={gerente_logistico:"Gerente Logístico",motorista:"Motorista",gestor:"Gestor"};
function date(value:string|null|undefined){return value?new Date(value).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"—";}
export function ProductionDetails({bag,order,workshop,noteCount}:{bag:string;order:string;workshop:string;noteCount:string}) {
 const [opened,setOpened]=useState(false);const [kind,setKind]=useState<HistoryKind>("distributions");
 const [data,setData]=useState<ProductionHistory|null>(null);const [pending,setPending]=useState(false);const [error,setError]=useState("");
 const controller=useRef<AbortController|null>(null);useEffect(()=>()=>controller.current?.abort(),[]);
 async function load(next:HistoryKind,page:number){
  controller.current?.abort();const current=new AbortController();controller.current=current;setPending(true);setError("");
  try{
   const query=new URLSearchParams({modelo:bag,pedido:order,faccao:workshop,tipo:next,pagina:String(page)});
   const response=await fetch(`/painel/producao/historico?${query}`,{cache:"no-store",signal:current.signal});const body=await response.json();
   if(!response.ok)throw new Error(typeof body.error==="string"?body.error:"Não foi possível consultar o histórico.");
   if(controller.current===current)setData(body as ProductionHistory);
  }catch(reason){if(!current.signal.aborted)setError(reason instanceof Error?reason.message:"Falha na consulta.");}
  finally{if(controller.current===current)setPending(false);}
 }
 return <details onToggle={event=>{const open=event.currentTarget.open;setOpened(open);if(open)void load(kind,1);else controller.current?.abort();}} className="rounded-lg border bg-slate-50 p-3"><summary className="min-h-11 cursor-pointer py-2 font-medium text-teal-900">Histórico e {noteCount} observação(ões)</summary>{opened&&<div className="mt-3"><div className="flex flex-wrap gap-2" aria-label="Tipo de histórico">{historyKinds.map(value=><button type="button" key={value} aria-pressed={kind===value} onClick={()=>{setKind(value);void load(value,1);}} className={`min-h-11 rounded-lg border px-4 ${kind===value?"bg-teal-800 text-white":"bg-white text-slate-900"}`}>{labels[value]}</button>)}</div>{pending&&<p role="status" className="my-3">Carregando histórico…</p>}{error&&<div role="alert" className="my-3 rounded-lg bg-amber-50 p-3"><p>{error}</p><button type="button" className="min-h-11 underline" onClick={()=>void load(kind,data?.kind===kind?data.page:1)}>Tentar novamente</button></div>}{data?.kind===kind&&<div className="mt-4 space-y-3">{!data.rows.length&&!pending&&<p>Nenhum registro neste histórico.</p>}{data.rows.map(row=><article key={row.id} className="space-y-2 rounded-lg border bg-white p-4">{kind==="distributions"?<><p className="font-semibold">{formatQuantity(row.quantity??"0")} bolsas</p><p className="text-sm">Preparada em: {date(row.created_at)}</p><p className="text-sm">Primeira saída válida: {date(row.distributed_at)}</p>{row.distributed_at?<p className="text-sm">Envios válidos: {row.delivery_count} · Último envio/complemento: {date(row.last_delivery_at)}</p>:<p className="text-sm text-amber-950">Sem envio válido. Não entra no total distribuído.</p>}<Link href={`/painel/remessas/${row.id}`} className="inline-block min-h-11 py-3 text-teal-800 underline">Consultar remessa e materiais</Link></>:kind==="receipts"?<><p className="font-semibold">{formatQuantity(row.quantity??"0")} bolsas · {date(row.created_at)}</p>{row.is_reversed&&<p className="font-medium text-amber-950">Estornado — não conta no total recolhido.</p>}{row.note&&<p className="whitespace-pre-wrap break-words text-sm">{row.note}</p>}<DownloadButton url={`/painel/exportacoes/romaneio/${row.id}`} filename={`romaneio-${row.id}.pdf`} label="Baixar romaneio do recolhimento"/></>:<><p className="text-sm text-slate-600">{date(row.created_at)} · {row.created_role?roles[row.created_role]:"Perfil não informado"}</p><p className="whitespace-pre-wrap break-words">{row.note}</p></>}</article>)}<div className="flex flex-wrap items-center justify-between gap-3"><button disabled={pending||data.page<=1} onClick={()=>void load(kind,data.page-1)} className="min-h-11 rounded-lg border bg-white px-4 disabled:opacity-40">Anterior</button><span className="text-sm">Página {data.page} · {data.count} registro(s)</span><button disabled={pending||data.page*25>=data.count} onClick={()=>void load(kind,data.page+1)} className="min-h-11 rounded-lg border bg-white px-4 disabled:opacity-40">Próxima</button></div></div>}{kind==="notes"&&<ProductionNoteForm order={order} workshop={workshop} onSaved={()=>void load("notes",1)}/>}</div>}</details>;
}
