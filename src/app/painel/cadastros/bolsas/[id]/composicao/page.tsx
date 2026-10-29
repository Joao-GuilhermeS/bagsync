import {PageSkeleton} from "@/components/ui/skeleton";
import {FormDrawer} from "@/components/ui/drawer";
import {PageHeader} from "@/components/ui/page-header";
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
 return <section><Link href="/painel/cadastros/bolsas" className="mb-4 inline-block min-h-11 py-3 text-sm text-forest underline">Voltar aos modelos</Link><PageHeader eyebrow="Modelo de bolsa" title={`Ficha técnica: ${bagResult.data.name}`} description="Composição opcional por bolsa. Este cadastro não reserva nem baixa o estoque." actions={manager&&<FormDrawer title="Adicionar material à composição" trigger="Adicionar material"><CompositionForm bagId={id} materials={materials}/></FormDrawer>}/><div className="space-y-3">{!items.length&&<p className="surface p-10 text-center text-sm text-slate-500">Nenhum material nesta página da ficha técnica.</p>}{items.map(item=>{const material=byId.get(item.material_id);return <article key={item.material_id} className="surface flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-semibold">{material?.name??"Material não disponível"}</h2><p className="mt-2 break-all text-sm text-slate-500"><strong className="tabular-nums text-forest">{formatQuantity(item.quantity)} {material?.symbol}</strong> por bolsa</p></div>{manager&&<div className="flex gap-2"><FormDrawer title="Editar quantidade por bolsa" trigger="Editar" variant="secondary"><CompositionForm bagId={id} item={item}/></FormDrawer><FormDrawer title="Remover material da composição" trigger="Remover" variant="danger"><CompositionForm bagId={id} item={item} remove/></FormDrawer></div>}</article>;})}</div><Pagination page={page} count={composition.count??0}/></section>;

}
export default function CompositionPage(props:Props){return <Suspense fallback={<PageSkeleton label="Carregando composição…" variant="table"/>}><CompositionContent {...props}/></Suspense>;}
