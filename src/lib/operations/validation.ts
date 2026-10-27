import type {Role} from "../auth/authorization";
export const operationLabels = {material_entry:"Entrada de material",material_delivery:"Saída de materiais (Expedição)",bag_receipt:"Recebimento de bolsas",reversal:"Estorno"} as const;
export type OperationKind=keyof typeof operationLabels;
export function allowedOperation(role:Role,kind:OperationKind):boolean {
 return role==="gerente_logistico" || (role==="motorista" && kind==="bag_receipt");
}
function text(form:FormData,name:string):string {const value=form.get(name);return typeof value==="string"?value.trim():"";}
function uuid(value:unknown):string {
 if(typeof value!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error("Selecione uma referência válida.");
 return value.toLowerCase();
}
export function positiveQuantity(raw:unknown,integer=false):string {
 if(typeof raw!=="string")throw new Error("Informe uma quantidade positiva.");
 const value=raw.trim();
 if(!(integer?/^\d+$/:/^\d+(?:[.,]\d+)?$/).test(value)||!/[1-9]/.test(value))throw new Error(integer?"Informe uma quantidade inteira e positiva.":"Informe uma quantidade positiva, sem separador de milhares.");
 const [whole,fraction=""]=value.replace(",",".").split(".");
 const decimal=fraction.replace(/0+$/,"");
 return whole.replace(/^0+(?=\d)/,"")+(decimal?"."+decimal:"");
}
export function parseOrder(form:FormData) {
 const name=text(form,"name");if(!name)throw new Error("Informe o nome do pedido.");
 return {p_request_key:uuid(text(form,"request_key")),p_name:name,p_bag_id:uuid(text(form,"bag_id")),p_expected_quantity:positiveQuantity(form.get("expected_quantity"),true)};
}
export function parseOperation(form:FormData) {
 const kind=text(form,"kind");
 if(!Object.prototype.hasOwnProperty.call(operationLabels,kind))throw new Error("Operação inválida.");
 const p_kind=kind as OperationKind;
 const result={p_request_key:uuid(text(form,"request_key")),p_kind,p_order_id:null as string|null,p_workshop_id:null as string|null,p_items:[] as Array<{material_id?:string;quantity:string}>,p_reversal_of:null as string|null,p_note:text(form,"note")||null};
 if(p_kind==="reversal") {
  if(form.get("confirm")!=="sim")throw new Error("Confirme o estorno do registro original.");
  result.p_reversal_of=uuid(text(form,"reversal_of"));return result;
 }
 if(p_kind!=="material_entry") {result.p_order_id=uuid(text(form,"order_id"));result.p_workshop_id=uuid(text(form,"workshop_id"));}
 if(p_kind==="bag_receipt")result.p_items=[{quantity:positiveQuantity(form.get("quantity"),true)}];
 else {
  const ids=form.getAll("material_id"),quantities=form.getAll("material_quantity");
  if(!ids.length||ids.length!==quantities.length)throw new Error("Inclua os materiais e suas quantidades.");
  const seen=new Set<string>();
  result.p_items=ids.map((id,i)=>{const material=uuid(id);if(seen.has(material))throw new Error("Não repita o mesmo material na operação.");seen.add(material);return {material_id:material,quantity:positiveQuantity(quantities[i])};});
 }
 return result;
}
export function formatQuantity(value:string):string {
 const match=/^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
 if(!match)return value;
 return match[1]+match[2].replace(/\B(?=(\d{3})+(?!\d))/g,".")+(match[3]?","+match[3]:"");
}
export function operationError(code?:string):string {
 if(code==="42501")return "Seu perfil não permite esta operação.";
 if(code==="23505")return "Registro já utilizado ou operação já estornada. Confira o histórico.";
 if(code==="23503")return "Pedido, facção ou produto indisponível para sua empresa.";
 if(["22023","22P02","23514","22003"].includes(code??""))return "Dados inválidos ou chave já usada com outros dados. Revise o formulário e o histórico.";
 return "Não foi possível registrar. Confira os dados e tente novamente.";
}

export function parseComposition(form:FormData) {
 const operation=text(form,"operation");
 if(!["insert","update","delete"].includes(operation))throw new Error("Ação de composição inválida.");
 const bag_id=uuid(text(form,"bag_id")),material_id=uuid(text(form,"material_id"));
 if(operation==="delete"&&form.get("confirm")!=="sim")throw new Error("Confirme a remoção do material da composição.");
 return {operation,bag_id,material_id,quantity:operation==="delete"?null:positiveQuantity(form.get("quantity"))};
}
