"use client";
import {useActionToast} from "@/components/ui/toast";
import Link from "next/link";
import {useActionState,useId,useRef,useState} from "react";
import {submitChecklist} from "./actions";
import {formatQuantity} from "@/lib/operations/validation";
import type {ShipmentAnswerItem} from "@/lib/checklists/submission-data";
import type {TransactionState} from "@/lib/operations/types";
type Props={kitId:string;requestKey:string;items:ShipmentAnswerItem[]};
export function ShipmentChecklistForm(props:Props){
 const [key,setKey]=useState(props.requestKey);
 return <ChecklistFields key={key} {...props} requestKey={key} onNew={()=>setKey(crypto.randomUUID())}/>;
}
function ChecklistFields({kitId,requestKey,items,onNew}:Props&{onNew:()=>void}) {
 const prefix=useId();const snapshot=useRef<FormData|null>(null);
 const [values,setValues]=useState<Record<string,{mode:string;quantity:string;text:string}>>({});const [note,setNote]=useState("");
 const initial:TransactionState={success:false,uncertain:false,message:"",warnings:[]};
 const [state,action,pending]=useActionState(async(previous:TransactionState,form:FormData)=>{
  const body=previous.uncertain&&snapshot.current?snapshot.current:form;snapshot.current=body;return submitChecklist(previous,body);
 },initial);
 useActionToast(state);
 const input="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3";
 const edit=(id:string,patch:Partial<{mode:string;quantity:string;text:string}>)=>setValues(old=>({...old,[id]:{...(old[id]??{mode:"pending",quantity:"",text:""}),...patch}}));
 if(state.success)return <div className="space-y-4 rounded-xl border bg-white p-5"><p>{state.message}</p>{state.warnings.map((warning,index)=><p key={index} role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-950">{warning}</p>)}<Link target="_blank" rel="noreferrer" href={`/painel/expedicao/${kitId}/preenchimentos/${state.id}/pdf`} className="inline-block min-h-11 rounded-lg bg-teal-800 px-4 py-3 text-white">Abrir PDF / imprimir</Link><Link href="/painel/entregas" className="btn-secondary">Consultar materiais a entregar</Link><p className="text-sm text-slate-600">No visualizador PDF, escolha Imprimir para selecionar a impressora.</p><button type="button" onClick={onNew} className="min-h-11 rounded-lg border px-4">Novo preenchimento / complemento</button></div>;
 return <form action={action} className="space-y-4"><fieldset disabled={pending||state.uncertain} className="min-w-0 space-y-4"><input name="request_key" type="hidden" value={requestKey}/><input name="kit_id" type="hidden" value={kitId}/><p className="text-sm text-slate-600">As quantidades são adicionais desta saída. Marcar ✓ envia o saldo restante do item. Não enviado permanece pendente; textos não alteram o estoque.</p>{items.map(item=>{
  const value=values[item.id]??{mode:"pending",quantity:"",text:""};
  return <section key={item.id} className="space-y-3 rounded-xl border bg-white p-4"><h3 className="break-words font-semibold">{item.label}</h3><p className="text-sm text-slate-600">Saldo a enviar: {formatQuantity(item.remaining_quantity)} {item.unit_symbol}</p><input name="kit_item_id" type="hidden" value={item.id}/><input name="mode" type="hidden" value={value.mode}/>{item.input_type==="checkbox"?<><input name="response_text" type="hidden" value=""/>{value.mode!=="partial"&&<label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={value.mode==="complete"} onChange={event=>edit(item.id,{mode:event.target.checked?"complete":"pending"})} className="size-5"/>✓ Conferir e enviar todo o saldo restante</label>}<button type="button" className="min-h-11 text-sm text-teal-800 underline" onClick={()=>edit(item.id,{mode:value.mode==="partial"?"pending":"partial"})}>{value.mode==="partial"?"Voltar à caixa de marcação":"Informar envio parcial"}</button></>:<><label htmlFor={`${prefix}-${item.id}-text`} className="block text-sm font-medium">Resposta livre</label><textarea id={`${prefix}-${item.id}-text`} name="response_text" value={value.text} onChange={e=>edit(item.id,{text:e.target.value})} className={`${input} min-h-24 py-3`}/><label htmlFor={`${prefix}-${item.id}-mode`} className="block text-sm font-medium">Envio nesta saída</label><select id={`${prefix}-${item.id}-mode`} value={value.mode} onChange={e=>edit(item.id,{mode:e.target.value})} className={input}><option value="pending">Não enviado</option><option value="partial">Informar quantidade enviada</option></select></>}{value.mode==="partial"?<><label htmlFor={`${prefix}-${item.id}-quantity`} className="block text-sm font-medium">Quantidade enviada ({item.unit_symbol})</label><input id={`${prefix}-${item.id}-quantity`} name="quantity" inputMode="decimal" required value={value.quantity} onChange={e=>edit(item.id,{quantity:e.target.value})} className={input}/></>:<input type="hidden" name="quantity" value="0"/>}</section>;
 })}<label htmlFor={`${prefix}-note`} className="block font-medium">Anotações desta saída</label><textarea id={`${prefix}-note`} name="note" value={note} onChange={e=>setNote(e.target.value)} className={`${input} min-h-28 py-3`}/></fieldset>{state.message&&<p role="alert" className="rounded-lg bg-amber-50 p-4">{state.message}</p>}{state.uncertain&&<p className="text-sm">Dados preservados para repetir a mesma tentativa. Antes de sair ou recarregar, confira o histórico.</p>}<button disabled={pending||!items.length||items.some(i=>!i.input_type)} className="min-h-11 rounded-lg bg-teal-800 px-5 text-white disabled:opacity-50">{pending?"Registrando…":state.uncertain?"Repetir mesma tentativa":"Emitir romaneio e concluir Expedição"}</button></form>;
}
