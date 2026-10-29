import {PageSkeleton} from "@/components/ui/skeleton";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import Link from "next/link";
import {workspace,operationOptions} from "@/lib/operations/data";
import {pageNumber,isUuid} from "@/lib/catalogs/validation";
import {History} from "../operacoes/history";
type Props={searchParams:Promise<{pagina?:string;material?:string;bolsa?:string}>};
async function Content({searchParams}:Props){
 const {client,access}=await workspace();const search=await searchParams;
 if((search.material&&!isUuid(search.material))||(search.bolsa&&!isUuid(search.bolsa))||(search.material&&search.bolsa))notFound();
 const options=await operationOptions(client,access.companyId);const page=pageNumber(search.pagina);
 const item=search.material?options.materials.find(item=>item.id===search.material):search.bolsa?options.bags.find(item=>item.id===search.bolsa):undefined;
 const query:Record<string,string>={};if(search.material)query.material=search.material;if(search.bolsa)query.bolsa=search.bolsa;
 return <section><h1 className="mb-3 text-3xl font-semibold">Movimentações</h1><p className="mb-6 text-slate-600">Entradas, entregas, recebimentos e estornos da empresa. O histórico original é preservado.</p>{(search.material||search.bolsa)&&<div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4"><p className="text-sm">Histórico do item: <strong>{item?.name??"Item indisponível"}</strong></p><Link className="btn-secondary" href="/painel/movimentacoes">Limpar filtro</Link></div>}<History client={client} company={access.companyId} manager={access.role==="gerente_logistico"} options={options} page={page} materialId={search.material} bagId={search.bolsa} paginationQuery={query}/></section>;
}
export default function HistoryPage(props:Props){return <Suspense fallback={<PageSkeleton label="Carregando movimentações…" variant="table"/>}><Content {...props}/></Suspense>;}
