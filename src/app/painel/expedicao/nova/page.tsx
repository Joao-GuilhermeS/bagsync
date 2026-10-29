import {businessDate} from "@/lib/deadlines/dates";
import {PageSkeleton} from "@/components/ui/skeleton";
import Link from "next/link";
import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid} from "@/lib/catalogs/validation";
import {expeditionOptions} from "@/lib/shipments/expedition-data";
import {RemessaWizard} from "@/components/expedition/remessa-wizard";
import {PageHeader} from "@/components/ui/page-header";
type Props={searchParams:Promise<{pedido?:string;faccao?:string}>};
async function Content({searchParams}:Props){
 const {access,client}=await workspace();
 if(access.role!=="gerente_logistico")return <p>Seu perfil permite consultar a Expedição. <Link href="/painel/expedicao" className="underline">Voltar às remessas</Link></p>;
 const search=await searchParams;
 if((search.pedido&&!isUuid(search.pedido))||(search.faccao&&!isUuid(search.faccao)))notFound();
 const options=await expeditionOptions(client,access.companyId);
 if((search.pedido&&!options.orders.some(row=>row.id===search.pedido))||(search.faccao&&!options.workshops.some(row=>row.id===search.faccao)))notFound();
 return <section className="mx-auto max-w-4xl"><Link href="/painel/expedicao" className="mb-4 inline-block min-h-11 py-3 text-sm text-olive underline">Voltar à Expedição</Link><PageHeader title="Nova Remessa" description="Selecione o destinatário, confira os materiais e emita o romaneio."/><RemessaWizard today={businessDate(new Date())} options={options} requestKey={randomUUID()} submissionKey={randomUUID()} defaultOrder={search.pedido} defaultWorkshop={search.faccao}/></section>;
}
export default function NewExpeditionPage(props:Props){return <Suspense fallback={<PageSkeleton label="Carregando nova remessa…" variant="form"/>}><Content {...props}/></Suspense>;}
