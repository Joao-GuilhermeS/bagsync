import Link from "next/link";
import {DispatchList} from "../entregas/dispatch-list";
import {PageHeader} from "@/components/ui/page-header";
import {Suspense} from "react";
import {workspace} from "@/lib/operations/data";
import {pageNumber} from "@/lib/catalogs/validation";
import {DriverModelsView} from "@/components/driver/models";
async function Models({searchParams}:{searchParams:Promise<{pagina?:string}>}) {
 const {access,client}=await workspace();const page=pageNumber((await searchParams).pagina);
 const result=await client.from("bags").select("id,name",{count:"exact"}).eq("company_id",access.companyId).order("name").order("id").range((page-1)*25,page*25-1);
 if(result.error)throw new Error("Não foi possível carregar os modelos.");
 return <section><PageHeader title="Entregas e Recolhimentos" description="Entregue os kits emitidos pela fábrica e registre as bolsas recolhidas nas facções." actions={<Link href="#modelos-recolhimento" className="btn-primary">Registrar recolhimento</Link>}/><section className="mb-8"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-forest">Entregas aguardando confirmação</h2><Link href="/painel/entregas?estado=entregue" className="inline-block min-h-11 py-3 text-sm text-olive underline">Histórico de entregas</Link></div><DispatchList client={client} company={access.companyId} canConfirm={access.role!=="gestor"} preview/></section><section id="modelos-recolhimento" className="scroll-mt-24"><h2 className="mb-4 text-lg font-semibold text-forest">Recolhimentos por modelo</h2><DriverModelsView models={result.data} count={result.count??0} page={page} showHeader={false}/></section></section>;
}
export default function DriverPage(props:{searchParams:Promise<{pagina?:string}>}){return <Suspense fallback={<p role="status">Carregando modelos…</p>}><Models {...props}/></Suspense>;}
