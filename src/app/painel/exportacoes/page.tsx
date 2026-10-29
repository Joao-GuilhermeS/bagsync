import {PageSkeleton} from "@/components/ui/skeleton";
import {Suspense} from "react";
import Link from "next/link";
import {workspace} from "@/lib/operations/data";
import {ExportFilters} from "./filters";
async function Content(){const {access,client}=await workspace();
 const load=async(table:string)=>{const result:{id:string;name:string}[]=[];for(let offset=0;;offset+=500){const {data,error}=await client.from(table).select("id,name").eq("company_id",access.companyId).order("id").range(offset,offset+499);if(error)throw new Error("Falha ao carregar filtros.");result.push(...data);if(data.length<500)return result.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));}};
 const [orders,workshops]=await Promise.all([load("production_orders"),load("workshops")]);
 return <section><h1 className="text-3xl font-semibold">Exportações</h1><p className="my-3 text-slate-600">Consulte e baixe os registros da sua empresa.</p><div className="my-6 max-w-3xl rounded-xl border bg-white p-5"><h2 className="mb-5 text-xl font-semibold">Extrato de movimentações</h2><ExportFilters orders={orders} workshops={workshops}/></div><div className="max-w-3xl rounded-xl border bg-white p-5"><h2 className="mb-3 text-xl font-semibold">Romaneio por operação</h2><p className="text-slate-600">No histórico, use Baixar romaneio PDF na operação desejada.</p><Link href="/painel/movimentacoes" className="mt-4 inline-block py-2 text-teal-800 underline">Abrir movimentações</Link></div></section>;
}
export default function ExportsPage(){return <Suspense fallback={<PageSkeleton label="Carregando exportações…" variant="form"/>}><Content/></Suspense>;}
