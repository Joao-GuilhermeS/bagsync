import {isUuid} from "../catalogs/validation.ts";
export const historyKinds=["distributions","receipts","notes"] as const;
export type HistoryKind=typeof historyKinds[number];
function uuid(value:unknown):string {
 if(typeof value!=="string"||!isUuid(value))throw new Error("Referência de produção inválida.");return value.toLowerCase();
}
export function parseProductionNote(form:FormData) {
 const raw=form.get("note");if(typeof raw!=="string"||!raw.trim())throw new Error("Escreva a observação.");
 return {p_request_key:uuid(form.get("request_key")),p_order_id:uuid(form.get("order_id")),p_workshop_id:uuid(form.get("workshop_id")),p_note:raw.trim()};
}
export function parseTrackingHistory(params:URLSearchParams) {
 for(const name of params.keys())if(!["modelo","pedido","faccao","tipo","pagina"].includes(name)||params.getAll(name).length!==1)throw new Error("Filtro inválido ou repetido.");
 const kind=params.get("tipo");if(!historyKinds.includes(kind as HistoryKind))throw new Error("Histórico inválido.");
 const page=params.get("pagina")??"1";if(!/^[1-9]\d*$/.test(page)||Number(page)>1000000)throw new Error("Página inválida.");
 return {p_bag_id:uuid(params.get("modelo")),p_order_id:uuid(params.get("pedido")),p_workshop_id:uuid(params.get("faccao")),p_kind:kind as HistoryKind,p_page:Number(page)};
}
