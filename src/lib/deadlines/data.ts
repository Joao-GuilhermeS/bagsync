import type {SupabaseClient} from "@supabase/supabase-js";
import {companyRows} from "../shipments/expedition-data";
export type DeadlineRow={kit_id:string;order_id:string;bag_id:string;workshop_id:string;bag_quantity:string;received_quantity:string;remaining_quantity:string;created_at:string;distributed_at:string;due_on:string|null;model_name:string;order_name:string;workshop_name:string;phone:string|null;city:string|null;state:string|null};
export type DeadlineEvent={id:string;kit_id:string;due_on:string;previous_due_on:string|null;reason:string;event_type:string;created_at:string};
export async function deadlinesData(client:SupabaseClient,company:string){
 const [rows,events]=await Promise.all([
  companyRows<DeadlineRow>(client,company,"production_deadlines","kit_id,order_id,bag_id,workshop_id,bag_quantity,received_quantity,remaining_quantity,created_at,distributed_at,due_on,model_name,order_name,workshop_name,phone,city,state","kit_id"),
  companyRows<DeadlineEvent>(client,company,"shipment_deadline_events","id,kit_id,due_on,previous_due_on,reason,event_type,created_at"),
 ]);
 return {rows,events:events.sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id))};
}
