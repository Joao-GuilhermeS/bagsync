import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {SubmissionHistory} from "../../submission-history";
type Props={params:Promise<{id:string}>;searchParams:Promise<{pagina?:string}>};
async function Submissions({params,searchParams}:Props){
 const {access,client}=await workspace();const {id}=await params;if(!isUuid(id))notFound();
 const kit=await client.from("shipment_kits").select("id").eq("company_id",access.companyId).eq("id",id).maybeSingle();
 if(kit.error)throw new Error("Não foi possível carregar a remessa.");if(!kit.data)notFound();
 return <section><Link href={`/painel/remessas/${id}`} className="inline-block py-3 text-teal-800 underline">Voltar à remessa</Link><h1 className="text-3xl font-semibold">Histórico do controle de saída</h1><SubmissionHistory client={client} company={access.companyId} kit={id} page={pageNumber((await searchParams).pagina)}/></section>;
}
export default function SubmissionsPage(props:Props){return <Suspense fallback={<p role="status">Carregando preenchimentos…</p>}><Submissions {...props}/></Suspense>;}
