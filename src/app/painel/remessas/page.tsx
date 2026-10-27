import Link from "next/link";
import {Suspense} from "react";
import {workspace} from "@/lib/operations/data";
import {pageNumber} from "@/lib/catalogs/validation";
import {isUuid} from "@/lib/catalogs/validation";
import {notFound} from "next/navigation";
import {formatQuantity} from "@/lib/operations/validation";
import {Pagination} from "../operacoes/pagination";

type Props={searchParams:Promise<{pagina?:string;pedido?:string;faccao?:string}>};
async function Shipments({searchParams}:Props) {
 const {access,client}=await workspace();const search=await searchParams;const page=pageNumber(search.pagina);
 if((search.pedido&&!isUuid(search.pedido))||(search.faccao&&!isUuid(search.faccao)))notFound();
 let query=client.from("shipment_kits").select("id,order_id,workshop_id,bag_quantity::text,created_at",{count:"exact"}).eq("company_id",access.companyId);
 if(search.pedido)query=query.eq("order_id",search.pedido);if(search.faccao)query=query.eq("workshop_id",search.faccao);
 const kits=await query.order("created_at",{ascending:false}).order("id").range((page-1)*25,page*25-1);
 if(kits.error)throw new Error("Não foi possível consultar as remessas.");
 const ids=kits.data.map(k=>k.id);
 const [orders,workshops,status]=ids.length?await Promise.all([
  client.from("production_orders").select("id,name").eq("company_id",access.companyId).in("id",kits.data.map(k=>k.order_id)),
  client.from("workshops").select("id,name").eq("company_id",access.companyId).in("id",kits.data.map(k=>k.workshop_id)),
  client.from("shipment_kit_status").select("kit_id,status,pending_items").eq("company_id",access.companyId).in("kit_id",ids)
 ]):[];
 if(orders?.error||workshops?.error||status?.error)throw new Error("Não foi possível consultar o resumo das remessas.");
 return <section><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">Expedição</h1>{access.role==="gerente_logistico"&&<Link href="/painel/expedicao/nova" className="min-h-11 rounded-lg bg-teal-800 px-4 py-3 text-white">Nova remessa</Link>}</div><p className="my-4 text-slate-600">Prepare a remessa, preencha o checklist e emita o romaneio. A emissão baixa o estoque e disponibiliza os materiais para entrega. Criar a previsão não movimenta estoque.</p><div className="mt-6 space-y-4">{!ids.length&&<p className="rounded-xl border bg-white p-5">Nenhuma remessa nesta página.</p>}{kits.data.map(k=>{const progress=status?.data?.find(s=>s.kit_id===k.id);return <Link key={k.id} href={`/painel/expedicao/${k.id}`} className="block rounded-xl border bg-white p-5 hover:border-teal-700"><h2 className="break-words text-xl font-semibold">{orders?.data?.find(o=>o.id===k.order_id)?.name}</h2><p className="mt-2 break-words">{workshops?.data?.find(w=>w.id===k.workshop_id)?.name}</p><p className="mt-2">{formatQuantity(String(k.bag_quantity))} bolsas · {new Date(k.created_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})}</p><p className="mt-3 font-medium text-teal-900">{progress?.status==="completo"?"Kit completo":`Kit incompleto · ${progress?.pending_items??"—"} item(ns) pendente(s)`}</p></Link>;})}<Pagination page={page} count={kits.count??0} query={{...(search.pedido?{pedido:search.pedido}:{}),...(search.faccao?{faccao:search.faccao}:{})}}/></div></section>;
}
export default function ShipmentsPage(props:Props){return <Suspense fallback={<p role="status">Carregando remessas…</p>}><Shipments {...props}/></Suspense>;}
