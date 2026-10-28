import Link from "next/link";
import type {Role} from "@/lib/auth/authorization";
import type {DashboardData} from "@/lib/dashboard";
import {formatQuantity} from "@/lib/operations/validation";
import {Icon,type IconName} from "../ui/icon";
import {Badge} from "../ui/badge";
import {ProductionDashboard} from "./production-dashboard";

type Shortcut={label:string;href:string;icon:IconName};
export function DashboardOverview({data,role}:{data:DashboardData;role:Role}) {
 const steps=[
  {title:"Organize os cadastros",description:"Modelos, materiais e facções.",href:"/painel/cadastros/bolsas"},
  {title:"Prepare a produção",description:"Pedido, remessa e checklist da saída.",href:"/painel/expedicao"},
  {title:"Entregue e recolha",description:"Confirme entregas e registre as bolsas.",href:"/painel/entregador"},
  {title:"Acompanhe o andamento",description:"Quantidades e observações por facção.",href:"/painel/producao"},
 ];
 const shortcuts:Shortcut[]=role==="gestor"?[
  {label:"Consultar produção",href:"/painel/producao",icon:"chart"},
  {label:"Relatórios e documentos",href:"/painel/exportacoes",icon:"file"},
  {label:"Consultar estoque",href:"/painel/estoque/bolsas",icon:"layers"},
 ]:[
  {label:"Confirmar entrega",href:"/painel/entregas",icon:"truck"},
  {label:"Registrar recolhimento",href:"/painel/entregador",icon:"bag"},
  ...(role==="gerente_logistico"?[
   {label:"Cadastrar modelo",href:"/painel/cadastros/bolsas",icon:"plus" as const},
   {label:"Nova expedição",href:"/painel/expedicao/nova",icon:"box" as const},
  ]:[{label:"Consultar facções",href:"/painel/cadastros/faccoes",icon:"users" as const}]),
 ];
 const date=(value:string)=>new Date(value).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit"});
 const time=(value:string)=>new Date(value).toLocaleTimeString("pt-BR",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit"});

 return <section>
  <header className="mb-6"><h1 className="page-title text-forest">Visão geral</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">Acompanhe os pedidos, a produção e as bolsas prontas em um só lugar.</p></header>
  <ProductionDashboard models={data.models}/>
  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
   <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" aria-labelledby="dashboard-start"><div className="mb-4 flex items-center gap-2"><Icon name="orders" className="size-4 text-olive"/><h2 id="dashboard-start" className="text-sm font-semibold text-forest">Por Onde Começar</h2></div><ol className="space-y-1">{steps.map((step,index)=><li key={step.title}><Link href={step.href} className="group flex min-h-16 items-center gap-3 rounded-lg py-2 transition-colors hover:bg-slate-50"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-xs font-semibold text-olive">{index+1}</span><div className="min-w-0 flex-1"><h3 className="text-xs font-semibold text-slate-700">{step.title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{step.description}</p></div><Icon name="chevron" className="size-3 shrink-0 text-slate-300 group-hover:text-olive"/></Link></li>)}</ol></section>
   <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" aria-labelledby="dashboard-shortcuts"><div className="mb-4 flex items-center gap-2"><Icon name="arrow" className="size-4 text-olive"/><h2 id="dashboard-shortcuts" className="text-sm font-semibold text-forest">Acesso Rápido</h2></div><div className="space-y-2">{shortcuts.map(shortcut=><Link key={shortcut.label} href={shortcut.href} className="group flex min-h-14 items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-olive/30 hover:bg-mint/30"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-olive"><Icon name={shortcut.icon} className="size-4"/></span><span className="flex-1 text-xs font-medium text-slate-700">{shortcut.label}</span><Icon name="chevron" className="size-3 shrink-0 text-slate-300"/></Link>)}</div></section>
   <section className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1 sm:p-6" aria-labelledby="dashboard-recent"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="dashboard-recent" className="text-sm font-semibold text-forest">Recolhimentos Recentes</h2><Link href="/painel/movimentacoes" className="inline-flex min-h-11 items-center text-xs font-medium text-olive hover:underline">Ver todos</Link></div>{data.recent.length?<div className="overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Últimos cinco recolhimentos da empresa</caption><thead className="border-b text-[11px] text-slate-400"><tr><th scope="col" className="pr-3 pb-3 font-medium">Data</th><th scope="col" className="pr-3 pb-3 font-medium">Modelo</th><th scope="col" className="pr-3 pb-3 text-right font-medium">Quantidade</th><th scope="col" className="pb-3 font-medium">Status</th></tr></thead><tbody className="divide-y">{data.recent.slice(0,5).map(event=><tr key={event.id}><td className="py-3 pr-3 text-slate-600"><time dateTime={event.date} title={new Date(event.date).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}>{date(event.date)}<span className="mt-1 block text-[10px] text-slate-400">{time(event.date)}</span></time></td><th scope="row" className="max-w-36 py-3 pr-3 text-left font-medium text-slate-700"><span className="block break-words" title={`${event.order} · ${event.workshop}`}>{event.model}</span></th><td className="py-3 pr-3 text-right tabular-nums text-slate-700">{formatQuantity(event.quantity)}</td><td className="py-3"><Badge tone={event.reversed?"danger":"success"}>{event.reversed?"Estornado":"Recolhido"}</Badge></td></tr>)}</tbody></table></div>:<div className="flex min-h-52 flex-col items-center justify-center px-3 text-center"><Icon name="bag" className="mb-3 size-7 text-slate-300"/><p className="text-sm font-medium text-slate-600">Nenhum recolhimento registrado</p><p className="mt-2 max-w-56 text-xs leading-relaxed text-slate-400">Os últimos registros aparecerão aqui com modelo, quantidade e status.</p></div>}</section>
  </div>
 </section>;
}
