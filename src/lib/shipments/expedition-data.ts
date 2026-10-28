import type {SupabaseClient} from "@supabase/supabase-js";
import type {ExpeditionOptions,ExpeditionTemplate} from "./expedition";
export async function companyRows<T>(client:SupabaseClient,company:string,table:string,fields:string,order="id"):Promise<T[]>{
 const rows:T[]=[];
 for(let offset=0;;offset+=500){
  const result=await client.from(table).select(fields).eq("company_id",company).order(order).range(offset,offset+499);
  if(result.error)throw new Error("Não foi possível carregar os dados da Expedição.");
  rows.push(...result.data as unknown as T[]);if(result.data.length<500)return rows;
 }
}
export async function expeditionOptions(client:SupabaseClient,company:string):Promise<ExpeditionOptions>{
 const [orders,models,workshops,templates,materials,units]=await Promise.all([
  companyRows<ExpeditionOptions["orders"][number]>(client,company,"production_orders","id,name,bag_id"),
  companyRows<{id:string;name:string}>(client,company,"bags","id,name"),
  companyRows<{id:string;name:string}>(client,company,"workshops","id,name"),
  companyRows<ExpeditionTemplate&{active:boolean}>(client,company,"bag_checklist_items","id,bag_id,material_id,label,input_type,position,active"),
  companyRows<{id:string;unit_id:string}>(client,company,"materials","id,unit_id"),
  companyRows<{id:string;symbol:string}>(client,company,"measurement_units","id,symbol"),
 ]);
 return {orders:orders.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")),models,workshops:workshops.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")),templates:templates.filter(row=>row.active).map(row=>({...row,unit_symbol:units.find(unit=>unit.id===materials.find(material=>material.id===row.material_id)?.unit_id)?.symbol??""})).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id))};
}
