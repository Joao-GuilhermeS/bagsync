import {PageSkeleton} from "@/components/ui/skeleton";
import {FormDrawer} from "@/components/ui/drawer";
import {PageHeader} from "@/components/ui/page-header";
import {Badge} from "@/components/ui/badge";
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
 return <section><PageHeader eyebrow="Fábrica" title="Pedidos de produção" description="Um modelo por pedido, várias facções trabalhando e um estoque compartilhado." actions={access.role==="gerente_logistico"&&<FormDrawer title="Novo pedido de produção" trigger="Novo pedido" description="Selecione o modelo e informe a quantidade total prevista."><TransactionForm task="order" requestKey={randomUUID()} options={options}/></FormDrawer>}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{!orders.length&&<p className="surface p-8 text-sm text-slate-500 md:col-span-2 xl:col-span-3">Nenhum pedido nesta página. O Gerente Logístico pode criar um pedido pelo botão Novo pedido.</p>}{orders.map(o=>{const pr=progress.find(p=>p.order_id===o.id);return <Link href={`/painel/pedidos/${o.id}`} key={o.id} className="surface p-5 hover:border-olive/40"><div className="mb-4"><Badge tone={pr?.excess_receipt?"danger":pr?.remaining_quantity==="0"?"success":"progress"}>{pr?.excess_receipt?"Acima do previsto":pr?.remaining_quantity==="0"?"Quantidade atendida":"Recebimentos pendentes"}</Badge></div><h2 className="break-words text-lg font-semibold">{o.name}</h2><p className="mt-2 text-sm text-slate-500">{options.bags.find(b=>b.id===o.bag_id)?.name}</p><div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4"><div><p className="text-xs text-slate-500">Previsto</p><p className="mt-1 break-all text-lg font-semibold tabular-nums">{formatQuantity(o.expected_quantity)}</p></div><div><p className="text-xs text-slate-500">Recebido</p><p className="mt-1 break-all text-lg font-semibold tabular-nums">{pr?formatQuantity(pr.received_quantity):"—"}</p></div></div><p className="mt-4 text-sm font-medium text-forest">Consultar pedido →</p></Link>;})}</div><Pagination page={page} count={result.count??0}/></section>;

}
export default function OrdersPage(props:{searchParams:Promise<{pagina?:string}>}){return <Suspense fallback={<PageSkeleton label="Carregando pedidos…" variant="cards"/>}><Orders {...props}/></Suspense>;}
