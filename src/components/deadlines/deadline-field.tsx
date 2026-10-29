"use client";
import {useId,useState} from "react";
import {addDays} from "@/lib/deadlines/dates";

export function DeadlineField({value,onChange,today}:{value:string;onChange:(date:string)=>void;today:string}) {
 const id=useId();const [preset,setPreset]=useState("custom");
 return <div className="rounded-xl border bg-slate-50 p-4"><label htmlFor={`${id}-date`} className="mb-2 block text-sm font-medium">Prazo para Fabricação / Recolhimento <span className="text-red-700">*</span></label><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor={`${id}-preset`} className="sr-only">Prazo em dias corridos</label><select id={`${id}-preset`} className="field-input" value={preset} onChange={event=>{setPreset(event.target.value);if(event.target.value!=="custom")onChange(addDays(today,Number(event.target.value)));}}><option value="custom">Data personalizada</option>{[5,7,10,15].map(days=><option key={days} value={days}>{days} dias corridos</option>)}</select></div><input id={`${id}-date`} type="date" required min={today} max="9999-12-31" value={value} onChange={event=>{setPreset("custom");onChange(event.target.value);}} className="field-input"/></div><p className="mt-2 text-xs text-slate-500">Dias corridos a partir de hoje, em horário de Brasília. Complementos de material e retornos parciais preservam o prazo da remessa.</p></div>;
}
