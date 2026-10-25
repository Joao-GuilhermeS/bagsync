import {Suspense} from "react";
import {login} from "./actions";
import {Submit} from "./submit";
async function LoginForm({searchParams}: {searchParams: Promise<{erro?: string}>}) {
 const {erro} = await searchParams;
 return <form action={login} className="space-y-5">
  {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">Não foi possível entrar. Confira e-mail e senha e tente novamente.</p>}
  <div><label htmlFor="email" className="mb-2 block font-medium">E-mail</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="min-h-12 w-full rounded-xl border border-slate-300 px-3" /></div>
  <div><label htmlFor="password" className="mb-2 block font-medium">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={4096} className="min-h-12 w-full rounded-xl border border-slate-300 px-3" /></div>
  <Submit />
  <p className="text-sm text-slate-600">Para obter ou recuperar seu acesso, contate o responsável pelo sistema.</p>
 </form>;
}
export default function LoginPage(props: {searchParams: Promise<{erro?: string}>}) {
 return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5 text-slate-900"><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-10"><p className="mb-8 text-xl font-bold text-teal-800">BagSync</p><h1 className="mb-2 text-3xl font-semibold">Acesse sua empresa</h1><p className="mb-8 text-slate-600">Gestão de produção e logística de bolsas.</p><Suspense fallback={<p>Carregando…</p>}><LoginForm {...props} /></Suspense></section></main>;
}
