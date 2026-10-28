import Link from "next/link";
import type {SupabaseClient} from "@supabase/supabase-js";
import {Pagination} from "../operacoes/pagination";
import {DeliveryCard} from "@/components/driver/delivery-card";
import type {WorkshopContact} from "@/lib/shipments/contact";
export async function DispatchList({client,company,canConfirm,order,workshop,page=1,status="a_entregar",preview=false}:{client:SupabaseClient;company:string;canConfirm:boolean;order?:string;workshop?:string;page?:number;status?:string;preview?:boolean}) {
 const size=preview?5:25;
 let query=client.from("shipment_dispatches").select("submission_id,kit_id,order_id,workshop_id,bag_id,bag_quantity::text,issued_at,delivered_at,delivery_note,delivery_status",{count:"exact"}).eq("company_id",company).eq("delivery_status",status);
 if(order)query=query.eq("order_id",order);if(workshop)query=query.eq("workshop_id",workshop);
 const result=await query.order("issued_at",{ascending:false}).order("submission_id").range((page-1)*size,page*size-1);
 if(result.error)throw new Error("Não foi possível consultar os romaneios para entrega.");
 const [orders,workshops,models]=result.data.length?await Promise.all([
  client.from("production_orders").select("id,name").eq("company_id",company).in("id",result.data.map(row=>row.order_id)),
  client.from("workshops").select("id,name,phone,street,address_number,address_complement,neighborhood,city,state,postal_code").eq("company_id",company).in("id",result.data.map(row=>row.workshop_id)),
  client.from("bags").select("id,name").eq("company_id",company).in("id",result.data.map(row=>row.bag_id)),
 ]):[];
 if(orders?.error||workshops?.error||models?.error)throw new Error("Não foi possível carregar os destinatários.");
 const filters={estado:status,...(order?{pedido:order}:{}),...(workshop?{faccao:workshop}:{})};
 return <div>{!result.data.length&&<p className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">{status==="a_entregar"?"Nenhuma entrega aguardando confirmação. Os cards aparecerão após a emissão dos romaneios na Expedição.":"Nenhum romaneio neste estado."}</p>}<div className={`grid items-start gap-4 ${preview&&order?"":"md:grid-cols-2 xl:grid-cols-3"}`}>{result.data.map(row=>{
  const destination=workshops?.data?.find(w=>w.id===row.workshop_id);if(!destination)throw new Error("Destinatário não disponível.");
  return <DeliveryCard key={row.submission_id} canConfirm={canConfirm} data={{id:row.submission_id,kitId:row.kit_id,workshop:destination as WorkshopContact,model:models?.data?.find(model=>model.id===row.bag_id)?.name??"Modelo indisponível",order:orders?.data?.find(item=>item.id===row.order_id)?.name??"Pedido",bags:String(row.bag_quantity),issued:row.issued_at,delivered:row.delivered_at,note:row.delivery_note,status:row.delivery_status}}/>;
 })}</div>{preview?(result.count??0)>size&&<Link href={`/painel/entregas?${new URLSearchParams(filters)}`} className="inline-block py-3 text-sm text-olive underline">Ver todas as entregas</Link>:<Pagination page={page} count={result.count??0} query={filters}/>}</div>;
}
