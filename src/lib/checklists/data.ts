import type {SupabaseClient} from "@supabase/supabase-js";

export async function checklistMaterials(client:SupabaseClient,company:string) {
 const materials:{id:string;name:string;unit_id:string}[]=[];
 const units=new Map<string,string>();
 for(let offset=0;;offset+=500){
  const [m,u]=await Promise.all([
   client.from("materials").select("id,name,unit_id").eq("company_id",company).order("id").range(offset,offset+499),
   client.from("measurement_units").select("id,symbol").eq("company_id",company).order("id").range(offset,offset+499)
  ]);
  if(m.error||u.error)throw new Error("Não foi possível carregar os materiais do checklist.");
  materials.push(...m.data);u.data.forEach(unit=>units.set(unit.id,unit.symbol));
  if(m.data.length<500&&u.data.length<500)break;
 }
 return materials.map(m=>({id:m.id,name:`${m.name} (${units.get(m.unit_id)??""})`})).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
}
