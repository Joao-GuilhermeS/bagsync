import {Suspense} from "react";
import {requireAccess} from "@/lib/auth/context";
import {logout} from "@/app/login/actions";
import {createClient} from "@/lib/supabase/server";
import {AppShell} from "@/components/layout/app-shell";
async function Shell({children}:{children:React.ReactNode}) {
 const access=await requireAccess();
 if(!access) return <main className="mx-auto max-w-3xl p-8 text-slate-900"><h1 className="text-2xl font-semibold">Acesso pendente</h1><p className="my-5">Solicite seu vínculo com a empresa ao responsável.</p><form action={logout}><button className="min-h-11 rounded-lg border px-5">Sair</button></form></main>;
 const client=await createClient();const company=await client.from("companies").select("name").eq("id",access.companyId).maybeSingle();
 if(company.error)throw new Error("Não foi possível carregar a empresa.");
 return <AppShell company={company.data?.name??"Empresa vinculada"} role={access.role} logout={<form action={logout}><button className="btn-secondary py-2">Sair</button></form>}>{children}</AppShell>;
}
export default function PanelLayout({children}:{children:React.ReactNode}) {return <Suspense fallback={<p className="p-8">Verificando acesso…</p>}><Shell>{children}</Shell></Suspense>;}
