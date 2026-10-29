import type {SupabaseClient} from "@supabase/supabase-js";
import {companyRows} from "./expedition-data";
import {expeditionTransport,type TransportState} from "./expedition";
export type ExpeditionCardData={id:string;orderId:string;workshopId:string;model:string;order:string;workshop:string;bags:string;date:string;itemCount:string;pendingItems:string;status:TransportState;kitIncomplete:boolean;pdfSubmission:string|null};
export async function expeditionCards(client:SupabaseClient,company:string):Promise<ExpeditionCardData[]>{
 const [kits,orders,models,workshops,progress,dispatches]=await Promise.all([
  companyRows<{id:string;order_id:string;bag_id:string;workshop_id:string;bag_quantity:string;created_at:string}>(client,company,"shipment_kits","id,order_id,bag_id,workshop_id,bag_quantity::text,created_at"),
  companyRows<{id:string;name:string}>(client,company,"production_orders","id,name"),companyRows<{id:string;name:string}>(client,company,"bags","id,name"),companyRows<{id:string;name:string}>(client,company,"workshops","id,name"),
  companyRows<{kit_id:string;item_count:string;pending_items:string;status:string}>(client,company,"shipment_kit_status","kit_id,item_count::text,pending_items::text,status","kit_id"),
  companyRows<{kit_id:string;submission_id:string;delivery_status:string;issued_at:string}>(client,company,"shipment_dispatches","kit_id,submission_id,delivery_status,issued_at","submission_id"),
 ]);
 return kits.map(kit=>{
  const shipments=dispatches.filter(row=>row.kit_id===kit.id).sort((a,b)=>b.issued_at.localeCompare(a.issued_at)||a.submission_id.localeCompare(b.submission_id));
  const status=progress.find(row=>row.kit_id===kit.id);
  return {id:kit.id,orderId:kit.order_id,workshopId:kit.workshop_id,model:models.find(row=>row.id===kit.bag_id)?.name??"Modelo indisponível",order:orders.find(row=>row.id===kit.order_id)?.name??"Pedido",workshop:workshops.find(row=>row.id===kit.workshop_id)?.name??"Facção",bags:kit.bag_quantity,date:kit.created_at,itemCount:status?.item_count??"0",pendingItems:status?.pending_items??"0",status:expeditionTransport(shipments.map(row=>row.delivery_status)),kitIncomplete:status?.status!=="completo",pdfSubmission:shipments.find(row=>row.delivery_status!=="estornado")?.submission_id??null};
 }).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
