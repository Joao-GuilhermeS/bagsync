import Link from "next/link";
import {Suspense} from "react";
import {workspace} from "@/lib/operations/data";
import {pageNumber} from "@/lib/catalogs/validation";
import {Pagination} from "../operacoes/pagination";

async function Models({searchParams}:{searchParams:Promise<{pagina?:string}>}) {
 const {access,client}=await workspace();const page=pageNumber((await searchParams).pagina);
 const result=await client.from("bags").select("id,name",{count:"exact"}).eq("company_id",access.companyId).order("name").order("id").range((page-1)*25,page*25-1);
 if(result.error)throw new Error("Não foi possível carregar os modelos.");
 return <section><p className="mb-2 font-medium text-teal-800">Entregas e recolhimentos</p><h1 className="text-3xl font-semibold">Escolha o modelo de bolsa</h1><p className="my-4 text-slate-600">Abra um modelo e escolha a facção para consultar os romaneios ou registrar uma operação.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.data.map(model=><Link key={model.id} href={`/painel/entregador/${model.id}`} className="rounded-xl border bg-white p-6 hover:border-teal-700"><h2 className="break-words text-xl font-semibold">{model.name}</h2><p className="mt-4 text-sm font-medium text-teal-800">Escolher facção →</p></Link>)}</div>{!result.data.length&&<p className="rounded-xl border bg-white p-5">Nenhum modelo nesta página.</p>}<Pagination page={page} count={result.count??0}/></section>;
}
export default function DriverPage(props:{searchParams:Promise<{pagina?:string}>}){return <Suspense fallback={<p role="status">Carregando modelos…</p>}><Models {...props}/></Suspense>;}
