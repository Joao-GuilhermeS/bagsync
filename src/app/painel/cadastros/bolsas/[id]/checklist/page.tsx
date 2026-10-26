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
 return <section><Link href="/painel/cadastros/bolsas" className="inline-block py-3 text-teal-800 underline">Voltar aos modelos</Link>
  <h1 className="break-words text-3xl font-semibold">Checklist: {bag.data.name}</h1>
  <p className="my-3 text-slate-600">Defina os itens deste modelo. As quantidades previstas serão informadas manualmente em cada remessa; não há baixa de estoque nesta tela.</p>
  {!manager&&<p className="mb-4">Seu perfil permite apenas consulta.</p>}
  <div className={`mt-6 grid items-start gap-6 ${manager?"lg:grid-cols-[minmax(0,1fr)_22rem]":""}`}><div className="space-y-4">
   {!items.length&&<p className="rounded-xl border bg-white p-5">Nenhum item nesta página do checklist.</p>}
   {items.map(item=><article key={item.id} className="rounded-xl border bg-white p-5"><h2 className="break-words text-lg font-semibold">{item.label}</h2><p className="my-2 break-words text-sm">{materials.find(m=>m.id===item.material_id)?.name??"Material indisponível"}</p><p className="text-sm">{item.input_type==="checkbox"?"Caixa de marcação (✓)":item.input_type==="text"?"Texto livre":"Tipo ainda não configurado"} · Posição: {item.position} · {item.active?"Ativo":"Inativo"}</p>{manager&&<details className="mt-4 rounded-lg border p-3"><summary className="min-h-11 cursor-pointer py-2 text-teal-800">Editar item</summary><ChecklistForm bagId={id} requestId={item.id} materials={materials} item={item}/></details>}</article>)}
   <Pagination page={page} count={checklist.count??0}/>
  </div>{manager&&<aside className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-xl font-semibold">Adicionar item</h2><p className="mb-4 text-sm text-slate-600">Desative itens que não serão usados em novas remessas. Remessas anteriores mantêm seu checklist.</p>{!materials.length&&<Link href="/painel/cadastros/materiais" className="mb-4 block text-teal-800 underline">Cadastre primeiro um material.</Link>}<ChecklistForm bagId={id} requestId={crypto.randomUUID()} materials={materials}/></aside>}</div>
 </section>;
}
export default function ChecklistPage(props:Props){return <Suspense fallback={<p role="status">Carregando checklist…</p>}><ChecklistContent {...props}/></Suspense>;}
