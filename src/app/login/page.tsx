import {Suspense} from "react";
import Image from "next/image";
import {Icon} from "@/components/ui/icon";
import {login} from "./actions";
import {Submit} from "./submit";
async function LoginForm({searchParams}: {searchParams: Promise<{erro?: string}>}) {
 const {erro} = await searchParams;
 return <form action={login} className="space-y-5">
  {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">Não foi possível entrar. Confira e-mail e senha e tente novamente.</p>}
  <div><label htmlFor="email" className="mb-2 block text-sm font-medium">E-mail</label><input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="seuemail@exemplo.com" required maxLength={254} className="field-input border-slate-300 transition-colors focus:border-primary" /></div>
  <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" required maxLength={4096} className="field-input border-slate-300 transition-colors focus:border-primary" /></div>
  <Submit />
  <p className="text-center text-xs leading-5 text-slate-500">Para obter ou recuperar seu acesso, fale com o responsável pelo sistema.</p>
 </form>;
}
export default function LoginPage(props: {searchParams: Promise<{erro?: string}>}) {
 return <main className="grid min-h-dvh bg-white text-slate-900 lg:grid-cols-[1.08fr_1fr]">
  <aside className="relative hidden overflow-hidden bg-black text-white lg:flex lg:flex-col lg:justify-between" aria-label="BagSync produção e logística">
   <div className="px-10 pt-10 xl:px-14 xl:pt-12">
    <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-emerald-300"><Icon name="bag" className="size-6"/></span><span className="text-xl font-semibold tracking-tight">BagSync</span></div>
    <div className="mt-14 max-w-lg"><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Produção & logística</p><h2 className="mt-4 text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">Sua produção,<br/>mais conectada.</h2><p className="mt-5 max-w-sm text-base leading-7 text-slate-300">Pedidos, materiais e facções em um só lugar. Da fábrica à entrega.</p></div>
   </div>
   <div className="relative mx-auto mt-6 w-full max-w-3xl pb-9" aria-hidden="true"><Image src="/images/login/illustration.png" alt="" width={1659} height={948} sizes="(min-width: 1024px) 54vw, 1px" className="h-auto w-full object-contain"/></div>
   <p className="px-10 pb-8 text-xs text-slate-400 xl:px-14">Gestão de produção de bolsas.</p>
  </aside>
  <section className="flex min-w-0 flex-col items-center justify-center px-6 py-10 sm:px-12 lg:px-10 xl:px-16" aria-labelledby="login-title">
   <div className="w-full max-w-sm">
    <Image src="/images/login/rl-bolsas.png" alt="RL Bolsas. Sua produção conectada, do início à entrega." width={2009} height={783} sizes="(max-width: 480px) 75vw, 320px" preload className="mb-8 h-auto w-72 max-w-full sm:w-80"/>
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-olive">Bem-vindo ao BagSync</p>
    <h1 id="login-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Acesse sua empresa</h1><p className="mt-3 mb-8 text-sm leading-6 text-slate-500">Entre com seu e-mail e senha para acompanhar sua operação.</p>
    <Suspense fallback={<div role="status" aria-busy="true" className="space-y-5"><span className="sr-only">Carregando formulário de acesso…</span>{[0,1,2].map(item=><div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100"/>)}</div>}><LoginForm {...props} /></Suspense>
    <div className="mt-7 border-t pt-5">
     <p className="text-center text-xs leading-5 text-slate-500">Privacidade e proteção de dados: para informações sobre seus direitos previstos na LGPD, fale com o responsável pelo sistema.</p>
     <button type="button" disabled aria-describedby="support-unavailable" className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 disabled:cursor-not-allowed" title="WhatsApp do suporte ainda não configurado">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z"/><path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 2c-1 2-3 2-6 0s-5-5-3-9Z"/></svg>
      Suporte técnico pelo WhatsApp<span id="support-unavailable" className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">Em breve</span>
     </button>
    </div>
   </div>
  </section>
 </main>;
}
