"use client";
import {PendingButton} from "@/components/ui/pending-button";
import {useActionToast} from "@/components/ui/toast";
import Link from "next/link";
import {useActionState,useId,useRef,useState} from "react";
import {submitTransaction} from "./actions";
import {operationLabels,type OperationKind} from "@/lib/operations/validation";
import type {OperationOptions,Option,TransactionState} from "@/lib/operations/types";
type Props={task:"order"|"operation";requestKey:string;options:OperationOptions;kinds?:OperationKind[];orderId?:string;workshopId?:string;reversalOf?:string;materialId?:string;kits?:Option[];kitId?:string};
export function TransactionForm(props:Props) {
 const [key,setKey]=useState(props.requestKey);
 return <TransactionFields key={key} {...props} requestKey={key} onNew={()=>setKey(crypto.randomUUID())}/>;
}
function TransactionFields({task,requestKey,options,kinds=["material_delivery","bag_receipt"],orderId,workshopId,reversalOf,materialId,kits=[],kitId,onNew}:Props&{onNew:()=>void}) {
 const prefix=useId();const snapshot=useRef<FormData|null>(null);
 const [kind,setKind]=useState<OperationKind>(kinds[0]);
 const [values,setValues]=useState<Record<string,string>>({order_id:orderId??"",workshop_id:workshopId??"",kit_id:kitId??""});
 const [items,setItems]=useState([{key:0,material_id:materialId??"",quantity:""}]);const nextRow=useRef(1);
 const initial:TransactionState={message:"",success:false,uncertain:false,warnings:[]};
 const [state,action,pending]=useActionState(async(previous:TransactionState,form:FormData)=>{
  const payload=previous.uncertain&&snapshot.current?snapshot.current:form;snapshot.current=payload;
  return submitTransaction(previous,payload);
 },initial);
 useActionToast(state);
 const input="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 disabled:bg-slate-100";
 const field=(name:string,label:string,inputMode?:"numeric"|"decimal")=><div><label htmlFor={`${prefix}-${name}`} className="mb-1 block text-sm font-medium">{label}</label><input id={`${prefix}-${name}`} name={name} value={values[name]??""} onChange={e=>setValues({...values,[name]:e.target.value})} required inputMode={inputMode} className={input}/></div>;
 const select=(name:string,label:string,opts:Option[])=><div><label htmlFor={`${prefix}-${name}`} className="mb-1 block text-sm font-medium">{label}</label><select id={`${prefix}-${name}`} name={name} value={values[name]??""} onChange={e=>setValues({...values,[name]:e.target.value})} required className={input}><option value="" disabled>Selecione</option>{opts.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>{!opts.length&&<p className="mt-1 text-sm text-amber-900">Nenhum registro disponível. Confira os cadastros.</p>}</div>;
 if(state.success)return <div className="space-y-4"><p className="rounded-lg bg-teal-50 p-3 text-teal-900">{state.message}</p>{state.warnings.length>0&&<div role="alert" className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-amber-950"><h3 className="font-semibold">Atenção ao lançamento</h3><ul className="mt-2 list-inside list-disc space-y-2">{state.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></div>}<p className="break-all text-xs text-slate-600">Referência: {state.id}</p>{task==="order"&&<Link className="block font-medium text-teal-800 underline" href={`/painel/pedidos/${state.id}`}>Abrir pedido</Link>}{kind!=="reversal"&&<button type="button" onClick={onNew} className="min-h-11 rounded-lg border bg-white px-4">{task==="order"?"Criar outro pedido":"Novo lançamento"}</button>}</div>;
 const reversal=task==="operation"&&kind==="reversal";
 const materials=task==="operation"&&(kind==="material_entry"||kind==="material_delivery");
 return <form action={action} className="space-y-4">
  <fieldset disabled={pending||state.uncertain} className="min-w-0 space-y-4">
   <input type="hidden" name="task" value={task}/><input type="hidden" name="request_key" value={requestKey}/>
   {task==="order"?<>{field("name","Nome do pedido")}{select("bag_id","Modelo de bolsa",options.bags)}{field("expected_quantity","Quantidade prevista de bolsas","numeric")}</>:<>
    {kinds.length===1?<input type="hidden" name="kind" value={kind}/>:<div><label htmlFor={`${prefix}-kind`} className="mb-1 block text-sm font-medium">Tipo de lançamento</label><select id={`${prefix}-kind`} name="kind" value={kind} onChange={e=>setKind(e.target.value as OperationKind)} className={input}>{kinds.map(k=><option key={k} value={k}>{operationLabels[k]}</option>)}</select></div>}
    {reversal?<><input type="hidden" name="reversal_of" value={reversalOf}/><label className="flex gap-3 text-sm"><input type="checkbox" name="confirm" value="sim" required className="size-5 shrink-0"/>Confirmo o estorno integral desta operação. O original será preservado.</label></>:<>
     {kind!=="material_entry"&&<>{orderId?<input type="hidden" name="order_id" value={orderId}/>:select("order_id","Pedido",options.orders)}{select("workshop_id","Facção / costureira",options.workshops)}</>}
     {kind==="bag_receipt"&&<>{select("kit_id","Remessa para recolhimento",kits)}{field("quantity","Bolsas recolhidas","numeric")}</>}
     {materials&&<div className="space-y-4"><p className="text-sm text-slate-600">Quantidades na unidade do material. Use vírgula ou ponto para decimais, sem separador de milhares.</p>{items.map((item,i)=><div key={item.key} className="space-y-3 rounded-lg border p-3"><div><label htmlFor={`${prefix}-material-${item.key}`} className="mb-1 block text-sm font-medium">Material {i+1}</label><select id={`${prefix}-material-${item.key}`} name="material_id" value={item.material_id} required onChange={e=>setItems(items.map((r,j)=>j===i?{...r,material_id:e.target.value}:r))} className={input}><option value="" disabled>Selecione</option>{options.materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label htmlFor={`${prefix}-quantity-${item.key}`} className="mb-1 block text-sm font-medium">Quantidade</label><input id={`${prefix}-quantity-${item.key}`} name="material_quantity" value={item.quantity} required inputMode="decimal" onChange={e=>setItems(items.map((r,j)=>j===i?{...r,quantity:e.target.value}:r))} className={input}/></div>{items.length>1&&<button type="button" onClick={()=>setItems(items.filter((_,j)=>j!==i))} className="min-h-11 text-sm text-red-800">Remover material {i+1}</button>}</div>)}<button type="button" onClick={()=>setItems([...items,{key:nextRow.current++,material_id:"",quantity:""}])} className="min-h-11 rounded-lg border px-4 text-sm">Adicionar material</button>{!options.materials.length&&<p className="text-sm text-amber-900">Cadastre materiais antes de lançar.</p>}</div>}
    </>}
    <div><label htmlFor={`${prefix}-note`} className="mb-1 block text-sm font-medium">Observação (opcional)</label><textarea id={`${prefix}-note`} name="note" value={values.note??""} onChange={e=>setValues({...values,note:e.target.value})} className={`${input} py-2`}/></div>
   </>}
  </fieldset>
  {state.message&&<p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{state.message}</p>}
  {state.uncertain&&<p className="text-sm text-slate-600">Os dados foram preservados para repetir a mesma tentativa com segurança. Se sair ou recarregar a página, confira o histórico antes de lançar novamente.</p>}
  <PendingButton pending={pending} pendingLabel="Registrando…" disabled={pending} className={`min-h-11 rounded-lg px-5 font-medium text-white disabled:opacity-60 ${reversal?"bg-red-800":"bg-teal-800"}`}>{state.uncertain?"Repetir mesma tentativa":task==="order"?"Criar pedido":reversal?"Confirmar estorno":"Registrar operação"}</PendingButton>
 </form>;
}
