"use client";
import {useFormStatus} from "react-dom";
export function Submit() {
 const {pending} = useFormStatus();
 return <button disabled={pending} aria-busy={pending} className="btn-primary min-h-12 w-full">{pending ? "Entrando…" : "Entrar"}</button>;
}
