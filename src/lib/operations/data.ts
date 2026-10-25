import {redirect} from "next/navigation";
import type {SupabaseClient} from "@supabase/supabase-js";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import type {Option,OperationOptions} from "./types";
import {formatQuantity} from "./validation";
export async function workspace() {
 const access=await requireAccess();if(!access)redirect("/painel");
 return {access,client:await createClient()};
}
async function all<T>(client:SupabaseClient,company:string,table:string,fields:string):Promise<T[]> {
 const rows:T[]=[];
 for(let start=0;;start+=500){const {data,error}=await client.from(table).select(fields).eq("company_id",company).order("id").range(start,start+499);if(error)throw new Error("Falha ao carregar opções.");rows.push(...data as unknown as T[]);if(data.length<500)return rows;}
}
export async function operationOptions(client:SupabaseClient,company:string):Promise<OperationOptions> {
 const [bags,materials,units,workshops,orders]=await Promise.all([
  all<Option>(client,company,"bags","id,name"),all<Option&{unit_id:string}>(client,company,"materials","id,name,unit_id"),
  all<{id:string;symbol:string}>(client,company,"measurement_units","id,symbol"),all<Option>(client,company,"workshops","id,name"),all<Option>(client,company,"production_orders","id,name")]);
 const sort=(rows:Option[])=>rows.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
 return {bags:sort(bags),materials:sort(materials.map(m=>({id:m.id,name:`${m.name} (${units.find(u=>u.id===m.unit_id)?.symbol??""})`}))),workshops:sort(workshops),orders:sort(orders)};
}
export function operationWarnings(result:unknown):string[] {
 if(!result||typeof result!=="object"||!("warnings" in result)||!Array.isArray(result.warnings))return [];
 return result.warnings.map((warning:Record<string,unknown>)=>{
  if(warning?.code==="saldo_negativo")return `Saldo negativo no lançamento: ${formatQuantity(String(warning.balance))}. Confira o estoque compartilhado.`;
  if(warning?.code==="recebimento_excedente")return `Recebido acima do previsto: ${formatQuantity(String(warning.received))} de ${formatQuantity(String(warning.expected))} bolsas.`;
  return "Operação registrada com aviso. Confira o histórico e o estoque.";
 });
}
