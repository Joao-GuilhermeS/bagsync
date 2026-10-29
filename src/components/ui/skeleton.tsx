import type {ReactNode} from "react";

export function Skeleton({className=""}: {className?: string}) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 ${className}`}/>;
}

export function LoadingRegion({label,children,className=""}: {label:string;children:ReactNode;className?:string}) {
  return <div role="status" aria-busy="true"><span className="sr-only">{label}</span><div aria-hidden="true" className={className}>{children}</div></div>;
}

export function MetricSkeleton() {
  return <div className="surface min-h-48 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><Skeleton className="h-4 w-28"/><Skeleton className="size-10 rounded-xl"/></div><Skeleton className="mt-3 h-10 w-32"/><Skeleton className="mt-3 h-6 w-40 max-w-full"/></div>;
}

export function ChartSkeleton() {
  return <div className="flex h-80 items-end gap-4 rounded-xl border-b px-4 pb-4 sm:gap-8" aria-hidden="true">{["h-2/3","h-4/5","h-1/2","h-3/4","h-2/5","h-3/5"].map((height,index)=><Skeleton key={index} className={`min-w-0 flex-1 rounded-b-none ${height}`}/>)}</div>;
}

export function TableSkeleton({rows=5,columns=4}: {rows?:number;columns?:number}) {
  return <div className="surface overflow-hidden p-4 sm:p-6"><div className="mb-4 flex gap-4 border-b pb-4">{Array.from({length:columns},(_,index)=><Skeleton key={index} className="h-3 min-w-0 flex-1"/>)}</div>{Array.from({length:rows},(_,index)=><div key={index} className="flex min-h-16 items-center gap-4 border-b last:border-0">{Array.from({length:columns},(_,column)=><Skeleton key={column} className={`h-4 min-w-0 flex-1 ${column===columns-1?"max-w-20":""}`}/>)}</div>)}</div>;
}

export function CardsSkeleton({count=6}: {count?:number}) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({length:count},(_,index)=><div key={index} className="surface min-h-64 p-5"><Skeleton className="h-6 w-28 rounded-full"/><Skeleton className="mt-5 h-5 w-3/4"/><Skeleton className="mt-3 h-4 w-1/2"/><Skeleton className="mt-6 h-10 w-full"/><Skeleton className="mt-5 h-8 w-32"/></div>)}</div>;
}

export function PageSkeleton({label="Carregando página…",variant="cards"}: {label?:string;variant?:"cards"|"table"|"form"}) {
  return <LoadingRegion label={label} className="space-y-6"><div><Skeleton className="h-8 w-64 max-w-full"/><Skeleton className="mt-3 h-4 w-96 max-w-full"/></div>{variant==="cards"?<CardsSkeleton/>:variant==="table"?<TableSkeleton/>:<div className="surface max-w-3xl space-y-5 p-6">{[1,2,3,4].map(index=><div key={index}><Skeleton className="mb-2 h-3 w-28"/><Skeleton className="h-12 w-full"/></div>)}<Skeleton className="h-12 w-40"/></div>}</LoadingRegion>;
}
