import {PageSkeleton} from "@/components/ui/skeleton";
import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {PageHeader} from "@/components/ui/page-header";
import {DispatchList} from "./dispatch-list";
type Props={searchParams:Promise<{pagina?:string;pedido?:string;faccao?:string;estado?:string}>};
async function Deliveries({searchParams}:Props) {
 const {access,client}=await workspace();const search=await searchParams;const status=search.estado??"a_entregar";
 if(!["a_entregar","entregue","estornado"].includes(status)||(search.pedido&&!isUuid(search.pedido))||(search.faccao&&!isUuid(search.faccao)))notFound();
 return <section><PageHeader eyebrow="Logística" title="Entregas de materiais" description="Romaneios emitidos na Expedição. Confirme o recebimento na facção sem movimentar o estoque novamente." actions={<Link href="/painel/entregador" className="btn-secondary">Operação por modelo / recolhimentos</Link>}/><nav aria-label="Estado das entregas" className="mb-6 flex flex-wrap gap-2">{[["a_entregar","A entregar"],["entregue","Entregues"],["estornado","Estornados"]].map(([value,label])=><Link key={value} href={`/painel/entregas?${new URLSearchParams({estado:value,...(search.pedido?{pedido:search.pedido}:{}),...(search.faccao?{faccao:search.faccao}:{})})}`} aria-current={status===value?"page":undefined} className={status===value?"btn-primary":"btn-secondary"}>{label}</Link>)}</nav><DispatchList client={client} company={access.companyId} canConfirm={access.role!=="gestor"} order={search.pedido} workshop={search.faccao} page={pageNumber(search.pagina)} status={status}/></section>;
}
export default function DeliveriesPage(props:Props){return <Suspense fallback={<PageSkeleton label="Carregando entregas…" variant="cards"/>}><Deliveries {...props}/></Suspense>;}
