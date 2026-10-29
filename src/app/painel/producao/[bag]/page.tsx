import {PageSkeleton} from "@/components/ui/skeleton";

import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {TrackingHeader} from "@/components/production/tracking-header";
import {TrackingTable} from "@/components/production/tracking-table";

import type {ProductionRow} from "@/lib/production/tracking-types";
import {Pagination} from "../../operacoes/pagination";

type Props={params:Promise<{bag:string}>;searchParams:Promise<{pagina?:string;pedido?:string;faccao?:string;pendentes?:string}>};
async function Tracking({params,searchParams}:Props){
 const {access,client}=await workspace();const {bag}=await params;const search=await searchParams;if(!isUuid(bag))notFound();
 if((search.pedido&&!isUuid(search.pedido))||(search.faccao&&!isUuid(search.faccao))||(search.pendentes&&search.pendentes!=="sim"))notFound();
 const page=pageNumber(search.pagina);
 const model=await client.from("bags").select("name").eq("company_id",access.companyId).eq("id",bag).maybeSingle();
 if(model.error)throw new Error("Não foi possível carregar o modelo.");if(!model.data)notFound();
 const orders:{id:string;name:string}[]=[];const workshops:{id:string;name:string;phone:string|null}[]=[];
 for(let offset=0;;offset+=500){const [o,w]=await Promise.all([
  client.from("production_orders").select("id,name").eq("company_id",access.companyId).eq("bag_id",bag).order("id").range(offset,offset+499),
  client.from("workshops").select("id,name,phone").eq("company_id",access.companyId).order("id").range(offset,offset+499)
 ]);if(o.error||w.error)throw new Error("Não foi possível carregar os filtros.");orders.push(...o.data);workshops.push(...w.data);if(o.data.length<500&&w.data.length<500)break;}
 let query=client.from("production_tracking").select("bag_id,order_id,workshop_id,order_name,workshop_name,distributed_quantity,received_quantity,remaining_quantity,excess_quantity,has_pending,has_excess,distribution_count,unstarted_kit_count,receipt_count,note_count,last_distribution_at,last_receipt_at",{count:"exact"}).eq("company_id",access.companyId).eq("bag_id",bag);
 if(search.pedido)query=query.eq("order_id",search.pedido);if(search.faccao)query=query.eq("workshop_id",search.faccao);if(search.pendentes)query=query.eq("has_pending",true);
 const result=await query.order("workshop_name").order("order_name").order("order_id").order("workshop_id").range((page-1)*25,page*25-1);
 if(result.error)throw new Error("Não foi possível carregar o acompanhamento.");const rows=result.data as ProductionRow[];
 const filters={...(search.pedido?{pedido:search.pedido}:{}),...(search.faccao?{faccao:search.faccao}:{}),...(search.pendentes?{pendentes:"sim"}:{})};
 return <section className="min-w-0 space-y-4 [--primary:#1B3B2B] [--olive:#1B3B2B]">
  <TrackingHeader bag={bag} name={model.data.name} orders={orders} workshops={workshops} filters={filters} count={result.count??0}/>
  <TrackingTable bag={bag} rows={rows.map(row=>({...row,phone:workshops.find(workshop=>workshop.id===row.workshop_id)?.phone??null}))}/>
  <Pagination page={page} count={result.count??0} query={filters}/>
 </section>;
}
export default function TrackingPage(props:Props){return <Suspense fallback={<PageSkeleton label="Carregando acompanhamento…" variant="table"/>}><Tracking {...props}/></Suspense>;}
