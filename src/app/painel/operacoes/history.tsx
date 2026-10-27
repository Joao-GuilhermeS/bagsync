import {FormDrawer} from "@/components/ui/drawer";
import {DownloadButton} from "../exportacoes/download";
import {randomUUID} from "node:crypto";
import Link from "next/link";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {Operation,OperationOptions} from "@/lib/operations/types";
import {operationWarnings} from "@/lib/operations/data";
import {operationLabels,formatQuantity,type OperationKind} from "@/lib/operations/validation";
import {TransactionForm} from "./transaction-form";
import {Pagination} from "./pagination";
export async function History({client,company,manager,options,page=1,orderId,workshopId,paginationQuery}:{client:SupabaseClient;company:string;manager:boolean;options:OperationOptions;page?:number;orderId?:string;workshopId?:string;paginationQuery?:Record<string,string>}) {
 let query=client.from("inventory_operations").select("id,kind,order_id,workshop_id,reversal_of,note,created_at,result",{count:"exact"}).eq("company_id",company);
 if(orderId)query=query.eq("order_id",orderId);
 if(workshopId)query=query.eq("workshop_id",workshopId);
 const result=await query.order("created_at",{ascending:false}).order("id").range((page-1)*25,page*25-1);
 if(result.error)throw new Error("Falha ao consultar histórico.");const ops=result.data as unknown as Operation[];
 let reversed=new Set<string>();const lines:{operation_id:string;material_id:string|null;bag_id:string|null;quantity:string}[]=[];
 if(ops.length){
  const ids=ops.map(o=>o.id);
  const r=await client.from("inventory_operations").select("reversal_of").eq("company_id",company).in("reversal_of",ids);
  if(r.error)throw new Error("Falha ao consultar estornos.");reversed=new Set(r.data.map(o=>o.reversal_of));
  for(let offset=0;;offset+=500){
   const l=await client.from("stock_movements").select("operation_id,material_id,bag_id,quantity::text").eq("company_id",company).in("operation_id",ids).order("id").range(offset,offset+499);
   if(l.error)throw new Error("Falha ao consultar lançamentos.");lines.push(...l.data as unknown as typeof lines);if(l.data.length<500)break;
  }
 }
 return <div className="space-y-4">{!ops.length&&<p className="rounded-xl border bg-white p-6">Nenhuma operação registrada nesta página.</p>}{ops.map(o=><article key={o.id} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{operationLabels[o.kind as OperationKind]??o.kind}</h3><time className="text-sm text-slate-600">{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(o.created_at))}</time></div>{o.order_id&&<Link className="mt-2 block text-sm text-teal-800 underline" href={`/painel/pedidos/${o.order_id}`}>{options.orders.find(p=>p.id===o.order_id)?.name??"Abrir pedido"}</Link>}{o.workshop_id&&<p className="mt-2 text-sm">Facção: {options.workshops.find(w=>w.id===o.workshop_id)?.name??"Não disponível"}</p>}<ul className="my-3 space-y-1 text-sm">{lines.filter(l=>l.operation_id===o.id).map((l,i)=><li key={i}>{l.material_id?options.materials.find(m=>m.id===l.material_id)?.name:options.bags.find(b=>b.id===l.bag_id)?.name}: <strong>{formatQuantity(l.quantity)}</strong></li>)}</ul>{o.note&&<p className="my-2 whitespace-pre-wrap break-words text-sm text-slate-600">{o.note}</p>}<p className="break-all text-xs text-slate-500">Referência: {o.id}</p><div className="mt-3"><DownloadButton url={`/painel/exportacoes/romaneio/${o.id}`} filename={`romaneio-${o.id}.pdf`} label="Baixar romaneio PDF"/></div>{o.reversal_of&&<p className="mt-2 break-all text-xs text-slate-600">Estorno de: {o.reversal_of}</p>}{reversed.has(o.id)&&<p className="mt-2 text-sm font-medium text-slate-600">Operação estornada. Registro original preservado.</p>}{operationWarnings(o.result).map((warning,i)=><p key={i} className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Aviso no lançamento: {warning}</p>)}{manager&&o.kind!=="reversal"&&!reversed.has(o.id)&&<div className="mt-4"><FormDrawer title="Confirmar estorno" trigger="Estornar esta operação" variant="danger" description="O lançamento original será preservado. Confirme o estorno integral antes de continuar."><TransactionForm task="operation" requestKey={randomUUID()} kinds={["reversal"]} options={options} reversalOf={o.id}/></FormDrawer></div>}</article>)}<Pagination page={page} count={result.count??0} query={paginationQuery}/></div>;
}
