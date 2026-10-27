import type {SupabaseClient} from "@supabase/supabase-js";
import {sumBagMovements} from "./production/driver-progress";
export type DashboardData={pending:string;distributed:string;received:string;incomplete:number;negative:number;preparedToday:number;recent:{id:string;date:string;workshop:string;order:string;quantity:string;reversed:boolean}[]};
export async function dashboardData(client:SupabaseClient,company:string):Promise<DashboardData>{
 const localDay=new Date(Date.now()-3*60*60*1000).toISOString().slice(0,10);const start=new Date(`${localDay}T00:00:00-03:00`);const end=new Date(start.getTime()+86400000);
 const [incomplete,negative,prepared,recent,totals]=await Promise.all([
  client.from("shipment_kit_status").select("kit_id",{count:"exact",head:true}).eq("company_id",company).eq("status","incompleto"),
  client.from("material_stock_balances").select("material_id",{count:"exact",head:true}).eq("company_id",company).eq("negative_balance",true),
  client.from("shipment_kits").select("id",{count:"exact",head:true}).eq("company_id",company).gte("created_at",start.toISOString()).lt("created_at",end.toISOString()),
  client.from("inventory_operations").select("id,created_at,workshop_id,order_id").eq("company_id",company).eq("kind","bag_receipt").order("created_at",{ascending:false}).order("id").limit(5),
  (async()=>{const rows:{remaining_quantity:string;distributed_quantity:string;received_quantity:string}[]=[];for(let offset=0;;offset+=500){const result=await client.from("production_tracking").select("remaining_quantity::text,distributed_quantity::text,received_quantity::text").eq("company_id",company).order("order_id").order("workshop_id").range(offset,offset+499);if(result.error)throw new Error("Não foi possível carregar o resumo da produção.");rows.push(...result.data);if(result.data.length<500)return rows;}})()
 ]);
 if(incomplete.error||negative.error||prepared.error||recent.error)throw new Error("Não foi possível atualizar os indicadores.");
 let events:DashboardData["recent"]=[];
 if(recent.data.length){
  const ids=recent.data.map(op=>op.id);const orders=recent.data.map(op=>op.order_id);const workshops=recent.data.map(op=>op.workshop_id);
  const [w,o,s,r]=await Promise.all([
   client.from("workshops").select("id,name").eq("company_id",company).in("id",workshops),
   client.from("production_orders").select("id,name").eq("company_id",company).in("id",orders),
   client.from("stock_movements").select("operation_id,quantity::text").eq("company_id",company).in("operation_id",ids).not("bag_id","is",null),
   client.from("inventory_operations").select("reversal_of").eq("company_id",company).in("reversal_of",ids)
  ]);
  if(w.error||o.error||s.error||r.error)throw new Error("Não foi possível atualizar os recolhimentos recentes.");
  events=recent.data.map(op=>({id:op.id,date:op.created_at,workshop:w.data.find(row=>row.id===op.workshop_id)?.name??"Facção",order:o.data.find(row=>row.id===op.order_id)?.name??"Pedido",quantity:String(s.data.find(row=>row.operation_id===op.id)?.quantity??"0"),reversed:r.data.some(row=>row.reversal_of===op.id)}));
 }
 return {pending:sumBagMovements(totals.map(row=>row.remaining_quantity)),distributed:sumBagMovements(totals.map(row=>row.distributed_quantity)),received:sumBagMovements(totals.map(row=>row.received_quantity)),incomplete:incomplete.count??0,negative:negative.count??0,preparedToday:prepared.count??0,recent:events};
}
