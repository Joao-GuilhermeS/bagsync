import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {workspace,operationOptions} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {formatQuantity} from "@/lib/operations/validation";
import type {Order,Progress} from "@/lib/operations/types";
import {TransactionForm} from "../../operacoes/transaction-form";
import {History} from "../../operacoes/history";
type Props={params:Promise<{id:string}>;searchParams:Promise<{pagina?:string}>};
async function OrderContent({params,searchParams}:Props){
 const {access,client}=await workspace();const {id}=await params;if(!isUuid(id))notFound();
 const [r,pr,options]=await Promise.all([client.from("production_orders").select("id,name,bag_id,expected_quantity::text,created_at").eq("company_id",access.companyId).eq("id",id).maybeSingle(),client.from("production_order_progress").select("order_id,expected_quantity::text,received_quantity::text,remaining_quantity::text,excess_receipt").eq("company_id",access.companyId).eq("order_id",id).maybeSingle(),operationOptions(client,access.companyId)]);
 if(r.error||pr.error)throw new Error("Falha ao consultar pedido.");if(!r.data)notFound();const order=r.data as unknown as Order;const progress=pr.data as unknown as Progress|null;
 const page=pageNumber((await searchParams).pagina);
 return <section><h1 className="break-words text-3xl font-semibold">{order.name}</h1><p className="my-3 text-slate-600">Modelo: {options.bags.find(b=>b.id===order.bag_id)?.name}</p><div className="my-6 grid gap-3 sm:grid-cols-3">{[["Previsto",order.expected_quantity],["Recebido",progress?.received_quantity??"0"],["Restante",progress?.remaining_quantity??order.expected_quantity]].map(([label,value])=><div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 break-all text-2xl font-semibold">{formatQuantity(value)}</p></div>)}</div>{progress?.excess_receipt&&<p role="alert" className="mb-6 rounded-lg border border-amber-400 bg-amber-50 p-4 text-amber-950">Este pedido recebeu mais bolsas do que o previsto. O excedente foi registrado.</p>}<div className={`grid items-start gap-6 ${access.role!=="gestor"?"lg:grid-cols-[minmax(0,1fr)_22rem]":""}`}><div><h2 className="mb-4 text-xl font-semibold">Histórico do pedido</h2><History client={client} company={access.companyId} manager={access.role==="gerente_logistico"} options={options} orderId={id} page={page}/></div>{access.role!=="gestor"&&<aside className="rounded-xl border bg-white p-5"><h2 className="mb-5 text-xl font-semibold">Entrega ou recebimento</h2><TransactionForm task="operation" requestKey={randomUUID()} options={options} orderId={id}/></aside>}</div></section>;
}
export default function OrderPage(props:Props){return <Suspense fallback={<p role="status">Carregando pedido…</p>}><OrderContent {...props}/></Suspense>;}
