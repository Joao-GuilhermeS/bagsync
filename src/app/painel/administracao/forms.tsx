"use client";
import {useActionState,useId,useRef,useState,type ReactNode} from "react";
import {FormDrawer} from "@/components/ui/drawer";
import {newRequestKey} from "@/lib/auth/request-key";
import type {Role} from "@/lib/auth/authorization";
import {features,featureLabels,roleLabels,roleFeatures} from "@/lib/auth/features";
import type {Feature} from "@/lib/auth/features";
import type {AccountRow,AccountActionState} from "@/lib/auth/admin-validation";
import {saveAccount,saveRoleLimit} from "./actions";
import {PendingButton} from "@/components/ui/pending-button";
const initial:AccountActionState={success:false,message:""};
export function PermissionChoices({selected,onChange,allowed,name="permissions"}:{name?:string;selected:readonly Feature[];onChange:(value:Feature[])=>void;allowed:readonly Feature[]}){return <div role="group" aria-label={name==="grant_permissions"?"O que pode conceder":"Funcionalidades da conta"} className="grid gap-2 sm:grid-cols-2">{features.map(feature=><label key={feature} className={`flex min-h-11 items-center gap-2 rounded-lg border p-2.5 text-xs ${allowed.includes(feature)?"bg-white text-slate-700":"bg-slate-50 text-slate-400"}`}><input type="checkbox" name={name} value={feature} checked={allowed.includes(feature)&&selected.includes(feature)} disabled={!allowed.includes(feature)} onChange={event=>onChange(event.target.checked?[...selected,feature]:selected.filter(value=>value!==feature))} className="size-4 shrink-0"/>{featureLabels[feature]}</label>)}</div>;}
export function AccountForm({account,limits,grantable:delegable,requestKey}:{account?:AccountRow;limits:Record<Role,Feature[]>;grantable:Feature[];requestKey:string}){
 const id=useId();const [key,setKey]=useState(requestKey),[role,setRole]=useState<Role>(account?.role??"motorista");
 const grantable=(r:Role)=>roleFeatures[r].filter(feature=>(limits[r]??[]).includes(feature)&&delegable.includes(feature));
 const [selected,setSelected]=useState<Feature[]>(account?.assigned??grantable("motorista"));
 const snapshot=useRef<FormData|null>(null);
 const [state,action,pending]=useActionState(async(previous:AccountActionState,data:FormData)=>{
  const body=previous.uncertain&&snapshot.current?snapshot.current:data;snapshot.current=body;
  const result=await saveAccount(previous,body);
  if(result.success){snapshot.current=null;}else if(!result.uncertain){snapshot.current=null;setKey(newRequestKey());}
  return result;
 },initial);
 if(state.success)return <div role="status" className="rounded-xl border bg-mint p-4 text-sm text-forest">{state.message}</div>;
 return <form action={action} className="space-y-4"><input type="hidden" name="request_key" value={key}/>{account&&<input type="hidden" name="user_id" value={account.id}/>}
  <fieldset disabled={pending||state.uncertain} className="space-y-4"><div><label htmlFor={`${id}-name`} className="mb-1 block text-xs font-medium">Nome completo</label><input id={`${id}-name`} name="name" autoComplete="off" required maxLength={120} defaultValue={account?.name==="Nome não cadastrado"?"":account?.name} className="field-input"/></div>
  {!account&&<><div><label htmlFor={`${id}-email`} className="mb-1 block text-xs font-medium">E-mail para login</label><input id={`${id}-email`} name="email" type="email" autoComplete="off" required maxLength={254} className="field-input"/></div><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor={`${id}-password`} className="mb-1 block text-xs font-medium">Senha inicial</label><input id={`${id}-password`} name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className="field-input"/></div><div><label htmlFor={`${id}-confirm`} className="mb-1 block text-xs font-medium">Confirmar senha</label><input id={`${id}-confirm`} name="password_confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className="field-input"/></div></div><p className="text-xs text-slate-500">12 a 128 caracteres. A pessoa entra com essa senha, sem confirmação por e-mail.</p></>}
  <div><label htmlFor={`${id}-role`} className="mb-1 block text-xs font-medium">Perfil base</label><select id={`${id}-role`} name="role" value={role} onChange={event=>{const next=event.target.value as Role;setRole(next);setSelected(grantable(next));}} className="field-input">{Object.entries(roleLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
  <div><h3 className="mb-2 text-sm font-semibold">Funcionalidades permitidas</h3><PermissionChoices selected={selected} onChange={setSelected} allowed={grantable(role)}/><p className="mt-2 text-xs text-slate-500">Opções indisponíveis estão fora do perfil aprovado ou do limite de concessão definido pela conta principal. Rotas ainda não têm tela operacional.</p></div>
  {account&&<label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" value="sim" defaultChecked={account.active} className="size-4"/>Conta ativa</label>}
  </fieldset>{state.message&&<p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm">{state.message}</p>}{state.uncertain&&<p className="text-xs text-slate-500">Dados preservados nesta aba. Confira a lista antes de sair; repetir reutiliza a mesma tentativa, inclusive a senha.</p>}<PendingButton pending={pending} className="btn-primary" pendingLabel="Salvando…">{state.uncertain?"Repetir mesma tentativa":account?"Salvar acesso":"Criar conta"}</PendingButton>
 </form>;
}
export function RoleLimitForm({role,permissions,grants,requestKey}:{role:Role;permissions:Feature[];grants:Feature[];requestKey:string}){
 const [selected,setSelected]=useState<Feature[]>(permissions);const [granted,setGranted]=useState<Feature[]>(grants);const snapshot=useRef<FormData|null>(null);
 const [state,action,pending]=useActionState(async(previous:AccountActionState,body:FormData)=>{const data=previous.uncertain&&snapshot.current?snapshot.current:body;snapshot.current=data;return saveRoleLimit(previous,data);},initial);
 return <form action={action} className="space-y-4"><input type="hidden" name="request_key" value={requestKey}/><input type="hidden" name="role" value={role}/><p className="text-sm text-slate-500">Limite máximo para contas do perfil {roleLabels[role]}. Reduzir limita também os acessos existentes. A conta principal permanece protegida.</p><fieldset disabled={pending||state.uncertain||state.success}><h3 className="mb-2 text-sm font-semibold">Acessos máximos do perfil</h3><PermissionChoices selected={selected} onChange={setSelected} allowed={roleFeatures[role]}/><h3 className="mt-4 mb-2 text-sm font-semibold">O que este perfil pode conceder a outras contas</h3><p className="mb-3 text-xs text-slate-500">Este limite é independente do uso operacional. Ao conceder uma funcionalidade, o administrador poderá criar contas capazes de utilizá-la.</p><PermissionChoices name="grant_permissions" selected={granted} onChange={setGranted} allowed={features}/></fieldset>{state.message&&<p role={state.success?"status":"alert"} className="text-sm">{state.message}</p>}<PendingButton pending={pending} disabled={state.success} className="btn-primary">{state.uncertain?"Repetir mesma tentativa":"Salvar limite"}</PendingButton></form>;
}

export function AccessDrawer({title,trigger,description,variant,children}:{title:string;trigger:string;description?:string;variant?:"primary"|"secondary";children:ReactNode}){const [open,setOpen]=useState(false);return <FormDrawer title={title} trigger={trigger} description={description} variant={variant} onOpen={()=>setOpen(true)} onClose={()=>setOpen(false)}>{open&&children}</FormDrawer>;}
