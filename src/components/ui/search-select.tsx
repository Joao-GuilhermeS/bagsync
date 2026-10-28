"use client";

import {useEffect,useId,useRef,useState} from "react";
import {matchingNames} from "@/lib/catalogs/search";
import {Icon} from "../ui/icon";

export function SearchSelect({options:models,value,onChange,label,emptyLabel="Selecione",allowAll=false}:{options:{id:string;name:string}[];value:string;onChange:(id:string)=>void;label:string;emptyLabel?:string;allowAll?:boolean}) {
 const id=useId();const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const input=useRef<HTMLInputElement>(null);
 const [open,setOpen]=useState(false);const [query,setQuery]=useState("");const [cursor,setCursor]=useState(0);
 const matches=matchingNames(models,query);
 const options=allowAll&&!query.trim()?[{id:"",name:emptyLabel},...matches]:matches;
 const active=Math.min(cursor,options.length-1);
 const choose=(modelId:string)=>{onChange(modelId);setOpen(false);setQuery("");setCursor(0);trigger.current?.focus();};

 useEffect(()=>{
  if(!open)return;
  input.current?.focus();
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  document.addEventListener("pointerdown",outside);
  return ()=>document.removeEventListener("pointerdown",outside);
 },[open]);
 useEffect(()=>{
  if(open&&active>=0)document.getElementById(`${id}-option-${active}`)?.scrollIntoView({block:"nearest"});
 },[active,id,open]);

 return <div ref={root} className="relative min-w-0" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false);}}>
  <label id={`${id}-label`} className="mb-2 block text-xs font-medium text-slate-600">{label}</label>
  <button ref={trigger} type="button" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-popup`} onClick={()=>{setOpen(!open);setQuery("");setCursor(0);}} className="field-input flex items-center justify-between gap-3 text-left text-sm"><span id={`${id}-value`} className="truncate">{models.find(model=>model.id===value)?.name??emptyLabel}</span><Icon name="chevron" className="size-4 shrink-0 rotate-90 text-slate-400"/></button>
  {open&&<div id={`${id}-popup`} role="dialog" aria-label={`Selecionar ${label}`} className="absolute inset-x-0 top-full z-40 mt-2 rounded-xl border bg-white p-2 shadow-lg" onKeyDown={event=>{
   if(event.key==="Escape"){event.preventDefault();setOpen(false);trigger.current?.focus();}
  }}>
   <label htmlFor={`${id}-query`} className="sr-only">Buscar {label}</label>
   <input ref={input} id={`${id}-query`} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={active>=0?`${id}-option-${active}`:undefined} placeholder={`Buscar ${label.toLowerCase()}...`} value={query} onChange={event=>{setQuery(event.target.value);setCursor(0);}} onKeyDown={event=>{
    if(event.key==="ArrowDown"){event.preventDefault();setCursor(Math.min(active+1,options.length-1));}
    if(event.key==="ArrowUp"){event.preventDefault();setCursor(Math.max(active-1,0));}
    if(event.key==="Enter"){event.preventDefault();if(options[active])choose(options[active].id);}
   }} className="field-input mb-2 text-base sm:text-sm"/>
   <ul id={`${id}-list`} role="listbox" aria-label={`${label}: opções disponíveis`} className="max-h-56 overflow-y-auto">{options.map((model,index)=><li key={model.id} id={`${id}-option-${index}`} role="option" aria-selected={value===model.id} onMouseMove={()=>setCursor(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(model.id)} className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${active===index?"bg-mint text-forest":"text-slate-600"}`}><span className="break-words">{model.name}</span>{value===model.id&&<Icon name="check" className="size-4 shrink-0"/>}</li>)}</ul>
   {!options.length&&<p className="p-3 text-sm text-slate-500" role="status">Nenhum resultado encontrado.</p>}
  </div>}
 </div>;
}
