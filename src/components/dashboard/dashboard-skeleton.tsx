import {ChartSkeleton, LoadingRegion, MetricSkeleton, Skeleton, TableSkeleton} from "../ui/skeleton";

export function DashboardSkeleton() {
  return <LoadingRegion label="Carregando a Visão geral…" className="space-y-6">
    <div><h1 className="page-title text-forest">Visão geral</h1><Skeleton className="mt-3 h-4 w-96 max-w-full"/></div>
    <div className="surface grid min-h-28 gap-4 p-5 md:grid-cols-[1.4fr_1fr_auto]"><Skeleton className="h-12"/><Skeleton className="h-12"/><Skeleton className="h-12 w-28"/></div>
    <div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map(index=><MetricSkeleton key={index}/>)}</div>
    <div className="surface p-5 sm:p-6"><Skeleton className="h-5 w-56"/><Skeleton className="mt-3 h-3 w-44"/><div className="my-5 flex gap-2"><Skeleton className="h-11 w-28"/><Skeleton className="h-11 w-32"/></div><ChartSkeleton/><Skeleton className="mt-4 h-3 w-3/4"/></div>
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1,2].map(index=><div key={index} className="surface min-h-80 space-y-6 p-6"><Skeleton className="h-4 w-40"/>{[1,2,3,4].map(row=><Skeleton key={row} className="h-12"/>)}</div>)}<div className="md:col-span-2 xl:col-span-1"><TableSkeleton rows={5}/></div></div>
  </LoadingRegion>;
}
