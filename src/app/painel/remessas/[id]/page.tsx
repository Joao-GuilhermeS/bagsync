import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {formatQuantity} from "@/lib/operations/validation";
import {SubmissionHistory} from "../submission-history";
import {Pagination} from "../../operacoes/pagination";

type Props={params:Promise<{id:string}>;searchParams:Promise<{pagina?:string}>};
async function Shipment({params,searchParams}:Props) {
 const {access,client}=await workspace();const {id}=await params;if(!isUuid(id))notFound();const page=pageNumber((await searchParams).pagina);
 const [kit,progress]=await Promise.all([
  client.from("shipment_kits").select("order_id,workshop_id,bag_quantity::text,created_at,note").eq("company_id",access.companyId).eq("id",id).maybeSingle(),
  client.from("shipment_kit_item_progress").select("kit_item_id,label,unit_symbol,expected_quantity::text,sent_quantity::text,remaining_quantity::text,excess_quantity::text",{count:"exact"}).eq("company_id",access.companyId).eq("kit_id",id).order("position").order("kit_item_id").range((page-1)*25,page*25-1)
 ]);
 if(kit.error||progress.error)throw new Error("Não foi possível carregar a remessa.");if(!kit.data)notFound();
 const [order,workshop]=await Promise.all([
  client.from("production_orders").select("name").eq("company_id",access.companyId).eq("id",kit.data.order_id).maybeSingle(),
  client.from("workshops").select("name").eq("company_id",access.companyId).eq("id",kit.data.workshop_id).maybeSingle()
 ]);
 if(order.error||workshop.error)throw new Error("Não foi possível carregar pedido e facção.");
 return <section><Link href="/painel/remessas" className="inline-block py-3 text-teal-800 underline">Voltar às remessas</Link><h1 className="text-3xl font-semibold">Remessa de materiais</h1><div className="my-5 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2"><div><p className="text-sm text-slate-600">Facção / costureiro</p><p className="break-words font-semibold">{workshop.data?.name}</p><p className="mt-3">Quantidade: {formatQuantity(String(kit.data.bag_quantity))} bolsas</p></div><div><p>Criação: {new Date(kit.data.created_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}</p><Link href={`/painel/pedidos/${kit.data.order_id}`} className="mt-3 block break-words text-teal-800 underline">{order.data?.name}</Link></div></div>{access.role!=="gestor"&&<Link href={`/painel/remessas/${id}/preencher`} className="mb-6 inline-block min-h-11 rounded-lg bg-teal-800 px-4 py-3 text-white">Preencher controle de saída</Link>}<h2 className="mb-4 text-xl font-semibold">Previsto, enviado e pendente</h2><p className="mb-4 text-sm text-slate-600">Somente entregas vinculadas a esta remessa atendem seus itens. Estornos reabrem pendências.</p><div className="grid gap-4 md:grid-cols-2">{progress.data.map(item=><article key={item.kit_item_id} className="rounded-xl border bg-white p-5"><h3 className="break-words font-semibold">{item.label}</h3><dl className="mt-3 grid grid-cols-2 gap-2 text-sm">{[["Previsto",item.expected_quantity],["Enviado",item.sent_quantity],["Pendente",item.remaining_quantity],["Excedente",item.excess_quantity]].map(([label,value])=><div key={label}><dt className="text-slate-600">{label}</dt><dd className="break-all font-medium">{formatQuantity(String(value))} {item.unit_symbol}</dd></div>)}</dl></article>)}</div><Pagination page={page} count={progress.count??0}/><section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Anotações gerais</h2><p className="mt-3 whitespace-pre-wrap break-words">{kit.data.note||"Sem anotações."}</p></section><SubmissionHistory client={client} company={access.companyId} kit={id} preview/></section>;
}
export default function ShipmentPage(props:Props){return <Suspense fallback={<p role="status">Carregando remessa…</p>}><Shipment {...props}/></Suspense>;}
