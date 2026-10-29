"use client";
import {PendingButton} from "@/components/ui/pending-button";
import {useActionToast} from "@/components/ui/toast";
import {useActionState,useId,useRef,useState} from "react";
import {saveProductionNote} from "./actions";
import type {TransactionState} from "@/lib/operations/types";
type Props={order:string;workshop:string;onSaved:()=>void};
export function ProductionNoteForm(props:Props){
 const [key,setKey]=useState(()=>crypto.randomUUID());
 return <NoteFields key={key} {...props} requestKey={key} onNew={()=>setKey(crypto.randomUUID())}/>;
}
function NoteFields({order,workshop,onSaved,requestKey,onNew}:Props&{requestKey:string;onNew:()=>void}) {
 const id=useId();const snapshot=useRef<FormData|null>(null);const [note,setNote]=useState("");
 const initial:TransactionState={success:false,uncertain:false,message:"",warnings:[]};
 const [state,action,pending]=useActionState(async(previous:TransactionState,form:FormData)=>{
  const body=previous.uncertain&&snapshot.current?snapshot.current:form;snapshot.current=body;
  const result=await saveProductionNote(previous,body);if(result.success)onSaved();return result;
 },initial);
 useActionToast(state);
 if(state.success)return <div className="mt-4 space-y-3 rounded-lg bg-teal-50 p-4"><p>{state.message}</p><button type="button" onClick={onNew} className="min-h-11 rounded-lg border bg-white px-4">Nova observação</button></div>;
 return <form action={action} className="mt-5 space-y-3 border-t pt-4"><fieldset disabled={pending||state.uncertain} className="min-w-0 space-y-3"><input type="hidden" name="request_key" value={requestKey}/><input type="hidden" name="order_id" value={order}/><input type="hidden" name="workshop_id" value={workshop}/><label htmlFor={id} className="block font-medium">Registrar observação da produção</label><textarea id={id} name="note" required value={note} onChange={e=>setNote(e.target.value)} className="min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3"/><p className="text-sm text-slate-600">O texto será acrescentado ao histórico. Para corrigir uma informação, registre uma nova observação.</p></fieldset>{state.message&&<p role="alert" className="rounded-lg bg-amber-50 p-3">{state.message}</p>}{state.uncertain&&<p className="text-sm">Chave e texto preservados para repetir a mesma tentativa. Antes de recarregar ou registrar outra nota, confira o histórico.</p>}<PendingButton pending={pending} pendingLabel="Registrando…" disabled={pending} className="min-h-11 rounded-lg bg-teal-800 px-4 text-white disabled:opacity-50">{state.uncertain?"Repetir mesma tentativa":"Registrar observação"}</PendingButton></form>;
}
