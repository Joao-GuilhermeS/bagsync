import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {formatQuantity} from "@/lib/operations/validation";
import {Pagination} from "@/app/painel/operacoes/pagination";
import {CompositionForm,type MaterialOption} from "../../composition-form";
type Props={params:Promise<{id:string}>;searchParams:Promise<{pagina?:string}>};
async function CompositionContent({params,searchParams}:Props) {
 const {access,client}=await workspace();const {id}=await params;if(!isUuid(id))notFound();const page=pageNumber((await searchParams).pagina);
 const [bagResult,composition]=await Promise.all([
  client.from("bags").select("id,name").eq("company_id",access.companyId).eq("id",id).maybeSingle(),
  client.from("bag_materials").select("material_id,quantity::text",{count:"exact"}).eq("company_id",access.companyId).eq("bag_id",id).order("material_id").range((page-1)*25,page*25-1)
 ]);
 if(bagResult.error||composition.error)throw new Error("Falha ao consultar composição.");if(!bagResult.data)notFound();
 const rawMaterials:{id:string;name:string;unit_id:string}[]=[];const units=new Map<string,string>();
 for(let offset=0;;offset+=500){
  const [m,u]=await Promise.all([client.from("materials").select("id,name,unit_id").eq("company_id",access.companyId).order("id").range(offset,offset+499),client.from("measurement_units").select("id,symbol").eq("company_id",access.companyId).order("id").range(offset,offset+499)]);
  if(m.error||u.error)throw new Error("Falha ao carregar materiais.");rawMaterials.push(...m.data);u.data.forEach(unit=>units.set(unit.id,unit.symbol));if(m.data.length<500&&u.data.length<500)break;
 }
 const materials:MaterialOption[]=rawMaterials.map(m=>({id:m.id,name:m.name,symbol:units.get(m.unit_id)??""})).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
 const byId=new Map(materials.map(m=>[m.id,m]));const items=composition.data as unknown as {material_id:string;quantity:string}[];const manager=access.role==="gerente_logistico";
 return <section><Link href="/painel/cadastros/bolsas" className="text-sm text-teal-800 underline">Voltar aos modelos</Link><h1 className="mt-4 break-words text-3xl font-semibold">Composição: {bagResult.data.name}</h1><p className="my-3 text-slate-600">Materiais e quantidades para uma bolsa. A composição é opcional e não reserva nem baixa estoque automaticamente.</p><div className={`mt-6 grid items-start gap-6 ${manager?"lg:grid-cols-[minmax(0,1fr)_22rem]":""}`}><div className="space-y-4">{!items.length&&<p className="rounded-xl border bg-white p-6">Nenhum material nesta página da composição.</p>}{items.map(item=>{const material=byId.get(item.material_id);return <article key={item.material_id} className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">{material?.name??"Material não disponível"}</h2><p className="my-3 break-all">{formatQuantity(item.quantity)} {material?.symbol} por bolsa</p>{manager&&<div className="space-y-3"><details className="rounded-lg border p-3"><summary className="min-h-8 cursor-pointer text-teal-800">Editar quantidade</summary><div className="mt-4"><CompositionForm bagId={id} item={item}/></div></details><details className="rounded-lg border p-3"><summary className="min-h-8 cursor-pointer text-red-800">Remover da composição</summary><div className="mt-4"><CompositionForm bagId={id} item={item} remove/></div></details></div>}</article>;})}<Pagination page={page} count={composition.count??0}/></div>{manager&&<aside className="rounded-xl border bg-white p-5"><h2 className="mb-5 text-xl font-semibold">Adicionar material</h2>{!materials.length&&<p className="mb-4 text-sm text-slate-600">Cadastre primeiro uma unidade de medida e um material.</p>}<CompositionForm bagId={id} materials={materials}/></aside>}</div></section>;
}
export default function CompositionPage(props:Props){return <Suspense fallback={<p role="status">Carregando composição…</p>}><CompositionContent {...props}/></Suspense>;}
