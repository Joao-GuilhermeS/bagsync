import Link from "next/link";
import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {workspace,operationOptions} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {TransactionForm} from "../../../operacoes/transaction-form";
import {History} from "../../../operacoes/history";
import {sumBagMovements} from "@/lib/production/driver-progress";
import {formatQuantity} from "@/lib/operations/validation";

type Props={params:Promise<{bag:string;workshop:string}>;searchParams:Promise<{pedido?:string;pagina?:string}>};
async function DriverOperations({params,searchParams}:Props) {
 const {access,client}=await workspace();const {bag,workshop}=await params;
 if(!isUuid(bag)||!isUuid(workshop))notFound();const search=await searchParams;
 const [model,faction,orders,options]=await Promise.all([
  client.from("bags").select("name").eq("company_id",access.companyId).eq("id",bag).maybeSingle(),
  client.from("workshops").select("name").eq("company_id",access.companyId).eq("id",workshop).maybeSingle(),
  (async()=>{const rows:{id:string;name:string}[]=[];for(let offset=0;;offset+=500){const r=await client.from("production_orders").select("id,name").eq("company_id",access.companyId).eq("bag_id",bag).order("id").range(offset,offset+499);if(r.error)throw new Error("Não foi possível carregar os pedidos.");rows.push(...r.data);if(r.data.length<500)return rows;}})(),
  operationOptions(client,access.companyId)
 ]);
 if(model.error||faction.error)throw new Error("Não foi possível carregar modelo e facção.");if(!model.data||!faction.data)notFound();
 const orderId=search.pedido??(orders.length===1?orders[0].id:undefined);
 if(orderId&&(!isUuid(orderId)||!orders.some(o=>o.id===orderId)))notFound();
 const scopedOptions={...options,orders,workshops:[{id:workshop,name:faction.data.name}],bags:options.bags.filter(b=>b.id===bag)};
 const quantities:string[]=[];
 if(orderId){for(let offset=0;;offset+=500){
  const result=await client.from("stock_movements").select("quantity::text,inventory_operations!inner(order_id,workshop_id)").eq("company_id",access.companyId).eq("bag_id",bag).eq("inventory_operations.order_id",orderId).eq("inventory_operations.workshop_id",workshop).order("id").range(offset,offset+499);
  if(result.error)throw new Error("Não foi possível consultar as bolsas recolhidas.");
  quantities.push(...(result.data as unknown as {quantity:string}[]).map(row=>row.quantity));if(result.data.length<500)break;
 }}
 const received=sumBagMovements(quantities);
 return <section><Link href={`/painel/entregador/${bag}`} className="inline-block py-3 text-teal-800 underline">Voltar às facções</Link><h1 className="break-words text-3xl font-semibold">{faction.data.name}</h1><p className="my-3 break-words text-lg text-slate-600">Modelo: {model.data.name}</p>{orders.length>1&&<form method="get" className="my-6 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"><div className="min-w-0 flex-1"><label htmlFor="driver-order" className="mb-2 block font-medium">Pedido deste modelo</label><select id="driver-order" name="pedido" defaultValue={orderId??""} required className="min-h-11 w-full rounded-lg border bg-white px-3"><option value="">Selecione o pedido</option>{orders.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div><button className="min-h-11 rounded-lg bg-teal-800 px-4 text-white">Abrir</button><p className="w-full text-sm text-slate-600">Escolha o pedido para vincular corretamente a entrega ou o recolhimento.</p></form>}{!orders.length&&<p className="my-6 rounded-xl border bg-white p-5">Este modelo ainda não possui pedido. O Gerente Logístico precisa criar um pedido antes de registrar operações.</p>}{orderId&&<div className={`mt-6 grid items-start gap-6 ${access.role!=="gestor"?"lg:grid-cols-[minmax(0,1fr)_22rem]":""}`}><div><div className="mb-5 rounded-xl border bg-teal-50 p-5"><p className="text-sm text-teal-900">Bolsas recolhidas nesta facção e pedido</p><p className="mt-2 break-all text-3xl font-semibold">{formatQuantity(received)}</p><p className="mt-2 text-sm text-slate-600">Total líquido, considerando estornos.</p></div><h2 className="mb-4 text-xl font-semibold">Entregas, recolhimentos e romaneios</h2><History client={client} company={access.companyId} manager={access.role==="gerente_logistico"} options={scopedOptions} page={pageNumber(search.pagina)} orderId={orderId} workshopId={workshop} paginationQuery={{pedido:orderId}}/></div>{access.role!=="gestor"&&<aside className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-xl font-semibold">Registrar entrega ou recebimento</h2><TransactionForm key={orderId} task="operation" requestKey={randomUUID()} orderId={orderId} workshopId={workshop} options={scopedOptions}/></aside>}</div>}</section>;
}
export default function DriverOperationsPage(props:Props){return <Suspense fallback={<p role="status">Carregando operações da facção…</p>}><DriverOperations {...props}/></Suspense>;}
