"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import type {ReactNode} from "react";
import {Icon} from "./icon";
const ToastContext=createContext<(message:string)=>void>(()=>{});
export function ToastProvider({children}:{children:ReactNode}){
 const [toast,setToast]=useState<{message:string;id:number}|null>(null);
 const notify=useCallback((message:string)=>setToast({message,id:Date.now()}),[]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),5000);return ()=>clearTimeout(timer);},[toast]);
 const value=useMemo(()=>notify,[notify]);
 return <ToastContext.Provider value={value}>{children}<div className="pointer-events-none fixed top-4 right-4 left-4 z-[100] sm:top-auto sm:bottom-6 sm:left-auto sm:w-96" aria-live="polite" aria-atomic="true">{toast&&<div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-olive/30 bg-white p-4 text-sm text-forest shadow-xl"><Icon name="check" className="mt-0.5 size-5 shrink-0 text-olive"/><p className="flex-1 leading-relaxed">{toast.message}</p><button type="button" aria-label="Fechar notificação" onClick={()=>setToast(null)} className="-m-2 grid size-11 shrink-0 place-items-center"><Icon name="close"/></button></div>}</div></ToastContext.Provider>;
}
export function useActionToast(state:{success:boolean;message:string}){
 const notify=useContext(ToastContext);
 useEffect(()=>{if(state.success&&state.message)notify(state.message);},[state,notify]);
}
