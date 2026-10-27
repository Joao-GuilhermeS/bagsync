import Link from "next/link";
import {randomUUID} from "node:crypto";
import type {SupabaseClient} from "@supabase/supabase-js";
import {Badge} from "@/components/ui/badge";
import {FormDrawer} from "@/components/ui/drawer";
import {formatQuantity} from "@/lib/operations/validation";
import {Pagination} from "../operacoes/pagination";
import {DeliveryConfirmationForm} from "./confirmation-form";
export async function DispatchList({client,company,canConfirm,order,workshop,page=1,status="a_entregar",preview=false}:{client:SupabaseClient;company:string;canConfirm:boolean;order?:string;workshop?:string;page?:number;status?:string;preview?:boolean}) {
 const size=preview?5:25;
 let query=client.from("shipment_dispatches").select("submission_id,kit_id,order_id,workshop_id,bag_quantity::text,issued_at,delivered_at,delivery_note,delivery_status",{count:"exact"}).eq("company_id",company).eq("delivery_status",status);
 if(order)query=query.eq("order_id",order);if(workshop)query=query.eq("workshop_id",workshop);
 const result=await query.order("issued_at",{ascending:false}).order("submission_id").range((page-1)*size,page*size-1);
 if(result.error)throw new Error("Não foi possível consultar os romaneios para entrega.");
 const [orders,workshops]=result.data.length?await Promise.all([
  client.from("production_orders").select("id,name").eq("company_id",company).in("id",result.data.map(row=>row.order_id)),
  client.from("workshops").select("id,name").eq("company_id",company).in("id",result.data.map(row=>row.workshop_id)),
 ]):[];
 if(orders?.error||workshops?.error)throw new Error("Não foi possível carregar os destinatários.");
 const date=(raw:string)=>new Date(raw).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
 const filters={estado:status,...(order?{pedido:order}:{}),...(workshop?{faccao:workshop}:{})};
 return <div className="space-y-4">{!result.data.length&&<p className="surface p-5 text-sm">{status==="a_entregar"?"Nenhum romaneio emitido aguardando entrega neste contexto. A Expedição precisa concluir uma saída com materiais antes da entrega.":"Nenhum romaneio neste estado."}</p>}{result.data.map(row=><article key={row.submission_id} className="surface space-y-3 p-5"><Badge tone={status==="entregue"?"success":status==="estornado"?"danger":"pending"}>{status==="entregue"?"Entregue":status==="estornado"?"Estornado":"A entregar"}</Badge><h3 className="break-words font-semibold">{workshops?.data?.find(w=>w.id===row.workshop_id)?.name}</h3><p className="break-words text-sm">{orders?.data?.find(o=>o.id===row.order_id)?.name} · Remessa para {formatQuantity(String(row.bag_quantity))} bolsas</p><p className="text-xs text-slate-500">Romaneio {row.submission_id.slice(0,8)} · Emitido em {date(row.issued_at)}</p>{row.delivered_at&&<p className="text-sm">Recebido na facção em {date(row.delivered_at)}</p>}{row.delivery_note&&<p className="whitespace-pre-wrap break-words text-sm">{row.delivery_note}</p>}<div className="flex flex-wrap gap-2"><Link href={`/painel/expedicao/${row.kit_id}/preenchimentos/${row.submission_id}/pdf`} target="_blank" rel="noreferrer" className="btn-secondary">Romaneio PDF</Link>{canConfirm&&status==="a_entregar"&&<FormDrawer title="Confirmar entrega de materiais" trigger="Confirmar entrega"><DeliveryConfirmationForm submissionId={row.submission_id} requestKey={randomUUID()}/></FormDrawer>}</div></article>)}{preview?(result.count??0)>size&&<Link href={`/painel/entregas?${new URLSearchParams(filters)}`} className="inline-block py-3 text-forest underline">Ver todas as entregas</Link>:<Pagination page={page} count={result.count??0} query={filters}/>}</div>;
}
