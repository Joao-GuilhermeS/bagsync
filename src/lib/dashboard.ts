import type {SupabaseClient} from "@supabase/supabase-js";
import {modelMetrics,summarizeModels,type ModelMetrics} from "./production/dashboard-metrics";
export type DashboardData={models:ModelMetrics[];received:string;recent:{id:string;date:string;model:string;workshop:string;order:string;quantity:string;reversed:boolean}[]};
export async function dashboardData(client:SupabaseClient,company:string):Promise<DashboardData>{
 const allRows=async<T>(table:string,fields:string,sort:string[]):Promise<T[]>=>{
  const rows:T[]=[];
  for(let offset=0;;offset+=500){
   let query=client.from(table).select(fields).eq("company_id",company);
   for(const column of sort)query=query.order(column);
   const result=await query.range(offset,offset+499);
   if(result.error)throw new Error("Não foi possível carregar os quantitativos de bolsas.");
   rows.push(...result.data as unknown as T[]);
   if(result.data.length<500)return rows;
  }
 };
 const [models,orders,production,recent]=await Promise.all([
  allRows<{id:string;name:string}>("bags","id,name",["id"]),
  allRows<{bag_id:string;expected_quantity:string}>("production_orders","bag_id,expected_quantity::text",["id"]),
  allRows<{bag_id:string;remaining_quantity:string;received_quantity:string}>("production_tracking","bag_id,remaining_quantity,received_quantity",["order_id","workshop_id"]),
  client.from("inventory_operations").select("id,created_at,workshop_id,order_id").eq("company_id",company).eq("kind","bag_receipt").order("created_at",{ascending:false}).order("id").limit(5),
 ]);
 if(recent.error)throw new Error("Não foi possível atualizar os recolhimentos recentes.");
 const metrics=modelMetrics(models,orders,production);
 let events:DashboardData["recent"]=[];
 if(recent.data.length){
  const ids=recent.data.map(op=>op.id);const orders=recent.data.map(op=>op.order_id);const workshops=recent.data.map(op=>op.workshop_id);
  const [w,o,s,r]=await Promise.all([
   client.from("workshops").select("id,name").eq("company_id",company).in("id",workshops),
   client.from("production_orders").select("id,name,bag_id").eq("company_id",company).in("id",orders),
   client.from("stock_movements").select("operation_id,quantity::text").eq("company_id",company).in("operation_id",ids).not("bag_id","is",null),
   client.from("inventory_operations").select("reversal_of").eq("company_id",company).in("reversal_of",ids)
  ]);
  if(w.error||o.error||s.error||r.error)throw new Error("Não foi possível atualizar os recolhimentos recentes.");
  events=recent.data.map(op=>({id:op.id,date:op.created_at,model:models.find(model=>model.id===o.data.find(order=>order.id===op.order_id)?.bag_id)?.name??"Modelo indisponível",workshop:w.data.find(row=>row.id===op.workshop_id)?.name??"Facção",order:o.data.find(row=>row.id===op.order_id)?.name??"Pedido",quantity:String(s.data.find(row=>row.operation_id===op.id)?.quantity??"0"),reversed:r.data.some(row=>row.reversal_of===op.id)}));
 }
 return {models:metrics,received:summarizeModels(metrics).ready,recent:events};
}
