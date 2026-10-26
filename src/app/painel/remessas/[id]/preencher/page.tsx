import Link from "next/link";
import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid} from "@/lib/catalogs/validation";
import {shipmentAnswerItems} from "@/lib/checklists/submission-data";
import {ShipmentChecklistForm} from "../../checklist-form";
async function Fill({params}:{params:Promise<{id:string}>}) {
 const {access,client}=await workspace();const {id}=await params;if(!isUuid(id))notFound();
 const kit=await client.from("shipment_kits").select("id,order_id,workshop_id").eq("company_id",access.companyId).eq("id",id).maybeSingle();
 if(kit.error)throw new Error("Não foi possível consultar a remessa.");if(!kit.data)notFound();
 if(access.role==="gestor")return <p>Seu perfil permite consultar esta saída. <Link className="underline" href={`/painel/remessas/${id}`}>Consultar remessa</Link></p>;
 const [items,workshop,order]=await Promise.all([
  shipmentAnswerItems(client,access.companyId,id),
  client.from("workshops").select("name").eq("company_id",access.companyId).eq("id",kit.data.workshop_id).maybeSingle(),
  client.from("production_orders").select("name").eq("company_id",access.companyId).eq("id",kit.data.order_id).maybeSingle()
 ]);
 if(workshop.error||order.error)throw new Error("Não foi possível consultar o destinatário.");
 return <section className="mx-auto max-w-3xl"><Link href={`/painel/remessas/${id}`} className="inline-block py-3 text-teal-800 underline">Voltar à remessa</Link><h1 className="text-3xl font-semibold">Controle de saída</h1><p className="my-4 break-words">{workshop.data?.name} · {order.data?.name}</p>{items.some(item=>!item.input_type)?<p className="rounded-xl border bg-white p-5">Esta remessa foi criada antes da configuração dos tipos de resposta. Seu histórico será preservado; prepare uma nova remessa com o checklist configurado.</p>:<ShipmentChecklistForm requestKey={randomUUID()} kitId={id} items={items}/>}</section>;
}
export default function FillPage(props:{params:Promise<{id:string}>}){return <Suspense fallback={<p role="status">Carregando controle de saída…</p>}><Fill {...props}/></Suspense>;}
