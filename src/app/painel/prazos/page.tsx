import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {workspace} from "@/lib/operations/data";
import {deadlinesData} from "@/lib/deadlines/data";
import {businessDate} from "@/lib/deadlines/dates";
import {DeadlineList} from "@/components/deadlines/deadline-list";
import {PageHeader} from "@/components/ui/page-header";
import {PageSkeleton} from "@/components/ui/skeleton";
async function Content(){
 const {access,client}=await workspace();const {rows,events}=await deadlinesData(client,access.companyId);
 return <section><PageHeader title="Prazos de produção" description="Acompanhe as remessas com as facções, os vencimentos e as bolsas ainda a recolher."/><DeadlineList rows={rows} events={events} today={businessDate(new Date())} manager={access.role==="gerente_logistico"} canCollect={access.role!=="gestor"} requestKeys={Object.fromEntries(rows.map(row=>[row.kit_id,randomUUID()]))}/></section>;
}
export default function DeadlinesPage(){return <Suspense fallback={<PageSkeleton label="Carregando prazos de produção…"/>}><Content/></Suspense>;}
