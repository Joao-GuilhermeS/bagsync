"use client";

import type {ButtonHTMLAttributes, ReactNode} from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending: boolean;
  pendingLabel?: string;
  children: ReactNode;
};

/** Mantém o rótulo original no layout durante a ação, sem trocar a largura do botão. */
export function PendingButton({pending, pendingLabel="Processando…", children, disabled, className="btn-primary", ...props}: Props) {
  return <button {...props} disabled={disabled || pending} aria-busy={pending} className={`relative transition-[background-color,transform] duration-200 ease-in-out active:scale-[0.98] disabled:active:scale-100 ${className}`}>
    <span className={pending ? "invisible" : ""}>{children}</span>
    {pending && <span className="absolute inset-0 flex items-center justify-center gap-2 px-3" role="status">
      <span aria-hidden="true" className="size-3 shrink-0 animate-pulse rounded-full bg-current opacity-60"/>
      <span className="truncate text-xs">{pendingLabel}</span>
    </span>}
  </button>;
}
