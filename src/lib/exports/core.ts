import type {ExportOperation} from "./types";
export const exportKinds:Record<string,string>={material_entry:"Entrada de material",material_delivery:"Entrega de materiais",bag_receipt:"Recebimento de bolsas",reversal:"Estorno"};
export function exportUuid(value:string):string {
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))throw new Error("Referência inválida.");return value.toLowerCase();
}
function day(value:string):string {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.startsWith("0000"))throw new Error("Data inválida.");
 const parsed=new Date(value+"T00:00:00Z");if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw new Error("Data inválida.");return value;
}
export function exportFilters(params:URLSearchParams) {
 for(const key of params.keys())if(!["inicio","fim","pedido","faccao"].includes(key)||params.getAll(key).length>1)throw new Error("Filtro inválido ou repetido.");
 const start=params.get("inicio")||"",end=params.get("fim")||"";
 const since=start?new Date(day(start)+"T00:00:00-03:00").toISOString():null;
 const until=end?new Date(new Date(day(end)+"T00:00:00-03:00").getTime()+86400000).toISOString():null;
 if(since&&until&&new Date(since).getTime()>=new Date(until).getTime())throw new Error("A data inicial não pode ser posterior à final.");
 return {p_since:since,p_until:until,p_order:params.get("pedido")?exportUuid(params.get("pedido")!):null,p_workshop:params.get("faccao")?exportUuid(params.get("faccao")!):null};
}
export function exportDate(iso:string):string {return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(iso));}
export function exportQuantity(value:string):string {
 if(!/^-?\d+(?:\.\d+)?$/.test(value))throw new Error("Quantidade inválida no relatório.");return value.replace(".",",");
}
export function csvCell(value:string,numeric=false):string {
 let text=value.replace(/\0/g,"");
 if(!numeric&&/^[\s\uFEFF]*[=+@-]/u.test(text))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
}
export function generateCsv(operations:ExportOperation[]):string {
 const rows:string[]=[['Operação','Empresa','Tipo','Data (Brasília)','Pedido','Facção','Situação','Estorno de','Item','Unidade','Quantidade (movimento)','Observação'].map(c=>csvCell(c)).join(";")];
 for(const op of operations){const status=op.kind==="reversal"?"Estorno":op.is_reversed?"Estornada":"Registrada";
  for(const item of op.items){rows.push([op.id,op.company,exportKinds[op.kind]??op.kind,exportDate(op.created_at),op.order_name??"",op.workshop_name??"",status,op.reversal_of??"",item.name,item.unit].map(c=>csvCell(c)).concat(csvCell(exportQuantity(item.quantity),true),csvCell(op.note??"")).join(";"));}
 }
 return "\uFEFF"+rows.join("\r\n")+"\r\n";
}
