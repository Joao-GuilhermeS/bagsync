"use client";
import {useEffect,useId,useRef,useState} from "react";

export function InfoTooltip({text,label="Regras do acompanhamento"}:{text:string;label?:string}){
 const id=useId(),root=useRef<HTMLSpanElement>(null),button=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[position,setPosition]=useState({left:16,top:0});
 const show=()=>{const rect=button.current?.getBoundingClientRect();if(rect){setPosition({left:Math.max(16,Math.min(rect.left,window.innerWidth-336)),top:rect.bottom+8});setOpen(true);}};
 useEffect(()=>{if(!open)return;const close=()=>setOpen(false);const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))close();};window.addEventListener("scroll",close,true);window.addEventListener("resize",close);document.addEventListener("pointerdown",outside);return()=>{window.removeEventListener("scroll",close,true);window.removeEventListener("resize",close);document.removeEventListener("pointerdown",outside);};},[open]);
 return <span ref={root} className="inline-flex" onMouseEnter={show} onMouseLeave={()=>setOpen(false)}><button ref={button} type="button" aria-label={label} aria-describedby={open?id:undefined} aria-expanded={open} onFocus={show} onBlur={()=>setOpen(false)} onClick={show} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();setOpen(false);}}} className="grid size-11 shrink-0 place-items-center rounded-lg text-base font-normal text-slate-400 hover:bg-white hover:text-olive">ⓘ</button>{open&&<span id={id} role="tooltip" className="fixed z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border bg-white p-4 text-left text-xs font-normal leading-relaxed text-slate-600 shadow-lg" style={position}>{text}</span>}</span>;
}
