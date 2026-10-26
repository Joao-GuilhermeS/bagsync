import {isUuid} from "../catalogs/validation.ts";

function field(form:FormData,name:string):string {
 const value=form.get(name);return typeof value==="string"?value.trim():"";
}
export function parseChecklist(form:FormData) {
 const operation=field(form,"operation");
 if(operation!=="insert"&&operation!=="update")throw new Error("Ação de checklist inválida.");
 const bag_id=field(form,"bag_id"),id=field(form,"id"),material_id=field(form,"material_id");
 if(!isUuid(bag_id)||!isUuid(id)||!isUuid(material_id))throw new Error("Modelo, item ou material inválido.");
 const label=field(form,"label"),position=field(form,"position"),input_type=field(form,"input_type");
 if(input_type!=="checkbox"&&input_type!=="text")throw new Error("Escolha caixa de marcação ou texto livre.");
 if(!label)throw new Error("Informe o nome do item no checklist.");
 if(!/^\d+$/.test(position)||BigInt(position)>BigInt("2147483647"))throw new Error("Informe uma posição inteira entre 0 e 2147483647.");
 return {operation,id,bag_id,material_id,label,input_type,position:Number(position),active:form.get("active")==="sim"};
}
