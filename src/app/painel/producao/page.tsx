import Link from "next/link";
import {Suspense} from "react";
import {workspace} from "@/lib/operations/data";
import {pageNumber} from "@/lib/catalogs/validation";
import {Pagination} from "../operacoes/pagination";
async function ProductionModels({searchParams}:{searchParams:Promise<{pagina?:string}>}){
 const {access,client}=await workspace();const page=pageNumber((await searchParams).pagina);
 const result=await client.from("bags").select("id,name",{count:"exact"}).eq("company_id",access.companyId).order("name").order("id").range((page-1)*25,page*25-1);
 if(result.error)throw new Error("Não foi possível consultar os modelos.");
 return <section><h1 className="text-3xl font-semibold">Acompanhamento da produção</h1><p className="my-4 text-slate-600">Escolha o modelo para acompanhar distribuições, recolhimentos e observações por pedido e facção.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.data.map(bag=><Link key={bag.id} href={`/painel/producao/${bag.id}`} className="rounded-xl border bg-white p-6 hover:border-teal-700"><h2 className="break-words text-xl font-semibold">{bag.name}</h2><p className="mt-4 text-sm text-teal-800">Consultar produção →</p></Link>)}</div>{!result.data.length&&<p className="rounded-xl border bg-white p-5">Nenhum modelo nesta página.</p>}<Pagination page={page} count={result.count??0}/></section>;
}
export default function ProductionPage(props:{searchParams:Promise<{pagina?:string}>}){return <Suspense fallback={<p role="status">Carregando modelos…</p>}><ProductionModels {...props}/></Suspense>;}
