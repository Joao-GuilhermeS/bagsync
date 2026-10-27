"use client";
import {useActionToast} from "@/components/ui/toast";
import {useActionState, useId} from "react";
import {saveCatalog} from "./actions";
import type {Catalog} from "@/lib/catalogs/validation";
export type CatalogRecord = {id:string;name:string;symbol?:string;unit_id?:string};
export type UnitOption = {id:string;name:string;symbol:string};
export function CatalogForm({catalog,record,units=[],remove=false}: {catalog:Catalog;record?:CatalogRecord;units?:UnitOption[];remove?:boolean}) {
 const [state,action,pending]=useActionState(saveCatalog,{message:"",success:false});
 const prefix=useId();
 useActionToast(state);
 const input="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-2 focus:outline-teal-700";
 return <form action={action} className="space-y-4">
  <input type="hidden" name="catalog" value={catalog}/>
  {record && <input type="hidden" name="id" value={record.id}/>}
  {remove ? <><input type="hidden" name="operation" value="delete"/><label className="flex items-center gap-3"><input name="confirm" value="sim" type="checkbox" required className="size-5"/>Confirmo a exclusão de {record?.name}.</label></> : <>
   <div><label htmlFor={`${prefix}-name`} className="mb-1 block text-sm font-medium">Nome</label><input id={`${prefix}-name`} name="name" required defaultValue={record?.name} className={input}/></div>
   {catalog==="unidades" && <div><label htmlFor={`${prefix}-symbol`} className="mb-1 block text-sm font-medium">Símbolo (ex.: m, un, kg)</label><input id={`${prefix}-symbol`} name="symbol" required defaultValue={record?.symbol} className={input}/></div>}
   {catalog==="materiais" && <div><label htmlFor={`${prefix}-unit`} className="mb-1 block text-sm font-medium">Unidade de medida</label><select id={`${prefix}-unit`} name="unit_id" required defaultValue={record?.unit_id??""} className={input}><option value="" disabled>Selecione uma unidade</option>{units.map(u=><option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}</select></div>}
  </>}
  {state.message && <p role={state.success?undefined:"alert"} className={`rounded-lg p-3 text-sm ${state.success?"bg-teal-50 text-teal-900":"bg-red-50 text-red-900"}`}>{state.message}</p>}
  <button disabled={pending || (!remove && catalog==="materiais" && !units.length)} className={`min-h-11 rounded-lg px-5 font-medium text-white disabled:opacity-50 ${remove?"bg-red-800":"bg-teal-800"}`}>{pending?"Aguarde…":remove?"Excluir registro":record?"Salvar alterações":"Cadastrar"}</button>
 </form>;
}
