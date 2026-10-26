import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {Pagination} from "../../operacoes/pagination";
type Props={params:Promise<{bag:string}>;searchParams:Promise<{pagina?:string}>};
async function Workshops({params,searchParams}:Props) {
 const {access,client}=await workspace();const {bag}=await params;if(!isUuid(bag))notFound();const page=pageNumber((await searchParams).pagina);
 const [model,workshops]=await Promise.all([
  client.from("bags").select("name").eq("company_id",access.companyId).eq("id",bag).maybeSingle(),
  client.from("workshops").select("id,name",{count:"exact"}).eq("company_id",access.companyId).order("name").order("id").range((page-1)*25,page*25-1)
 ]);
 if(model.error||workshops.error)throw new Error("Não foi possível carregar as facções.");if(!model.data)notFound();
 return <section><Link href="/painel/entregador" className="inline-block py-3 text-teal-800 underline">Voltar aos modelos</Link><h1 className="break-words text-3xl font-semibold">{model.data.name}</h1><h2 className="my-4 text-xl font-medium">Escolha a facção / costureiro</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{workshops.data.map(w=><Link key={w.id} href={`/painel/entregador/${bag}/${w.id}`} className="rounded-xl border bg-white p-6 hover:border-teal-700"><h3 className="break-words text-lg font-semibold">{w.name}</h3><p className="mt-4 text-sm text-teal-800">Entregar materiais ou recolher bolsas →</p></Link>)}</div>{!workshops.data.length&&<p className="rounded-xl border bg-white p-5">Nenhuma facção nesta página.</p>}<Pagination page={page} count={workshops.count??0}/></section>;
}
export default function DriverWorkshopsPage(props:Props){return <Suspense fallback={<p role="status">Carregando facções…</p>}><Workshops {...props}/></Suspense>;}
