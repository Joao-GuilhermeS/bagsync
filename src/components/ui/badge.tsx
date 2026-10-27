import type {ReactNode} from "react";
const variants={neutral:"bg-slate-100 text-slate-700",success:"bg-mint text-olive",pending:"bg-amber-50 text-amber-900",progress:"bg-indigo-50 text-indigo-800",danger:"bg-rose-50 text-rose-800"};
export function Badge({children,tone="neutral"}:{children:ReactNode;tone?:keyof typeof variants}){return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${variants[tone]}`}>{children}</span>;}
