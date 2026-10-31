import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {hasFeature} from "@/lib/auth/features";
import {roles} from "@/lib/auth/authorization";
import type {AccessAdministration} from "@/lib/auth/admin-validation";
import {PageSkeleton} from "@/components/ui/skeleton";
import {AdministrationView,type AdministrationKeys} from "@/components/admin/access-administration";
import {Pagination} from "../operacoes/pagination";
import {pageNumber} from "@/lib/catalogs/validation";
async function Administration({page}:{page:number}){
 const access=await requireAccess();if(!access||!hasFeature(access,"contas"))return <p>Administração não autorizada.</p>;
 const client=await createClient();const result=await client.rpc("get_access_administration",{p_page:page});
 if(result.error||!result.data||!Array.isArray(result.data.users))throw new Error("Não foi possível consultar a administração. Confira a implantação de contas e permissões.");
 const data=result.data as AccessAdministration;
 const keys:AdministrationKeys={create:randomUUID(),limits:Object.fromEntries(roles.map(role=>[role,randomUUID()])) as AdministrationKeys['limits'],users:Object.fromEntries(data.users.map(user=>[user.id,randomUUID()]))};
 return <><AdministrationView access={access} data={data} keys={keys}/><Pagination page={page} count={data.total}/></>;
}
export default async function Page({searchParams}:{searchParams:Promise<{pagina?:string}>}){const page=pageNumber((await searchParams).pagina);return <Suspense fallback={<PageSkeleton label="Carregando administração…" variant="table"/>}><Administration page={page}/></Suspense>;}
