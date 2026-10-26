import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {catalogs,isCatalog,pageNumber} from "@/lib/catalogs/validation";
import {CatalogForm,type CatalogRecord,type UnitOption} from "../catalog-form";
type Props={params:Promise<{catalog:string}>;searchParams:Promise<{pagina?:string}>};
async function CatalogContent({params,searchParams}:Props) {
 const {catalog}=await params;
 if(!isCatalog(catalog)) notFound();
 const access=await requireAccess();
 if(!access) return null;
 const page=pageNumber((await searchParams).pagina);
 const client=await createClient();
 const config=catalogs[catalog];
 const {data,error,count}=await client.from(config.table).select("*",{count:"exact"}).eq("company_id",access.companyId).order("created_at",{ascending:false}).order("id").range((page-1)*25,page*25-1);
 let units:UnitOption[]=[];
 if(catalog==="materiais") {
  // Buscar todos os lotes evita truncar silenciosamente as opções do seletor.
  for(let offset=0;;offset+=500) {
   const result=await client.from("measurement_units").select("id,name,symbol").eq("company_id",access.companyId).order("id").range(offset,offset+499);
   if(result.error) throw new Error("Não foi possível carregar as unidades.");
   units.push(...result.data);
   if(result.data.length<500) break;
  }
  units=units.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
 }
 if(error) throw new Error("Não foi possível carregar o cadastro.");
 const records=(data??[]) as CatalogRecord[];
 const manager=access.role==="gerente_logistico";
 return <section><div className="mb-6"><h1 className="text-3xl font-semibold tracking-tight">{config.title}</h1><p className="mt-2 text-slate-600">{count??0} registro(s) na sua empresa.{!manager && " Seu perfil permite apenas consultas neste cadastro."}</p></div><div className={`grid items-start gap-6 ${manager?"lg:grid-cols-[minmax(0,1fr)_20rem]":""}`}><div className="space-y-3">{records.length===0?<div className="rounded-xl border bg-white p-6"><h2 className="font-semibold">Nenhum registro nesta página</h2><p className="mt-2 text-sm text-slate-600">{manager?"Use o formulário para iniciar o cadastro.":"Os registros aparecerão após o cadastro pelo Gerente Logístico."}</p></div>:records.map(record=><article key={record.id} className="rounded-xl border bg-white p-5"><h2 className="break-words text-lg font-semibold">{record.name}</h2>{record.symbol && <p className="mt-1 text-sm text-slate-600">Símbolo: {record.symbol}</p>}{record.unit_id && <p className="mt-1 text-sm text-slate-600">Unidade: {units.find(u=>u.id===record.unit_id)?.symbol??"Não disponível"}</p>}{catalog==="bolsas" && <Link href={`/painel/cadastros/bolsas/${record.id}/composicao`} className="mt-3 block py-2 text-sm font-medium text-teal-800 underline">Consultar composição</Link>}{catalog==="bolsas" && <Link href={`/painel/cadastros/bolsas/${record.id}/checklist`} className="mt-2 block py-3 text-sm font-medium text-teal-800 underline">Consultar checklist de saída</Link>}{manager && <div className="mt-4 space-y-3"><details className="rounded-lg border p-3"><summary className="min-h-8 cursor-pointer font-medium text-teal-800">Editar</summary><div className="mt-4"><CatalogForm catalog={catalog} record={record} units={units}/></div></details><details className="rounded-lg border p-3"><summary className="min-h-8 cursor-pointer font-medium text-red-800">Excluir</summary><div className="mt-4"><CatalogForm catalog={catalog} record={record} remove/></div></details></div>}</article>)}<nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 py-4">{page>1?<Link href={`?pagina=${page-1}`} className="rounded-lg border bg-white px-4 py-3">Anterior</Link>:<span/>}<span className="text-sm text-slate-600">Página {page}</span>{page*25<(count??0)?<Link href={`?pagina=${page+1}`} className="rounded-lg border bg-white px-4 py-3">Próxima</Link>:<span/>}</nav></div>{manager && <aside className="rounded-xl border bg-white p-5"><h2 className="mb-5 text-lg font-semibold">Cadastrar {config.singular}</h2>{catalog==="materiais"&&!units.length && <p className="mb-4 text-sm text-slate-700">Cadastre uma <Link href="/painel/cadastros/unidades" className="font-medium underline">unidade de medida</Link> antes de cadastrar materiais.</p>}<CatalogForm catalog={catalog} units={units}/></aside>}</div></section>;
}
export default function CatalogPage(props:Props) {return <Suspense fallback={<p role="status">Carregando cadastro…</p>}><CatalogContent {...props}/></Suspense>;}
