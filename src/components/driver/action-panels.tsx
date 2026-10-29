"use client";
import {useId,useState} from "react";
import type {ReactNode} from "react";
import {Icon} from "../ui/icon";
export function FieldActionPanels({delivery,collection,initialAction="delivery"}:{delivery:ReactNode;collection:ReactNode;initialAction?:"delivery"|"collection"}){
 const [action,setAction]=useState<"delivery"|"collection">(initialAction);const id=useId();
 return <section className="surface overflow-hidden"><header className="border-b p-5"><h2 className="font-semibold">O que você vai fazer?</h2><p className="mt-1 text-sm text-slate-500">Escolha a ação para esta facção e pedido.</p><div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Ação na facção">{(["delivery","collection"] as const).map(value=><button key={value} type="button" aria-pressed={action===value} aria-controls={`${id}-${value}`} onClick={()=>setAction(value)} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${action===value?"border-forest bg-forest text-white":"bg-white text-slate-600 hover:bg-mint"}`}><Icon name={value==="delivery"?"box":"bag"}/>{value==="delivery"?"Entregar materiais":"Recolher bolsas"}</button>)}</div></header><div id={`${id}-delivery`} hidden={action!=="delivery"} className="p-5">{delivery}</div><div id={`${id}-collection`} hidden={action!=="collection"} className="p-5">{collection}</div></section>;
}
