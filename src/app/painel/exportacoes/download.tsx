"use client";
import {useState} from "react";
export async function downloadFile(url:string,filename:string){
 const response=await fetch(url,{cache:"no-store"});
 if(!response.ok){let message="Não foi possível gerar o arquivo.";try{const data=await response.json();if(typeof data.error==="string")message=data.error;}catch{}throw new Error(message);}
 const blob=await response.blob();const href=URL.createObjectURL(blob);const link=document.createElement("a");link.href=href;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),10000);
}
export function DownloadButton({url,filename,label}:{url:string;filename:string;label:string}){
 const [pending,setPending]=useState(false);const [error,setError]=useState("");
 return <div><button disabled={pending} onClick={async()=>{setPending(true);setError("");try{await downloadFile(url,filename);}catch(e){setError(e instanceof Error?e.message:"Falha no download.");}finally{setPending(false);}}} className="min-h-11 rounded-lg border px-4 text-sm text-teal-800 disabled:opacity-50">{pending?"Gerando arquivo…":label}</button>{error&&<p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}</div>;
}
