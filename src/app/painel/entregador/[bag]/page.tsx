import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {WorkSteps} from "@/components/driver/work-steps";
import {Icon} from "@/components/ui/icon";
import {Pagination} from "../../operacoes/pagination";
type Props={params:Promise<{bag:string}>;searchParams:Promise<{pagina?:string}>};
async function Workshops({params,searchParams}:Props) {
 const {access,client}=await workspace();const {bag}=await params;if(!isUuid(bag))notFound();const page=pageNumber((await searchParams).pagina);
 const [model,workshops]=await Promise.all([
  client.from("bags").select("name").eq("company_id",access.companyId).eq("id",bag).maybeSingle(),
  client.from("workshops").select("id,name",{count:"exact"}).eq("company_id",access.companyId).order("name").order("id").range((page-1)*25,page*25-1)
 ]);
 if(model.error||workshops.error)throw new Error("Não foi possível carregar as facções.");if(!model.data)notFound();
 return <section><WorkSteps active={2}/><Link href="/painel/entregador" className="inline-block py-3 text-teal-800 underline">Voltar aos modelos</Link><h1 className="break-words text-3xl font-semibold">{model.data.name}</h1><Link href={`/painel/producao/${bag}`} className="mt-3 inline-block min-h-11 rounded-lg border bg-white px-4 py-3 text-teal-800">Acompanhar produção deste modelo</Link><h2 className="my-4 text-xl font-medium">Escolha a facção / costureiro</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{workshops.data.map(w=><Link key={w.id} href={`/painel/entregador/${bag}/${w.id}`} className="surface group p-6 transition-colors hover:border-olive/40"><span className="mb-4 grid size-11 place-items-center rounded-xl bg-mint text-olive"><Icon name="users"/></span><h3 className="break-words text-lg font-semibold">{w.name}</h3><p className="mt-4 text-sm text-teal-800">Entregar materiais ou recolher bolsas →</p></Link>)}</div>{!workshops.data.length&&<p className="rounded-xl border bg-white p-5">Nenhuma facção nesta página.</p>}<Pagination page={page} count={workshops.count??0}/></section>;
}
export default function DriverWorkshopsPage(props:Props){return <Suspense fallback={<p role="status">Carregando facções…</p>}><Workshops {...props}/></Suspense>;}
