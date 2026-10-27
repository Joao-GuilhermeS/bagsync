import Link from "next/link";
import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {workspace,operationOptions} from "@/lib/operations/data";
import {checklistMaterials,shipmentTemplate} from "@/lib/checklists/data";
import {isUuid} from "@/lib/catalogs/validation";
import {ShipmentForm,type TemplateItem} from "../shipment-form";

type Props={searchParams:Promise<{pedido?:string;faccao?:string}>};
async function NewShipment({searchParams}:Props) {
 const {access,client}=await workspace();
 if(access.role!=="gerente_logistico")return <p>Somente o Gerente Logístico pode criar remessas. <Link href="/painel/expedicao" className="underline">Consultar remessas</Link></p>;
 const {pedido,faccao}=await searchParams;if(faccao&&!isUuid(faccao))notFound();
 const options=await operationOptions(client,access.companyId);
 const selectedWorkshop=faccao?.toLowerCase();if(selectedWorkshop&&!options.workshops.some(w=>w.id===selectedWorkshop))notFound();
 if(!pedido)return <section><h1 className="text-3xl font-semibold">Nova remessa</h1><form method="get" className="mt-6 max-w-xl space-y-4"><label htmlFor="shipment-order" className="block font-medium">Selecione o pedido</label><select id="shipment-order" name="pedido" required className="min-h-11 w-full rounded-lg border bg-white px-3"><option value="">Selecione</option>{options.orders.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><button className="min-h-11 rounded-lg bg-teal-800 px-5 text-white" disabled={!options.orders.length}>Continuar</button>{!options.orders.length&&<Link href="/painel/pedidos" className="block underline">Cadastre primeiro um pedido.</Link>}</form></section>;
 if(!isUuid(pedido))notFound();
 const order=await client.from("production_orders").select("id,name,bag_id").eq("company_id",access.companyId).eq("id",pedido).maybeSingle();
 if(order.error)throw new Error("Não foi possível carregar o pedido.");if(!order.data)notFound();
 const [template,materials]=await Promise.all([
  shipmentTemplate(client,access.companyId,order.data.bag_id),
  checklistMaterials(client,access.companyId)
 ]);
 const items:TemplateItem[]=template;
 return <section className="mx-auto max-w-3xl"><Link href="/painel/expedicao" className="inline-block py-3 text-teal-800 underline">Voltar às remessas</Link><h1 className="text-3xl font-semibold">Nova remessa</h1><p className="my-4 break-words text-lg">Pedido: {order.data.name}</p><p className="mb-6 text-sm text-slate-600">Modelo: {options.bags.find(b=>b.id===order.data!.bag_id)?.name}</p>{!items.length||items.some(i=>!i.input_type)?<div className="rounded-xl border bg-white p-5"><p>Configure os itens ativos e seus tipos de resposta antes de criar a remessa.</p><Link href={`/painel/cadastros/bolsas/${order.data.bag_id}/checklist`} className="inline-block py-3 text-teal-800 underline">Configurar checklist do modelo</Link></div>:<ShipmentForm requestKey={randomUUID()} orderId={pedido} workshops={selectedWorkshop?options.workshops.filter(w=>w.id===selectedWorkshop):options.workshops} workshopId={selectedWorkshop} items={items} materials={materials}/>}</section>;
}
export default function NewShipmentPage(props:Props){return <Suspense fallback={<p role="status">Carregando nova remessa…</p>}><NewShipment {...props}/></Suspense>;}
