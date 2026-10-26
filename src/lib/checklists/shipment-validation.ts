import {isUuid} from "../catalogs/validation.ts";
import {positiveQuantity} from "../operations/validation.ts";

function text(form:FormData,name:string) {
 const value=form.get(name);return typeof value==="string"?value.trim():"";
}
function uuid(value:unknown) {
 if(typeof value!=="string"||!isUuid(value))throw new Error("Selecione referências válidas para a remessa.");
 return value;
}
export function parseShipment(form:FormData) {
 const ids=form.getAll("template_item_id"),quantities=form.getAll("expected_quantity");
 if(!ids.length||ids.length!==quantities.length)throw new Error("Informe a previsão de todos os itens do checklist.");
 const seen=new Set<string>();
 const p_items=ids.map((value,index)=>{
  const template_item_id=uuid(value).toLowerCase();
  if(seen.has(template_item_id))throw new Error("Não repita itens do checklist.");
  seen.add(template_item_id);
  return {template_item_id,expected_quantity:positiveQuantity(quantities[index])};
 });
 return {p_request_key:uuid(text(form,"request_key")),p_order_id:uuid(text(form,"order_id")),p_workshop_id:uuid(text(form,"workshop_id")),p_bag_quantity:positiveQuantity(form.get("bag_quantity"),true),p_items,p_note:text(form,"note")||null};
}

export function parseShipmentChecklist(form:FormData) {
 const ids=form.getAll("kit_item_id"),modes=form.getAll("mode"),texts=form.getAll("response_text"),quantities=form.getAll("quantity");
 if(!ids.length||[modes,texts,quantities].some(values=>values.length!==ids.length))throw new Error("Responda todos os itens do checklist.");
 const seen=new Set<string>();
 const p_answers=ids.map((value,index)=>{
  const kit_item_id=uuid(value).toLowerCase();if(seen.has(kit_item_id))throw new Error("Não repita respostas do checklist.");seen.add(kit_item_id);
  const mode=modes[index];if(mode!=="pending"&&mode!=="complete"&&mode!=="partial")throw new Error("Modo de envio inválido.");
  const rawText=texts[index];if(typeof rawText!=="string")throw new Error("Resposta livre inválida.");
  const answer:{kit_item_id:string;mode:string;text:string|null;quantity?:string}={kit_item_id,mode,text:rawText.trim()?rawText:null};
  if(mode==="partial")answer.quantity=positiveQuantity(quantities[index]);
  if(mode==="pending"){
   const raw=quantities[index];if(typeof raw!=="string"||!/^\s*(?:0+(?:[.,]0+)?)?\s*$/.test(raw))throw new Error("Item não enviado deve ter quantidade zero.");
  }
  return answer;
 });
 return {p_request_key:uuid(text(form,"request_key")),p_kit_id:uuid(text(form,"kit_id")),p_answers,p_note:text(form,"note")||null};
}
