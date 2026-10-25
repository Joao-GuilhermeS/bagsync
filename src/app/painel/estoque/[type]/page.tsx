import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {workspace,operationOptions} from "@/lib/operations/data";
import {formatQuantity} from "@/lib/operations/validation";
import {pageNumber} from "@/lib/catalogs/validation";
import {TransactionForm} from "../../operacoes/transaction-form";
import {Pagination} from "../../operacoes/pagination";
type Props={params:Promise<{type:string}>;searchParams:Promise<{pagina?:string}>};
async function Content({params,searchParams}:Props){
 const {access,client}=await workspace();const {type}=await params;if(type!=="materiais"&&type!=="bolsas")notFound();const material=type==="materiais";const page=pageNumber((await searchParams).pagina);
 const column=material?"material_id":"bag_id";
 const [options,result]=await Promise.all([operationOptions(client,access.companyId),client.from(material?"material_stock_balances":"bag_stock_balances").select(`${column},balance::text,negative_balance`,{count:"exact"}).eq("company_id",access.companyId).order(column).range((page-1)*25,page*25-1)]);
 if(result.error)throw new Error("Falha ao consultar saldo.");const rows=result.data as unknown as {material_id?:string;bag_id?:string;balance:string;negative_balance:boolean}[];
 const entry=material&&access.role==="gerente_logistico";
 return <section><h1 className="text-3xl font-semibold">Estoque de {material?"materiais":"bolsas"}</h1><p className="my-3 text-slate-600">Estoque central compartilhado por todos os pedidos da empresa.{!material&&" Bolsas entram pelo recebimento no pedido."}</p><div className={`mt-6 grid items-start gap-6 ${entry?"lg:grid-cols-[minmax(0,1fr)_22rem]":""}`}><div className="space-y-3">{!rows.length&&<p className="rounded-xl border bg-white p-6">Nenhum {material?"material":"modelo de bolsa"} cadastrado nesta página.</p>}{rows.map(row=>{const id=row.material_id??row.bag_id;return <article key={id} className={`rounded-xl border bg-white p-5 ${row.negative_balance?"border-amber-500":""}`}><h2 className="text-lg font-semibold">{(material?options.materials:options.bags).find(o=>o.id===id)?.name??"Produto não disponível"}</h2><p className="mt-2 break-all text-2xl font-semibold">{formatQuantity(row.balance)}</p>{row.negative_balance&&<p className="mt-2 font-medium text-amber-900">Atenção: saldo negativo.</p>}</article>;})}<Pagination page={page} count={result.count??0}/></div>{entry&&<aside className="rounded-xl border bg-white p-5"><h2 className="mb-5 text-xl font-semibold">Entrada de materiais</h2><TransactionForm task="operation" requestKey={randomUUID()} options={options} kinds={["material_entry"]}/></aside>}</div></section>;
}
export default function StockPage(props:Props){return <Suspense fallback={<p role="status">Carregando estoque…</p>}><Content {...props}/></Suspense>;}
