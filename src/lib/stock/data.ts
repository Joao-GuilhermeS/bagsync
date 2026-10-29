import type {SupabaseClient} from "@supabase/supabase-js";
import type {StockRow} from "./table";

async function readAll<T>(client:SupabaseClient,company:string,table:string,fields:string,key:string):Promise<T[]> {
  const rows:T[]=[];
  for(let offset=0;;offset+=500){
    const result=await client.from(table).select(fields).eq("company_id",company).order(key).range(offset,offset+499);
    if(result.error)throw new Error("Não foi possível consultar o estoque.");
    rows.push(...result.data as unknown as T[]);if(result.data.length<500)return rows;
  }
}
export async function stockRows(client:SupabaseClient,company:string,material:boolean):Promise<StockRow[]> {
  const key=material?"material_id":"bag_id";
  const [balances,items,units]=await Promise.all([
    readAll<{material_id?:string;bag_id?:string;balance:string}>(client,company,material?"material_stock_balances":"bag_stock_balances",`${key},balance::text`,key),
    readAll<{id:string;name:string;unit_id?:string}>(client,company,material?"materials":"bags",material?"id,name,unit_id":"id,name","id"),
    material?readAll<{id:string;symbol:string}>(client,company,"measurement_units","id,symbol","id"):Promise.resolve([]),
  ]);
  const names=new Map(items.map(item=>[item.id,item]));const symbols=new Map(units.map(unit=>[unit.id,unit.symbol]));
  return balances.map(row=>{const id=(row.material_id??row.bag_id)!;const item=names.get(id);return {id,name:item?.name??"Item indisponível",unit:material?symbols.get(item?.unit_id??"")??"—":"un",balance:row.balance};});
}
