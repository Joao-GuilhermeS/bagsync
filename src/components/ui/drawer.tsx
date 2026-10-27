"use client";
import {useId,useRef} from "react";
import type {ReactNode} from "react";
import {Icon} from "./icon";
type Props={title:string;description?:string;trigger:string;children:ReactNode;variant?:"primary"|"secondary"|"danger"};
export function FormDrawer({title,description,trigger,children,variant="primary"}:Props){
 const ref=useRef<HTMLDialogElement>(null);const id=useId();
 const open=()=>{ref.current?.showModal();ref.current?.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled)')?.focus();};
 return <><button type="button" onClick={open} className={variant==="primary"?"btn-primary":variant==="danger"?"btn-secondary text-red-800":"btn-secondary"}>{variant==="primary"&&<Icon name="plus"/>}{trigger}</button><dialog ref={ref} aria-labelledby={id} aria-describedby={description?`${id}-description`:undefined} className="dialog-panel" onClick={event=>{if(event.target===ref.current)ref.current.close();}}><div className="flex min-h-full flex-col"><header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white p-6"><div><h2 id={id} className="text-xl font-semibold">{title}</h2>{description&&<p id={`${id}-description`} className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>}</div><button type="button" onClick={()=>ref.current?.close()} aria-label="Fechar painel" className="btn-secondary size-11 shrink-0 p-0"><Icon name="close"/></button></header><div className="flex-1 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{children}</div></div></dialog></>;
}
