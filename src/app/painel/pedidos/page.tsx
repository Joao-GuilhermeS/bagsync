import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import Link from "next/link";
import {workspace,operationOptions} from "@/lib/operations/data";
import {formatQuantity} from "@/lib/operations/validation";
import {pageNumber} from "@/lib/catalogs/validation";
import type {Order,Progress} from "@/lib/operations/types";
import {TransactionForm} from "../operacoes/transaction-form";
import {Pagination} from "../operacoes/pagination";
async function Orders({searchParams}:{searchParams:Promise<{pagina?:string}>}) {
 const {access,client}=await workspace();const page=pageNumber((await searchParams).pagina);
 const [options,result]=await Promise.all([operationOptions(client,access.companyId),client.from("production_orders").select("id,name,bag_id,expected_quantity::text,created_at",{count:"exact"}).eq("company_id",access.companyId).order("created_at",{ascending:false}).order("id").range((page-1)*25,page*25-1)]);
 if(result.error)throw new Error("Falha ao carregar pedidos.");const orders=result.data as unknown as Order[];
 let progress:Progress[]=[];
 if(orders.length){const r=await client.from("production_order_progress").select("order_id,expected_quantity::text,received_quantity::text,remaining_quantity::text,excess_receipt").eq("company_id",access.companyId).in("order_id",orders.map(o=>o.id));if(r.error)throw new Error("Falha ao carregar progresso.");progress=r.data as unknown as Progress[];}
 return <section><h1 className="text-3xl font-semibold">Pedidos de produção</h1><p className="my-3 text-slate-600">Pedidos simultâneos usam o estoque compartilhado da empresa. Cada pedido acompanha um modelo e pode receber de várias facções.</p><div className={`mt-6 grid items-start gap-6 ${access.role==="gerente_logistico"?"lg:grid-cols-[minmax(0,1fr)_22rem]":""}`}><div className="space-y-4">{!orders.length&&<p className="rounded-xl border bg-white p-6">Nenhum pedido nesta página.</p>}{orders.map(o=>{const pr=progress.find(p=>p.order_id===o.id);return <Link href={`/painel/pedidos/${o.id}`} key={o.id} className="block rounded-xl border bg-white p-5 hover:border-teal-700"><h2 className="break-words text-xl font-semibold">{o.name}</h2><p className="mt-2 text-sm text-slate-600">{options.bags.find(b=>b.id===o.bag_id)?.name}</p><p className="mt-3">Previsto: {formatQuantity(o.expected_quantity)} · Recebido: {pr?formatQuantity(pr.received_quantity):"—"}</p>{pr?.excess_receipt&&<p className="mt-2 font-medium text-amber-900">Recebimento acima do previsto</p>}<p className="mt-3 text-sm font-medium text-teal-800">Abrir pedido →</p></Link>;})}<Pagination page={page} count={result.count??0}/></div>{access.role==="gerente_logistico"&&<aside className="rounded-xl border bg-white p-5"><h2 className="mb-5 text-xl font-semibold">Novo pedido</h2><TransactionForm task="order" requestKey={randomUUID()} options={options}/></aside>}</div></section>;
}
export default function OrdersPage(props:{searchParams:Promise<{pagina?:string}>}){return <Suspense fallback={<p role="status">Carregando pedidos…</p>}><Orders {...props}/></Suspense>;}
