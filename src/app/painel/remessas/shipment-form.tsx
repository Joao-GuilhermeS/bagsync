"use client";
import Link from "next/link";
import {useActionState,useId,useRef,useState} from "react";
import {createShipment} from "./actions";
import type {TransactionState,Option} from "@/lib/operations/types";

export type TemplateItem={id:string;label:string;input_type:"checkbox"|"text"|null;material_id:string};
type Props={requestKey:string;orderId:string;workshops:Option[];items:TemplateItem[];materials:Option[];workshopId?:string};
export function ShipmentForm({requestKey,orderId,workshops,items,materials,workshopId}:Props) {
 const prefix=useId();const snapshot=useRef<FormData|null>(null);
 const [values,setValues]=useState<Record<string,string>>({workshop_id:workshopId??""});
 const initial:TransactionState={success:false,uncertain:false,message:"",warnings:[]};
 const [state,action,pending]=useActionState(async(previous:TransactionState,form:FormData)=>{
  const payload=previous.uncertain&&snapshot.current?snapshot.current:form;snapshot.current=payload;
  return createShipment(previous,payload);
 },initial);
 const input="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3";
 const value=(name:string)=>({value:values[name]??"",onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setValues(old=>({...old,[name]:event.target.value}))});
 if(state.success)return <div className="space-y-4"><p role="status" className="rounded-lg bg-teal-50 p-4">{state.message}</p><Link href={`/painel/remessas/${state.id}`} className="inline-block min-h-11 rounded-lg bg-teal-800 px-4 py-3 text-white">Consultar remessa e pendências</Link></div>;
 return <form action={action} className="space-y-5"><fieldset disabled={pending||state.uncertain} className="min-w-0 space-y-5">
  <input type="hidden" name="request_key" value={requestKey}/><input type="hidden" name="order_id" value={orderId}/>
  <div><label htmlFor={`${prefix}-workshop`} className="mb-1 block font-medium">Facção / costureiro destinatário</label><select id={`${prefix}-workshop`} name="workshop_id" required {...value("workshop_id")} className={input}><option value="" disabled>Selecione o cadastro</option>{workshops.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
  <div><label htmlFor={`${prefix}-bags`} className="mb-1 block font-medium">Quantidade de bolsas desta remessa</label><input id={`${prefix}-bags`} name="bag_quantity" required inputMode="numeric" {...value("bag_quantity")} className={input}/></div>
  <p className="text-sm text-slate-600">Informe os materiais previstos manualmente, nas respectivas unidades. Esta criação não confirma envio nem movimenta estoque.</p>
  {items.map(item=><div key={item.id} className="space-y-3 rounded-xl border bg-white p-4"><input type="hidden" name="template_item_id" value={item.id}/><h2 className="break-words font-semibold">{item.label}</h2><p className="break-words text-sm text-slate-600">{materials.find(m=>m.id===item.material_id)?.name} · {item.input_type==="checkbox"?"Caixa de marcação (✓)":"Texto livre"}</p><label htmlFor={`${prefix}-${item.id}`} className="block text-sm font-medium">Quantidade prevista deste material</label><input id={`${prefix}-${item.id}`} name="expected_quantity" required inputMode="decimal" {...value(item.id)} className={input}/></div>)}
  <div><label htmlFor={`${prefix}-note`} className="mb-1 block font-medium">Anotações gerais (opcional)</label><textarea id={`${prefix}-note`} name="note" {...value("note")} className={`${input} min-h-28 py-3`}/></div>
 </fieldset>{state.message&&<p role="alert" className="rounded-lg bg-amber-50 p-4 text-amber-950">{state.message}</p>}{state.uncertain&&<p className="text-sm">Os dados desta tentativa foram preservados. Antes de sair ou recarregar, confira a lista de remessas para evitar novo lançamento da mesma intenção.</p>}<button disabled={pending||!items.length||!workshops.length||items.some(i=>!i.input_type)} className="min-h-11 rounded-lg bg-teal-800 px-5 text-white disabled:opacity-50">{pending?"Criando…":state.uncertain?"Repetir mesma tentativa":"Criar remessa com previsões"}</button></form>;
}
