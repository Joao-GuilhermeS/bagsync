import {FormDrawer} from "@/components/ui/drawer";
import {PageHeader} from "@/components/ui/page-header";
import {Badge} from "@/components/ui/badge";
import Link from "next/link";
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
 return <section><PageHeader eyebrow="Estoque central" title="Controle de estoque" description="Consulte os materiais e as bolsas prontas. Os saldos são compartilhados pelos pedidos da empresa." actions={entry&&<FormDrawer title="Entrada de materiais" trigger="Registrar entrada" description="Informe as quantidades recebidas, na unidade de cada material."><TransactionForm task="operation" requestKey={randomUUID()} options={options} kinds={["material_entry"]}/></FormDrawer>}/><nav aria-label="Tipo de estoque" className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-white p-1.5">{[["materiais","Materiais e insumos"],["bolsas","Bolsas prontas"]].map(([value,label])=><Link key={value} href={`/painel/estoque/${value}`} aria-current={type===value?"page":undefined} className={type===value?"btn-primary":"btn-secondary border-transparent"}>{label}</Link>)}</nav>{!material&&<p className="mb-4 text-sm text-slate-500">Bolsas prontas entram no estoque pelo recolhimento registrado no pedido.</p>}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{!rows.length&&<p className="surface p-8 text-sm text-slate-500 sm:col-span-2 xl:col-span-3">Nenhum produto nesta página.</p>}{rows.map(row=>{const id=row.material_id??row.bag_id;return <article key={id} className="surface p-5"><div className="mb-4"><Badge tone={row.negative_balance?"danger":"success"}>{row.negative_balance?"Saldo negativo":"Saldo registrado"}</Badge></div><h2 className="break-words font-semibold">{(material?options.materials:options.bags).find(o=>o.id===id)?.name??"Produto não disponível"}</h2><p className="mt-5 break-all text-3xl font-semibold tracking-tight tabular-nums">{formatQuantity(row.balance)}</p><p className="mt-2 text-xs text-slate-500">{row.negative_balance?"Confira as entradas e saídas deste material.":"Disponível no estoque central."}</p></article>;})}</div><Pagination page={page} count={result.count??0}/></section>;

}
export default function StockPage(props:Props){return <Suspense fallback={<p role="status">Carregando estoque…</p>}><Content {...props}/></Suspense>;}
