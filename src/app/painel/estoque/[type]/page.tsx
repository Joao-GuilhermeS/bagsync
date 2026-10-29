import {PageSkeleton} from "@/components/ui/skeleton";
import {FormDrawer} from "@/components/ui/drawer";
import {PageHeader} from "@/components/ui/page-header";
import {StockTable} from "@/components/stock/stock-table";
import {stockRows} from "@/lib/stock/data";
import Link from "next/link";
import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {workspace,operationOptions} from "@/lib/operations/data";
import {TransactionForm} from "../../operacoes/transaction-form";
type Props={params:Promise<{type:string}>};
async function Content({params}:Props){
 const {access,client}=await workspace();const {type}=await params;if(type!=="materiais"&&type!=="bolsas")notFound();const material=type==="materiais";
 const [options,rows]=await Promise.all([operationOptions(client,access.companyId),stockRows(client,access.companyId,material)]);
 const manager=access.role==="gerente_logistico";const entry=material&&manager;
 const requestKeys=Object.fromEntries(rows.map(row=>[row.id,randomUUID()]));
 return <section className="min-w-0 rounded-2xl bg-[#F8F9FA] p-1 [--primary:#1B3B2B] [--olive:#1B3B2B]"><PageHeader eyebrow="Estoque central" title="Controle de estoque" description="Consulte os materiais e as bolsas prontas. Os saldos são compartilhados pelos pedidos da empresa." actions={<>{entry&&<FormDrawer title="Entrada de materiais" trigger="Registrar entrada" description="Informe as quantidades recebidas, na unidade de cada material."><TransactionForm task="operation" requestKey={randomUUID()} options={options} kinds={["material_entry"]}/></FormDrawer>}{manager&&<Link className="btn-secondary" href="/painel/pedidos/novo">+ Novo pedido de produção</Link>}</>}/><nav aria-label="Tipo de estoque" className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-white p-1.5">{[["materiais","Materiais e insumos"],["bolsas","Bolsas prontas"]].map(([value,label])=><Link key={value} href={`/painel/estoque/${value}`} aria-current={type===value?"page":undefined} className={type===value?"btn-primary":"btn-secondary border-transparent"}>{label}</Link>)}</nav>{!material&&<p className="mb-4 text-sm text-slate-500">Bolsas prontas entram no estoque pelo recolhimento registrado no pedido.</p>}<StockTable key={type} rows={rows} material={material} canEnter={entry} options={options} requestKeys={requestKeys}/></section>;
}
export default function StockPage(props:Props){return <Suspense fallback={<PageSkeleton label="Carregando estoque…" variant="table"/>}><Content {...props}/></Suspense>;}
