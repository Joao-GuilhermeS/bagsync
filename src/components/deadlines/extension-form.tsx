"use client";
import {useActionState,useId,useRef,useState} from "react";
import {extendDeadline} from "@/app/painel/prazos/actions";
import type {TransactionState} from "@/lib/operations/types";
import {PendingButton} from "../ui/pending-button";
import {addDays} from "@/lib/deadlines/dates";
type Props={kitId:string;due:string|null;today:string;requestKey:string};
export function ExtensionForm(props:Props){
 const [key,setKey]=useState(props.requestKey);
 return <ExtensionFields key={key} {...props} requestKey={key} onNew={()=>setKey(crypto.randomUUID())}/>;
}
function ExtensionFields({kitId,due,today,requestKey,onNew}:Props&{onNew:()=>void}){
 const id=useId(),payload=useRef<FormData|null>(null);
 const [state,action,pending]=useActionState(async(previous:TransactionState,form:FormData)=>{const body=previous.uncertain&&payload.current?payload.current:form;payload.current=body;return extendDeadline(previous,body);},{success:false,uncertain:false,message:"",warnings:[]} as TransactionState);
 if(state.success)return <div className="space-y-4"><p role="status" className="rounded-lg bg-mint p-4 text-sm text-olive">{state.message}</p><button type="button" onClick={onNew} className="btn-secondary">Nova prorrogação</button></div>;
 const minimum=due&&due>=today?addDays(due,1):today;
 return <form action={action} className="space-y-4"><fieldset disabled={pending||state.uncertain} className="space-y-4"><input type="hidden" name="request_key" value={requestKey}/><input type="hidden" name="kit_id" value={kitId}/><input type="hidden" name="expected_due_on" value={due??""}/><div><label htmlFor={`${id}-date`} className="mb-2 block text-sm font-medium">Nova data limite</label><input id={`${id}-date`} type="date" name="due_on" required min={minimum} max="9999-12-31" className="field-input"/></div><div><label htmlFor={`${id}-reason`} className="mb-2 block text-sm font-medium">Justificativa obrigatória</label><textarea id={`${id}-reason`} name="reason" required maxLength={2000} rows={4} className="field-input py-3"/></div></fieldset>{state.message&&<p role="alert" className="text-sm text-amber-900">{state.message}</p>}{state.uncertain&&<p className="text-xs text-slate-500">Tentativa preservada em memória. Consulte o histórico antes de recarregar.</p>}<PendingButton pending={pending}>{state.uncertain?"Repetir mesma tentativa":"Salvar novo prazo"}</PendingButton></form>;
}
