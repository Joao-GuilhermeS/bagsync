import {Suspense} from "react";
import {requireAccess} from "@/lib/auth/context";
import {logout} from "@/app/login/actions";
const labels = {gerente_logistico:"Gerente logístico",motorista:"Motorista / Entregador",gestor:"Gestor"};
async function Account() {
 const access = await requireAccess();
 return <section className="mx-auto max-w-4xl p-5 sm:p-10"><header className="mb-12 flex items-center justify-between gap-4"><span className="text-2xl font-bold text-teal-800">BagSync</span><form action={logout}><button className="min-h-11 rounded-lg border px-5">Sair</button></form></header><h1 className="mb-4 text-3xl font-semibold">{access ? "Acesso autorizado" : "Acesso pendente"}</h1><p className="text-slate-600">{access ? `Perfil: ${labels[access.role]}. Seu acesso está vinculado à sua empresa.` : "Seu usuário ainda não possui vínculo com uma empresa. Solicite a configuração ao responsável."}</p>{access && <p className="mt-6 text-slate-600">Os módulos operacionais estão em desenvolvimento.</p>}</section>;
}
export default function Panel() {return <main className="min-h-screen bg-slate-50 text-slate-900"><Suspense fallback={<p className="p-8">Verificando acesso…</p>}><Account /></Suspense></main>;}
