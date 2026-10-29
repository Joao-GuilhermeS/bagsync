import {PageSkeleton} from "@/components/ui/skeleton";
import {FormDrawer} from "@/components/ui/drawer";
import {PageHeader} from "@/components/ui/page-header";
import {ModelChecklistTable} from "@/components/expedition/model-checklist-table";
import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {workspace} from "@/lib/operations/data";
import {checklistMaterials} from "@/lib/checklists/data";
import {isUuid,pageNumber} from "@/lib/catalogs/validation";
import {Pagination} from "@/app/painel/operacoes/pagination";
import {ChecklistForm,type ChecklistItem} from "../../checklist-form";

type Props={params:Promise<{id:string}>;searchParams:Promise<{pagina?:string}>};
async function ChecklistContent({params,searchParams}:Props) {
 const {access,client}=await workspace();const {id}=await params;if(!isUuid(id))notFound();
 const page=pageNumber((await searchParams).pagina);
 const [bag,checklist,materials]=await Promise.all([
  client.from("bags").select("name").eq("company_id",access.companyId).eq("id",id).maybeSingle(),
  client.from("bag_checklist_items").select("id,material_id,label,position,active,input_type",{count:"exact"}).eq("company_id",access.companyId).eq("bag_id",id).order("position").order("id").range((page-1)*25,page*25-1),
  checklistMaterials(client,access.companyId)
 ]);
 if(bag.error||checklist.error)throw new Error("Não foi possível carregar o checklist.");if(!bag.data)notFound();
 const manager=access.role==="gerente_logistico";const items=checklist.data as ChecklistItem[];
 return <section><Link href="/painel/cadastros/bolsas" className="mb-4 inline-block min-h-11 py-3 text-sm text-forest underline">Voltar aos modelos</Link><PageHeader eyebrow="Modelo de bolsa" title={`Checklist: ${bag.data.name}`} description="Defina os itens e o tipo de preenchimento. As quantidades serão previstas manualmente em cada remessa." actions={manager&&<FormDrawer title="Adicionar item ao checklist" trigger="Adicionar item" description="Escolha o material e como ele será preenchido na saída.">{!materials.length&&<p className="mb-4 text-sm text-amber-900">Cadastre primeiro um material.</p>}<ChecklistForm bagId={id} requestId={crypto.randomUUID()} materials={materials}/></FormDrawer>}/><ModelChecklistTable items={items} materials={materials} bagId={id} manager={manager}/><Pagination page={page} count={checklist.count??0}/><p className="mt-4 text-sm text-slate-500">Desativar um item afeta novas remessas. O histórico das remessas existentes é preservado.</p></section>;

}
export default function ChecklistPage(props:Props){return <Suspense fallback={<PageSkeleton label="Carregando checklist…" variant="table"/>}><ChecklistContent {...props}/></Suspense>;}
