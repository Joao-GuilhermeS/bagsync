"use client";
import {useActionState,useId,useRef} from "react";
import {useActionToast} from "@/components/ui/toast";
import type {TransactionState} from "@/lib/operations/types";
import {confirmDelivery} from "./actions";
export function DeliveryConfirmationForm({submissionId,requestKey}:{submissionId:string;requestKey:string}) {
 const id=useId();const snapshot=useRef<FormData|null>(null);
 const [state,action,pending]=useActionState(async(previous:TransactionState,form:FormData)=>{
  const body=previous.uncertain&&snapshot.current?snapshot.current:form;snapshot.current=body;
  return confirmDelivery(previous,body);
 },{success:false,uncertain:false,message:"",warnings:[]});
 useActionToast(state);
 return <form action={action} className="space-y-4"><fieldset disabled={pending||state.uncertain||state.success} className="space-y-4"><input type="hidden" name="request_key" value={requestKey}/><input type="hidden" name="submission_id" value={submissionId}/><p className="text-sm text-slate-600">Confirme depois que os materiais deste romaneio forem recebidos pela facção. O estoque já foi baixado na Expedição.</p><label htmlFor={id} className="block font-medium">Anotações da entrega</label><textarea id={id} name="note" maxLength={2000} className="field-input min-h-28 py-3"/></fieldset>{state.message&&<p role={state.success?undefined:"alert"} className="rounded-lg bg-mint p-3 text-sm">{state.message}</p>}{state.uncertain&&<p className="text-sm">Os dados desta tentativa estão preservados. Confira a consulta antes de recarregar.</p>}<button className="btn-primary" disabled={pending||state.success}>{pending?"Confirmando…":state.uncertain?"Repetir mesma tentativa":"Confirmar entrega na facção"}</button></form>;
}
