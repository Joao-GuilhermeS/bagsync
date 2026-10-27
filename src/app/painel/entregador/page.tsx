import {Suspense} from "react";
import {workspace} from "@/lib/operations/data";
import {pageNumber} from "@/lib/catalogs/validation";
import {DriverModelsView} from "@/components/driver/models";
async function Models({searchParams}:{searchParams:Promise<{pagina?:string}>}) {
 const {access,client}=await workspace();const page=pageNumber((await searchParams).pagina);
 const result=await client.from("bags").select("id,name",{count:"exact"}).eq("company_id",access.companyId).order("name").order("id").range((page-1)*25,page*25-1);
 if(result.error)throw new Error("Não foi possível carregar os modelos.");
 return <DriverModelsView models={result.data} count={result.count??0} page={page}/>;
}
export default function DriverPage(props:{searchParams:Promise<{pagina?:string}>}){return <Suspense fallback={<p role="status">Carregando modelos…</p>}><Models {...props}/></Suspense>;}
