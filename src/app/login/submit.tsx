"use client";
import {useFormStatus} from "react-dom";
export function Submit() {
 const {pending} = useFormStatus();
 return <button disabled={pending} className="min-h-12 w-full rounded-xl bg-teal-800 px-5 font-semibold text-white disabled:opacity-60">{pending ? "Entrando…" : "Entrar"}</button>;
}
