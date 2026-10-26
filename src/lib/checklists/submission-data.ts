import type {SupabaseClient} from "@supabase/supabase-js";
export type ShipmentAnswerItem={id:string;label:string;unit_symbol:string;input_type:"checkbox"|"text"|null;remaining_quantity:string;expected_quantity:string};
export async function shipmentAnswerItems(client:SupabaseClient,company:string,kit:string):Promise<ShipmentAnswerItem[]> {
 const types=new Map<string,"checkbox"|"text"|null>();
 const rows:{kit_item_id:string;label:string;unit_symbol:string;remaining_quantity:string;expected_quantity:string}[]=[];
 for(let offset=0;;offset+=500){
  const [i,p]=await Promise.all([
   client.from("shipment_kit_items").select("id,input_type").eq("company_id",company).eq("kit_id",kit).order("id").range(offset,offset+499),
   client.from("shipment_kit_item_progress").select("kit_item_id,label,unit_symbol,remaining_quantity::text,expected_quantity::text").eq("company_id",company).eq("kit_id",kit).order("position").order("kit_item_id").range(offset,offset+499)
  ]);
  if(i.error||p.error)throw new Error("Não foi possível carregar os itens para preenchimento.");
  i.data.forEach(item=>types.set(item.id,item.input_type));rows.push(...p.data as unknown as typeof rows);
  if(i.data.length<500&&p.data.length<500)break;
 }
 return rows.map(row=>({...row,id:row.kit_item_id,input_type:types.get(row.kit_item_id)??null}));
}
