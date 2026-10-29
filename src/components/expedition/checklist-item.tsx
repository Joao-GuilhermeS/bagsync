"use client";
import {useId} from "react";
import {Icon} from "../ui/icon";
import {Badge} from "../ui/badge";
import {formatQuantity} from "@/lib/operations/validation";
import type {ChecklistDraft} from "@/lib/shipments/expedition";

export function ChecklistItem({label,unit,inputType,value,onChange,manualExpected=true}:{label:string;unit:string;inputType:"checkbox"|"text"|null;value:ChecklistDraft;onChange:(patch:Partial<ChecklistDraft>)=>void;manualExpected?:boolean}){
 const id=useId();const complete=value.mode==="complete";
 return <article className={`rounded-xl border bg-white p-4 transition-colors sm:p-5 ${complete?"border-olive/40 bg-mint/20":""}`}>
  <div className="mb-4 flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words font-semibold text-forest">{label}</h3><Badge tone={value.mode==="pending"?"pending":"success"}>{complete?"OK":value.mode==="partial"?"Envio informado":"Pendente"}</Badge></div>
  <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><div>{manualExpected?<><label htmlFor={`${id}-expected`} className="mb-2 block text-xs font-medium text-slate-600">Quantidade prevista ({unit})</label><input id={`${id}-expected`} inputMode="decimal" value={value.expected} onChange={event=>onChange({expected:event.target.value})} className="field-input" placeholder="Informe o previsto"/></>:<><p className="text-xs text-slate-500">Saldo a enviar</p><p className="mt-2 text-xl font-semibold tabular-nums">{formatQuantity(value.expected)} {unit}</p></>}</div>
   <div className="min-w-0 space-y-3">{inputType==="checkbox"?<><button type="button" role="checkbox" aria-checked={complete} onClick={()=>onChange({mode:complete?"pending":"complete"})} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium ${complete?"border-primary bg-primary text-white":"hover:border-olive bg-slate-50 text-slate-600"}`}><span className={`grid size-6 shrink-0 place-items-center rounded border ${complete?"border-white/30 bg-white/15":"border-slate-300 bg-white"}`}>{complete&&<Icon name="check" className="size-4"/>}</span>{complete?"OK · enviar toda a quantidade":"Marcar como OK"}</button><button type="button" onClick={()=>onChange({mode:value.mode==="partial"?"pending":"partial"})} className="min-h-11 text-xs font-medium text-olive underline underline-offset-4">{value.mode==="partial"?"Voltar à conferência":"Informar quantidade parcial"}</button></>:<><label htmlFor={`${id}-text`} className="block text-xs font-medium text-slate-600">Resposta / observações do item</label><textarea id={`${id}-text`} rows={2} value={value.text} onChange={event=>onChange({text:event.target.value})} className="field-input py-3" placeholder="Digite a resposta livre..."/></>}
   {(inputType==="text"||value.mode==="partial")&&<div><label htmlFor={`${id}-quantity`} className="mb-2 block text-xs font-medium text-slate-600">Quantidade a enviar ({unit})</label><input id={`${id}-quantity`} inputMode="decimal" value={value.quantity} onChange={event=>onChange({quantity:event.target.value,...(inputType==="text"?{mode:event.target.value.trim()?"partial" as const:"pending" as const}:{})})} className="field-input" placeholder="Não enviado se vazio"/>{inputType==="text"&&<p className="mt-2 text-xs text-slate-500">O texto é livre; a baixa usa somente esta quantidade.</p>}</div>}
   {!inputType&&<p role="alert" className="text-sm text-amber-900">Configure o tipo deste item no modelo antes de emitir.</p>}
   </div>
  </div>
 </article>;
}
