import {LoadingRegion, PageSkeleton, Skeleton} from "../ui/skeleton";

export function ShellSkeleton() {
  return <LoadingRegion label="Verificando acesso e carregando o painel…" className="min-h-dvh bg-background">
    <aside className="fixed inset-y-0 hidden w-72 flex-col border-r bg-white p-5 lg:flex"><Skeleton className="mb-10 h-10 w-44"/>{[1,2,3,4,5,6,7,8].map(index=><Skeleton key={index} className="mb-4 h-10 w-full"/>)}<Skeleton className="mt-auto h-14 w-full"/></aside>
    <div className="lg:pl-72"><div className="flex h-20 items-center justify-between border-b bg-white px-4 sm:px-8"><Skeleton className="h-8 w-44"/><Skeleton className="size-10 rounded-full"/></div><div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8"><PageSkeleton/></div></div>
  </LoadingRegion>;
}
