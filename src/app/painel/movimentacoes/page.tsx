import {Suspense} from "react";
import {workspace,operationOptions} from "@/lib/operations/data";
import {pageNumber} from "@/lib/catalogs/validation";
import {History} from "../operacoes/history";
async function Content({searchParams}:{searchParams:Promise<{pagina?:string}>}){const {client,access}=await workspace();const options=await operationOptions(client,access.companyId);const page=pageNumber((await searchParams).pagina);return <section><h1 className="mb-3 text-3xl font-semibold">Movimentações</h1><p className="mb-6 text-slate-600">Entradas, entregas, recebimentos e estornos da empresa. O histórico original é preservado.</p><History client={client} company={access.companyId} manager={access.role==="gerente_logistico"} options={options} page={page}/></section>;}
export default function HistoryPage(props:{searchParams:Promise<{pagina?:string}>}){return <Suspense fallback={<p role="status">Carregando movimentações…</p>}><Content {...props}/></Suspense>;}
