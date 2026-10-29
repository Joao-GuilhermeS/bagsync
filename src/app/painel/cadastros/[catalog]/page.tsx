import {PageSkeleton} from "@/components/ui/skeleton";
import {FormDrawer} from "@/components/ui/drawer";
import {PageHeader} from "@/components/ui/page-header";
import {Badge} from "@/components/ui/badge";
import {Icon} from "@/components/ui/icon";
import {Pagination} from "@/app/painel/operacoes/pagination";
import {formatQuantity} from "@/lib/operations/validation";
import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {requireAccess} from "@/lib/auth/context";
import {createClient} from "@/lib/supabase/server";
import {catalogs,isCatalog,pageNumber} from "@/lib/catalogs/validation";
import {CatalogForm,type CatalogRecord,type UnitOption} from "../catalog-form";
type Props={params:Promise<{catalog:string}>;searchParams:Promise<{pagina?:string}>};
async function CatalogContent({params,searchParams}:Props) {
 const {catalog}=await params;
 if(!isCatalog(catalog)) notFound();
 const access=await requireAccess();
 if(!access) return null;
 const page=pageNumber((await searchParams).pagina);
 const client=await createClient();
 const config=catalogs[catalog];
 const {data,error,count}=await client.from(config.table).select("*",{count:"exact"}).eq("company_id",access.companyId).order("created_at",{ascending:false}).order("id").range((page-1)*25,page*25-1);
 let units:UnitOption[]=[];
 if(catalog==="materiais") {
  // Buscar todos os lotes evita truncar silenciosamente as opções do seletor.
  for(let offset=0;;offset+=500) {
   const result=await client.from("measurement_units").select("id,name,symbol").eq("company_id",access.companyId).order("id").range(offset,offset+499);
   if(result.error) throw new Error("Não foi possível carregar as unidades.");
   units.push(...result.data);
   if(result.data.length<500) break;
  }
  units=units.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
 }
 if(error) throw new Error("Não foi possível carregar o cadastro.");
 const records=(data??[]) as CatalogRecord[];
 const manager=access.role==="gerente_logistico";
 const balances=new Map<string,string>();
 if(catalog==="materiais"&&records.length){
  const stock=await client.from("material_stock_balances").select("material_id,balance::text").eq("company_id",access.companyId).in("material_id",records.map(r=>r.id));
  if(stock.error)throw new Error("Não foi possível consultar os saldos.");
  for(const row of stock.data as unknown as {material_id:string;balance:string}[])balances.set(row.material_id,row.balance);
 }
 const descriptions={faccoes:"Organize quem recebe materiais e entrega as bolsas prontas.",materiais:"Materiais, unidades e saldos para abastecer a produção.",bolsas:"Modelos, ficha técnica e checklist de saída em um só lugar."};
 return <section><PageHeader eyebrow="Cadastros" title={config.title} description={descriptions[catalog]} actions={manager&&<FormDrawer trigger={`Adicionar ${config.singular}`} title={`Cadastrar ${config.singular}`} description="Preencha os dados e confirme o cadastro.">{catalog==="materiais"&&!units.length&&<p className="mb-4 text-sm text-amber-900">As unidades predefinidas não estão disponíveis. Solicite a revisão da configuração.</p>}<CatalogForm catalog={catalog} units={units}/></FormDrawer>}/><div className="mb-4 flex flex-wrap items-center gap-3"><Badge>{count??0} registro(s)</Badge>{!manager&&<span className="text-sm text-slate-500">Consulta disponível para seu perfil.</span>}</div><div className="surface overflow-hidden"><table className="block w-full text-left md:table"><thead className="hidden bg-forest text-white md:table-header-group"><tr><th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Cadastro</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Detalhes</th><th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Ações</th></tr></thead><tbody className="block divide-y md:table-row-group">{records.map(record=><tr key={record.id} className="block p-5 md:table-row md:p-0"><td className="break-words md:px-6 md:py-5"><span className="font-semibold">{record.name}</span></td><td className="mt-2 block text-sm text-slate-500 md:table-cell md:px-6 md:py-5">{record.unit_id&&<><p>{units.find(u=>u.id===record.unit_id)?.name??"Unidade cadastrada"}</p><p className="mt-1 font-medium tabular-nums text-forest">Saldo: {balances.has(record.id)?formatQuantity(balances.get(record.id)!):"—"} {units.find(u=>u.id===record.unit_id)?.symbol}</p></>}{catalog==="faccoes"&&<div className="space-y-1"><p>{record.phone||"Telefone não informado"}</p><p className="whitespace-pre-wrap break-words">{[record.street,record.address_number,record.address_complement,record.neighborhood,[record.city,record.state].filter(Boolean).join(" / "),record.postal_code].filter(Boolean).join(", ")||"Endereço não informado"}</p>{record.document_number&&<p>Documento: {record.document_number}</p>}</div>}{catalog==="bolsas"&&"Modelo de produção"}</td><td className="mt-4 block md:table-cell md:px-6 md:py-4"><div className="flex flex-wrap gap-2 md:justify-end">{catalog==="bolsas"&&<><Link href={`/painel/cadastros/bolsas/${record.id}/composicao`} className="btn-secondary"><Icon name="layers" className="size-4"/>Ficha técnica</Link><Link href={`/painel/cadastros/bolsas/${record.id}/checklist`} className="btn-secondary"><Icon name="orders" className="size-4"/>Checklist</Link></>}{manager&&<><FormDrawer title={`Editar ${record.name}`} trigger="Editar" variant="secondary"><CatalogForm catalog={catalog} record={record} units={units}/></FormDrawer><FormDrawer title={`Excluir ${record.name}`} description="A exclusão exige confirmação e pode ser impedida quando o cadastro estiver em uso." trigger="Excluir" variant="danger"><CatalogForm catalog={catalog} record={record} remove/></FormDrawer></>}</div></td></tr>)}</tbody></table>{!records.length&&<div className="px-6 py-14 text-center"><Icon name={catalog==="faccoes"?"users":catalog==="bolsas"?"bag":"layers"} className="mx-auto mb-4 size-9 text-olive"/><h2 className="font-semibold">Nenhum registro nesta página</h2><p className="mt-2 text-sm text-slate-500">{manager?"Use o botão Adicionar para iniciar este cadastro.":"Os registros aparecerão após o cadastro pelo Gerente Logístico."}</p></div>}</div><Pagination page={page} count={count??0}/></section>;

}
export default function CatalogPage(props:Props) {return <Suspense fallback={<PageSkeleton label="Carregando cadastro…" variant="table"/>}><CatalogContent {...props}/></Suspense>;}
