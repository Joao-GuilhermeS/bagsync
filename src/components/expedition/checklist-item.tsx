"use client";
import {useId} from "react";
import {Icon} from "../ui/icon";
import {formatQuantity} from "@/lib/operations/validation";
import type {ChecklistDraft} from "@/lib/shipments/expedition";

export function ChecklistItem({label,unit,inputType,value,onChange,manualExpected=true}:{label:string;unit:string;inputType:"checkbox"|"text"|null;value:ChecklistDraft;onChange:(patch:Partial<ChecklistDraft>)=>void;manualExpected?:boolean}){
 const id=useId();const complete=value.mode==="complete"||(inputType==="text"&&value.mode==="partial"&&value.quantity===value.expected);
 const quantity=value.mode==="complete"?value.expected:value.quantity;
 const pending=(raw:string)=>/^\s*(?:0+(?:[.,]0+)?)?\s*$/.test(raw);
 return <article className={`border-b px-3 py-3 last:border-b-0 ${complete?"bg-emerald-50/40":"bg-white"}`}>
  <div className={`grid items-center gap-x-3 gap-y-2 ${manualExpected?"grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem] sm:grid-cols-[minmax(0,1fr)_8rem_8rem_5rem]":"grid-cols-[minmax(0,1fr)_4rem] sm:grid-cols-[minmax(0,1fr)_9rem_5rem]"}`}>
   <div className={`min-w-0 ${manualExpected?"col-span-3":"col-span-2"} sm:col-span-1`}><h3 className="break-words text-sm font-semibold">{label} <span className="font-normal text-slate-500">({unit})</span></h3>{!manualExpected&&<p className="mt-1 text-xs text-slate-500">Saldo a enviar: {formatQuantity(value.expected)} {unit}</p>}</div>
   {manualExpected&&<div><label htmlFor={`${id}-expected`} className="mb-1 block text-[11px] text-slate-500">Previsto ({unit})</label><input id={`${id}-expected`} inputMode="decimal" value={value.expected} onChange={event=>onChange({expected:event.target.value})} className="field-input min-h-11 text-sm" placeholder="Previsto"/></div>}
   <div><label htmlFor={`${id}-quantity`} className="mb-1 block text-[11px] text-slate-500">Enviar agora ({unit})</label><input id={`${id}-quantity`} inputMode="decimal" value={quantity} onChange={event=>onChange({quantity:event.target.value,mode:pending(event.target.value)?"pending":"partial"})} className="field-input min-h-11 text-sm" placeholder="0"/></div>
   <button type="button" role="checkbox" aria-label={`OK: ${label}`} aria-checked={complete} disabled={!inputType||pending(value.expected)} title={pending(value.expected)?"Sem saldo a confirmar; informe uma quantidade para envio adicional.":"Confirmar o saldo previsto"} onClick={()=>onChange(complete?{mode:"pending",quantity:""}:inputType==="checkbox"?{mode:"complete",quantity:""}:{mode:"partial",quantity:value.expected})} className={`inline-flex min-h-11 self-end items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold ${complete?"border-primary bg-primary text-white":"bg-white text-slate-500 hover:bg-mint"}`}><Icon name="check" className="size-4"/>OK</button>
  </div>
  {inputType==="text"&&<div className="mt-2"><label htmlFor={`${id}-text`} className="sr-only">Resposta livre: {label}</label><input id={`${id}-text`} value={value.text} onChange={event=>onChange({text:event.target.value})} className="field-input min-h-11 text-sm" placeholder="Resposta / anotações do item (sem efeito na quantidade)"/></div>}
  {!inputType&&<p role="alert" className="mt-2 text-xs text-amber-900">Configure o tipo deste item no modelo antes de emitir.</p>}
 </article>;
}
