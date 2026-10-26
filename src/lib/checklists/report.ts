import type {SupabaseClient} from "@supabase/supabase-js";
import {ExportError} from "../exports/access";
export type ChecklistReport={
 id:string;kit_id:string;company:string;workshop:string;model:string;order:string;
 bag_quantity:string;created_at:string;note:string|null;kit_note:string|null;operation_id:string|null;is_reversed:boolean;
 items:{id:string;label:string;unit:string;input_type:"checkbox"|"text"|null;mode:string;response_text:string|null;quantity:string;expected_quantity:string}[];
};
export async function checklistReport(client:SupabaseClient,kitId:string,submissionId:string):Promise<ChecklistReport> {
 const submission=await client.from("kit_checklist_submissions").select("id,company_id,kit_id,operation_id,note,created_at").eq("kit_id",kitId).eq("id",submissionId).maybeSingle();
 if(submission.error)throw new ExportError("Não foi possível consultar o checklist.",503);if(!submission.data)throw new ExportError("Checklist não encontrado.",404);
 const row=submission.data;const company=row.company_id;
 const kit=await client.from("shipment_kits").select("bag_id,order_id,workshop_id,bag_quantity::text,note").eq("company_id",company).eq("id",kitId).maybeSingle();
 if(kit.error||!kit.data)throw new ExportError("Não foi possível consultar a remessa.",503);
 const [organization,workshop,model,order,reversal]=await Promise.all([
  client.from("companies").select("name").eq("id",company).maybeSingle(),
  client.from("workshops").select("name").eq("company_id",company).eq("id",kit.data.workshop_id).maybeSingle(),
  client.from("bags").select("name").eq("company_id",company).eq("id",kit.data.bag_id).maybeSingle(),
  client.from("production_orders").select("name").eq("company_id",company).eq("id",kit.data.order_id).maybeSingle(),
  row.operation_id?client.from("inventory_operations").select("id").eq("company_id",company).eq("reversal_of",row.operation_id).maybeSingle():Promise.resolve({data:null,error:null})
 ]);
 if([organization,workshop,model,order,reversal].some(result=>result.error)||!organization.data||!workshop.data||!model.data||!order.data)throw new ExportError("Não foi possível consultar o cabeçalho.",503);
 const answers:{kit_item_id:string;mode:string;response_text:string|null;quantity:string}[]=[];
 const snapshot=new Map<string,{id:string;label:string;unit_symbol:string;input_type:"checkbox"|"text"|null;expected_quantity:string;position:number}>();
 for(let offset=0;;offset+=500){
  const [a,i]=await Promise.all([
   client.from("kit_checklist_answers").select("kit_item_id,mode,response_text,quantity::text").eq("company_id",company).eq("kit_id",kitId).eq("submission_id",submissionId).order("kit_item_id").range(offset,offset+499),
   client.from("shipment_kit_items").select("id,label,unit_symbol,input_type,expected_quantity::text,position").eq("company_id",company).eq("kit_id",kitId).order("id").range(offset,offset+499)
  ]);
  if(a.error||i.error)throw new ExportError("Não foi possível consultar as respostas.",503);
  answers.push(...a.data as unknown as typeof answers);
  for(const item of i.data as unknown as Array<NonNullable<ReturnType<typeof snapshot.get>>>)snapshot.set(item.id,item);
  if(answers.length>5000||snapshot.size>5000)throw new ExportError("Checklist muito grande para gerar PDF.",413);
  if(a.data.length<500&&i.data.length<500)break;
 }
 const items=answers.map(answer=>{
  const item=snapshot.get(answer.kit_item_id);if(!item)throw new ExportError("Item do checklist não encontrado.",503);
  return {id:item.id,label:item.label,unit:item.unit_symbol,input_type:item.input_type,mode:answer.mode,response_text:answer.response_text,quantity:answer.quantity,expected_quantity:item.expected_quantity,position:item.position};
 }).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
 return {id:row.id,kit_id:kitId,company:organization.data.name,workshop:workshop.data.name,model:model.data.name,order:order.data.name,bag_quantity:String(kit.data.bag_quantity),created_at:row.created_at,note:row.note,kit_note:kit.data.note,operation_id:row.operation_id,is_reversed:!!reversal.data,items};
}
