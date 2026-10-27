"use client";
import {useActionToast} from "@/components/ui/toast";
import {useActionState,useId} from "react";
import {saveChecklist} from "./checklist-actions";
export type ChecklistItem={id:string;material_id:string;label:string;position:number;active:boolean;input_type:"checkbox"|"text"|null};
type Props={bagId:string;requestId:string;materials:{id:string;name:string}[];item?:ChecklistItem};
export function ChecklistForm({bagId,requestId,materials,item}:Props) {
 const [state,action,pending]=useActionState(saveChecklist,{success:false,message:""});
 const prefix=useId();
 useActionToast(state);
 const input="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3";
 return <form action={action} className="space-y-4">
  <input type="hidden" name="operation" value={item?"update":"insert"}/><input type="hidden" name="bag_id" value={bagId}/><input type="hidden" name="id" value={item?.id??requestId}/>
  <fieldset disabled={pending||(!item&&state.success)} className="min-w-0 space-y-4">
   <div><label htmlFor={`${prefix}-material`} className="mb-1 block text-sm font-medium">Material do estoque</label><select id={`${prefix}-material`} name="material_id" required defaultValue={item?.material_id??""} className={input}><option value="" disabled>Selecione</option>{materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div><label htmlFor={`${prefix}-label`} className="mb-1 block text-sm font-medium">Nome no checklist</label><input id={`${prefix}-label`} name="label" required defaultValue={item?.label??""} className={input}/></div>
   <div><label htmlFor={`${prefix}-position`} className="mb-1 block text-sm font-medium">Posição de exibição</label><input id={`${prefix}-position`} name="position" type="number" min="0" max="2147483647" step="1" required defaultValue={item?.position??0} className={input}/></div>
   <div><label htmlFor={`${prefix}-type`} className="mb-1 block text-sm font-medium">Como este item será preenchido na saída?</label><select id={`${prefix}-type`} name="input_type" required defaultValue={item?.input_type??""} className={input}><option value="" disabled>Escolha o tipo de resposta</option><option value="checkbox">Caixa de marcação (✓)</option><option value="text">Texto livre</option></select><p className="mt-2 text-sm text-slate-600">Texto livre terá quantidade numérica separada para estoque. A marcação confirma a quantidade prevista; envios parciais continuam permitidos.</p></div>
   <label className="flex min-h-11 items-center gap-3"><input name="active" type="checkbox" value="sim" defaultChecked={item?.active??true} className="size-5"/>Ativo para novas remessas</label>
  </fieldset>
  {state.message&&<p role={state.success?undefined:"alert"} className="rounded-lg bg-slate-100 p-3 text-sm">{state.message}</p>}
  {!item&&state.success?<button type="button" onClick={()=>window.location.reload()} className="min-h-11 rounded-lg bg-teal-800 px-4 text-white">Adicionar outro item</button>:<button disabled={pending||!materials.length} className="min-h-11 rounded-lg bg-teal-800 px-4 text-white disabled:opacity-50">{pending?"Salvando…":item?"Salvar item":"Adicionar ao checklist"}</button>}
 </form>;
}
