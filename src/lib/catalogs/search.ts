export function matchingNames<T extends {name:string}>(rows:readonly T[],query:string):T[]{
 const clean=(text:string)=>text.normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().toLocaleLowerCase("pt-BR");
 return rows.filter(row=>clean(row.name).includes(clean(query)));
}
