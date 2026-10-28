"use client";
import {useActionState,useId,useRef} from "react";
import {useActionToast} from "@/components/ui/toast";
import type {TransactionState} from "@/lib/operations/types";
import {confirmDelivery} from "./actions";
export function DeliveryConfirmationForm({submissionId,requestKey,compact=false}:{submissionId:string;requestKey:string;compact?:boolean}) {
 const id=useId();const snapshot=useRef<FormData|null>(null);
 const [state,action,pending]=useActionState(async(previous:TransactionState,form:FormData)=>{
  const body=previous.uncertain&&snapshot.current?snapshot.current:form;snapshot.current=body;return confirmDelivery(previous,body);
 },{success:false,uncertain:false,message:"",warnings:[]});
 useActionToast(state);
 return <form action={action} className="space-y-3"><fieldset disabled={pending||state.uncertain||state.success} className="space-y-3"><input type="hidden" name="request_key" value={requestKey}/><input type="hidden" name="submission_id" value={submissionId}/>{compact?<details><summary className="min-h-11 py-3 text-xs font-medium text-olive">Adicionar observação à entrega</summary><label htmlFor={id} className="sr-only">Anotações da entrega</label><textarea id={id} name="note" maxLength={2000} className="field-input min-h-24 py-3"/></details>:<><p className="text-sm text-slate-600">Confirme depois que os materiais forem recebidos pela facção. O estoque já foi baixado na Expedição.</p><label htmlFor={id} className="block font-medium">Anotações da entrega</label><textarea id={id} name="note" maxLength={2000} className="field-input min-h-28 py-3"/></>}</fieldset>{state.message&&<p role={state.success?undefined:"alert"} className="rounded-lg bg-mint p-3 text-sm">{state.message}</p>}{state.uncertain&&<p className="text-xs text-slate-500">Dados preservados para repetir a mesma confirmação. Confira a consulta antes de sair ou recarregar.</p>}<button className={`btn-primary ${compact?"w-full":""}`} disabled={pending||state.success}>{pending?"Confirmando…":state.uncertain?"Repetir mesma tentativa":"Marcar como Entregue"}</button>{compact&&<p className="text-center text-[11px] text-slate-400">Confirma o recebimento sem nova baixa de estoque.</p>}</form>;
}
