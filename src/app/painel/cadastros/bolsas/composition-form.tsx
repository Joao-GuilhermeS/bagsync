"use client";
import {PendingButton} from "@/components/ui/pending-button";
import {useActionToast} from "@/components/ui/toast";
import {useActionState,useId,useState} from "react";
import {saveComposition} from "./composition-actions";
export type MaterialOption={id:string;name:string;symbol:string};
type Props={bagId:string;materials?:MaterialOption[];item?:{material_id:string;quantity:string};remove?:boolean};
export function CompositionForm({bagId,materials=[],item,remove=false}:Props) {
 const [state,action,pending]=useActionState(saveComposition,{success:false,message:""});
 const [material,setMaterial]=useState(item?.material_id??"");const [quantity,setQuantity]=useState(item?.quantity??"");const prefix=useId();
 useActionToast(state);
 const input="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900";
 return <form action={action} className="space-y-4"><input name="bag_id" type="hidden" value={bagId}/><input name="operation" type="hidden" value={remove?"delete":item?"update":"insert"}/><fieldset disabled={pending} className="min-w-0 space-y-4">{item?<input type="hidden" name="material_id" value={item.material_id}/>:<div><label htmlFor={`${prefix}-material`} className="mb-1 block text-sm font-medium">Material</label><select id={`${prefix}-material`} name="material_id" required value={material} onChange={e=>setMaterial(e.target.value)} className={input}><option value="" disabled>Selecione</option>{materials.map(m=><option key={m.id} value={m.id}>{m.name} ({m.symbol})</option>)}</select></div>}{remove?<label className="flex items-start gap-3 text-sm"><input type="checkbox" name="confirm" value="sim" required className="size-5 shrink-0"/>Confirmo a remoção deste material da composição.</label>:<div><label htmlFor={`${prefix}-quantity`} className="mb-1 block text-sm font-medium">Quantidade para uma bolsa</label><input id={`${prefix}-quantity`} name="quantity" value={quantity} onChange={e=>setQuantity(e.target.value)} required inputMode="decimal" className={input}/><p className="mt-2 text-xs text-slate-600">Use a unidade do material, sem separador de milhares. Vírgula ou ponto são aceitos para decimais.</p></div>}</fieldset>{state.message&&<p role={state.success?undefined:"alert"} className={`rounded-lg p-3 text-sm ${state.success?"bg-teal-50 text-teal-900":"bg-amber-50 text-amber-950"}`}>{state.message}</p>}<PendingButton pending={pending} pendingLabel="Salvando…" disabled={pending||(!item&&!materials.length)} className={`min-h-11 rounded-lg px-5 font-medium text-white disabled:opacity-50 ${remove?"bg-red-800":"bg-teal-800"}`}>{remove?"Remover material":item?"Salvar quantidade":"Adicionar material"}</PendingButton></form>;
}
