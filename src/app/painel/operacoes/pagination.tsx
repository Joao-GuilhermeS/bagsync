import Link from "next/link";
export function Pagination({page,count,query={}}:{page:number;count:number;query?:Record<string,string>}) {
 const href=(next:number)=>`?${new URLSearchParams({...query,pagina:String(next)})}`;
 return <nav aria-label="Paginação" className="my-5 flex items-center justify-between gap-3">{page>1?<Link className="rounded-lg border bg-white px-4 py-3" href={href(page-1)}>Anterior</Link>:<span/>}<span className="text-sm text-slate-600">Página {page}</span>{page*25<count?<Link className="rounded-lg border bg-white px-4 py-3" href={href(page+1)}>Próxima</Link>:<span/>}</nav>;
}
