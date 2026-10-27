import {Suspense} from "react";
import {workspace} from "@/lib/operations/data";
import {dashboardData} from "@/lib/dashboard";
import {DashboardOverview} from "@/components/dashboard/overview";
async function Overview(){
 const {access,client}=await workspace();const data=await dashboardData(client,access.companyId);
 return <DashboardOverview data={data} role={access.role}/>;
}
export default function Panel(){return <Suspense fallback={<div className="space-y-5" role="status"><p className="page-title">Visão geral</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(item=><div key={item} className="surface h-40 animate-pulse bg-white"/>)}</div><p className="text-sm text-slate-500">Atualizando os indicadores da sua empresa…</p></div>}><Overview/></Suspense>;}
