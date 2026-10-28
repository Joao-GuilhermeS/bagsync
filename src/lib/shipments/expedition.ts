import {parseShipment,parseShipmentChecklist} from "../checklists/shipment-validation.ts";
import {isUuid} from "../catalogs/validation.ts";
export type ExpeditionTemplate={id:string;bag_id:string;label:string;material_id:string;unit_symbol:string;input_type:"checkbox"|"text"|null;position:number};
export type ExpeditionOptions={orders:{id:string;name:string;bag_id:string}[];models:{id:string;name:string}[];workshops:{id:string;name:string}[];templates:ExpeditionTemplate[]};
export type ChecklistDraft={expected:string;mode:"pending"|"complete"|"partial";quantity:string;text:string};
export const emptyDraft=():ChecklistDraft=>({expected:"",mode:"pending",quantity:"",text:""});
export function parseExpedition(form:FormData){
 const intent=form.get("intent");if(intent!=="draft"&&intent!=="emit")throw new Error("Ação de expedição inválida.");
 const create=parseShipment(form);
 const submissionKey=form.get("submission_key");if(!isUuid(submissionKey)||submissionKey.toLowerCase()===create.p_request_key.toLowerCase())throw new Error("Chaves de emissão inválidas.");
 const mapped=new FormData();mapped.set("request_key",submissionKey);mapped.set("kit_id",create.p_request_key);
 for(const id of form.getAll("template_item_id"))mapped.append("kit_item_id",id);
 for(const name of ["mode","response_text","quantity"])for(const value of form.getAll(name))mapped.append(name,value);
 const answers=intent==="draft"?[]:parseShipmentChecklist(mapped).p_answers;
 if(intent==="emit"&&!answers.some(answer=>answer.mode!=="pending"))throw new Error("Confira ao menos um material ou salve a remessa pendente.");
 return {intent,create,submissionKey,answers,note:create.p_note};
}
export type TransportState="pendentes"|"transito"|"entregues";
export function expeditionTransport(statuses:readonly string[]):TransportState {
 const active=statuses.filter(value=>value!=="estornado");
 if(active.some(value=>value==="a_entregar"))return "transito";
 return active.length&&active.every(value=>value==="entregue")?"entregues":"pendentes";
}
export function mapExpeditionAnswers(answers:ReturnType<typeof parseShipmentChecklist>["p_answers"],snapshot:readonly {id:string;template_item_id:string|null}[]){
 if(snapshot.length!==answers.length)throw new Error("Checklist da remessa divergente.");
 return answers.map(answer=>{
  const item=snapshot.find(row=>row.template_item_id?.toLowerCase()===answer.kit_item_id.toLowerCase());
  if(!item)throw new Error("Item do snapshot indisponível.");
  return {...answer,kit_item_id:item.id};
 });
}
