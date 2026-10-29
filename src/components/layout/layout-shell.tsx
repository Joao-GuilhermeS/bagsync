"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useRef, useState, type ReactNode} from "react";
import type {Role} from "@/lib/auth/authorization";
import {navigationFor, navigationLocation, type NavItem} from "@/lib/navigation";
import {Icon} from "../ui/icon";
import {ToastProvider} from "../ui/toast";

const labels = {gerente_logistico:"Gerente Logístico", motorista:"Motorista / Entregador", gestor:"Gestor"};

export function LayoutShell({company, role, logout, children}: {company:string;role:Role;logout:ReactNode;children:ReactNode}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const groups = navigationFor(role);
  const location = navigationLocation(pathname, groups);
  const selected = (item:NavItem) => item.href === location.item.href;
  const initials = role === "gerente_logistico" ? "GL" : role === "motorista" ? "ME" : "GE";
  const profile = (compact=false) => <div className={`flex min-w-0 items-center gap-3 ${compact?"justify-center":""}`}>
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-xs font-semibold text-olive" aria-label={labels[role]}>{initials}</span>
    {!compact && <div className="min-w-0"><p className="truncate text-sm font-semibold" title={company}>{company}</p><p className="mt-1 text-xs text-slate-500">{labels[role]}</p></div>}
  </div>;
  const navigation = (compact=false) => groups.map(group => <div key={group.label} className="mb-6">
    <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${compact?"sr-only":""}`}>{group.label}</p>
    <div className="space-y-1">{group.items.map(item => <Link key={item.href} href={item.href} title={compact?item.label:undefined} aria-current={selected(item)?"page":undefined} onClick={()=>menu.current?.close()} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${selected(item)?"bg-mint font-semibold text-olive":"text-slate-600 hover:bg-slate-50 hover:text-forest"} ${compact?"justify-center":""}`}>
      <Icon name={item.icon} className={`size-[19px] shrink-0 ${selected(item)?"text-primary":"text-slate-400"}`}/><span className={compact?"sr-only":"leading-snug"}>{item.label}</span>
    </Link>)}</div>
  </div>);
  const bottom:NavItem[] = [
    {href:"/painel",label:"Início",icon:"home"},
    role === "gestor" ? {href:"/painel/exportacoes",label:"Relatórios",icon:"file"} : {href:"/painel/entregador",label:"Entregas",icon:"truck"},
    {href:"/painel/producao",label:"Produção",icon:"chart"},
    {href:"/painel/estoque/materiais",label:"Estoque",icon:"layers"},
  ];
  return <ToastProvider><div className="min-h-dvh bg-background">
    <a href="#conteudo-principal" className="fixed top-2 left-2 z-[110] -translate-y-24 rounded-lg bg-white p-3 text-forest focus:translate-y-0">Ir para o conteúdo</a>
    <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-white lg:flex ${collapsed?"w-22":"w-72"}`} aria-label="Menu principal">
      <Link href="/painel" className={`flex h-21 shrink-0 items-center gap-3 border-b px-6 ${collapsed?"justify-center px-0":""}`}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white"><Icon name="bag" className="size-6"/></span>
        <span className={collapsed?"sr-only":"text-xl font-semibold tracking-tight"}>BagSync<span className="mt-0.5 block text-[10px] font-normal uppercase tracking-[0.16em] text-slate-500">Produção & logística</span></span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pt-6" aria-label="Seções do sistema">{navigation(collapsed)}</nav>
      <footer className="space-y-3 border-t p-4">{profile(collapsed)}<button type="button" aria-label={collapsed?"Expandir menu":"Recolher menu"} aria-expanded={!collapsed} onClick={()=>setCollapsed(!collapsed)} className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl text-xs text-slate-500 hover:bg-slate-50"><Icon name="panel"/>{!collapsed&&"Recolher menu"}</button></footer>
    </aside>
    <div className={collapsed?"lg:pl-22":"lg:pl-72"}>
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-8">
          <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-500" title={company}>{company}</p><p className="mt-1 truncate text-sm font-semibold sm:text-base">{location.item.label}</p></div>
          <div className="flex shrink-0 items-center gap-3">
            {role === "gerente_logistico" && pathname!=="/painel" && pathname!=="/painel/visao-geral" && <Link href="/painel/pedidos/novo" className="btn-primary hidden px-3 sm:inline-flex"><Icon name="plus" className="size-4"/><span className="hidden xl:inline">Novo pedido de produção</span><span className="xl:hidden">Novo pedido</span></Link>}
            <span className="hidden rounded-full border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 md:inline-flex">{labels[role]}</span>
            <span className="grid size-10 place-items-center rounded-full bg-mint text-xs font-semibold text-olive" aria-label={labels[role]}>{initials}</span>
            <div className="hidden lg:block">{logout}</div>
            <button type="button" aria-label="Abrir menu" onClick={()=>menu.current?.showModal()} className="btn-secondary size-11 p-0 lg:hidden"><Icon name="menu"/></button>
          </div>
        </div>
      </header>
      <main id="conteudo-principal" tabIndex={-1} className={`mx-auto max-w-[1500px] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none sm:px-8 sm:pt-8 ${pathname==="/painel"||pathname==="/painel/visao-geral"?"lg:pt-4 lg:pb-4":"lg:pb-10"}`}>{children}</main>
    </div>
    <nav aria-label="Navegação rápida" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {bottom.map(item=><Link key={item.href} href={item.href} aria-current={selected(item)?"page":undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${selected(item)?"text-olive":"text-slate-500"}`}><span className={`rounded-lg px-4 py-1 ${selected(item)?"bg-mint":""}`}><Icon name={item.icon}/></span>{item.label}</Link>)}
      <button type="button" onClick={()=>menu.current?.showModal()} className="flex min-h-16 flex-col items-center justify-center gap-2 text-[11px] font-medium text-slate-500"><Icon name="menu"/>Menu</button>
    </nav>
    <dialog ref={menu} aria-labelledby="mobile-menu-title" className="dialog-panel max-w-sm text-forest" onClick={event=>{if(event.target===menu.current)menu.current.close();}}>
      <div className="flex items-center justify-between border-b p-5"><div><h2 id="mobile-menu-title" className="text-xl font-semibold">BagSync</h2><p className="mt-1 text-xs text-slate-500">{company}</p></div><button type="button" aria-label="Fechar menu" onClick={()=>menu.current?.close()} className="btn-secondary size-11 p-0"><Icon name="close"/></button></div>
      {role === "gerente_logistico" && <Link href="/painel/pedidos/novo" onClick={()=>menu.current?.close()} className="btn-primary mx-4 mt-4 flex"><Icon name="plus"/>Novo pedido de produção</Link>}
      <nav className="p-4" aria-label="Todas as seções">{navigation()}</nav><div className="mx-4 mb-6 space-y-4 rounded-xl border p-4">{profile()}{logout}</div>
    </dialog>
  </div></ToastProvider>;
}
