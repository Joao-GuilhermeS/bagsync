import {Suspense} from "react";
import {notFound} from "next/navigation";
import Link from "next/link";
import {workspace} from "@/lib/operations/data";
import {isUuid} from "@/lib/catalogs/validation";
import {expeditionCards} from "@/lib/shipments/expedition-list";
import {ExpeditionList} from "@/components/expedition/expedition-list";
import {ExpeditionSkeleton} from "@/components/expedition/expedition-skeleton";
import {PageHeader} from "@/components/ui/page-header";
import {Icon} from "@/components/ui/icon";
type Props={searchParams:Promise<{pedido?:string;faccao?:string}>};
async function Content({searchParams}:Props){
 const {access,client}=await workspace();const search=await searchParams;
 if((search.pedido&&!isUuid(search.pedido))||(search.faccao&&!isUuid(search.faccao)))notFound();
 const cards=await expeditionCards(client,access.companyId);
 return <section><PageHeader title="Expedição" description="Prepare os kits, confira os materiais e envie os romaneios ao motorista." actions={access.role==="gerente_logistico"&&<Link href="/painel/expedicao/nova" className="btn-primary"><Icon name="plus"/>Nova Remessa</Link>}/><ExpeditionList cards={cards} manager={access.role==="gerente_logistico"} order={search.pedido} workshop={search.faccao}/></section>;
}
export default function ExpeditionPage(props:Props){return <Suspense fallback={<ExpeditionSkeleton/>}><Content {...props}/></Suspense>;}
