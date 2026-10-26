import Link from "next/link";
import {Suspense} from "react";
import {requireAccess} from "@/lib/auth/context";
import {logout} from "@/app/login/actions";
import {catalogs} from "@/lib/catalogs/validation";
async function Shell({children}:{children:React.ReactNode}) {
 const access=await requireAccess();
 if(!access) return <main className="mx-auto max-w-3xl p-8 text-slate-900"><h1 className="text-2xl font-semibold">Acesso pendente</h1><p className="my-5">Solicite seu vínculo com a empresa ao responsável.</p><form action={logout}><button className="min-h-11 rounded-lg border px-5">Sair</button></form></main>;
 const labels={gerente_logistico:"Gerente Logístico",motorista:"Motorista / Entregador",gestor:"Gestor"};
 return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4"><Link href="/painel" className="text-2xl font-bold tracking-tight text-teal-800">BagSync</Link><div className="flex items-center gap-4"><span className="text-sm text-slate-600">{labels[access.role]}</span><form action={logout}><button className="min-h-11 rounded-lg border border-slate-300 px-4">Sair</button></form></div></div></header><div className="mx-auto max-w-6xl px-5 py-6"><nav aria-label="Navegação principal" className="mb-8 flex flex-wrap gap-2"><Link href="/painel" className="rounded-lg border bg-white px-4 py-3 text-sm">Início</Link>{[["/painel/entregador","Entregador"],["/painel/pedidos","Pedidos"],["/painel/remessas","Remessas"],["/painel/estoque/materiais","Estoque de materiais"],["/painel/estoque/bolsas","Estoque de bolsas"],["/painel/movimentacoes","Movimentações"],["/painel/exportacoes","Exportações"]].map(([href,label])=><Link key={href} href={href} className="rounded-lg border bg-white px-4 py-3 text-sm hover:border-teal-700">{label}</Link>)}{Object.entries(catalogs).map(([key,c])=><Link key={key} href={`/painel/cadastros/${key}`} className="rounded-lg border bg-white px-4 py-3 text-sm hover:border-teal-700">{c.title}</Link>)}</nav><main>{children}</main></div></div>;
}
export default function PanelLayout({children}:{children:React.ReactNode}) {return <Suspense fallback={<p className="p-8">Verificando acesso…</p>}><Shell>{children}</Shell></Suspense>;}
