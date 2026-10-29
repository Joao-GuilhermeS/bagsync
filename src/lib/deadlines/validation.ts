import {isUuid} from "../catalogs/validation.ts";
import {validDate} from "./dates.ts";
export function requiredDeadline(value:unknown):string {
  if(!validDate(value))throw new Error("Informe uma data válida para fabricação / recolhimento.");return value;
}
export function parseDeadlineExtension(form:FormData){
  const key=form.get("request_key"),kit=form.get("kit_id"),due=requiredDeadline(form.get("due_on"));
  const expected=form.get("expected_due_on"),reason=form.get("reason");
  if(!isUuid(key)||!isUuid(kit)||(expected!==""&&!validDate(expected)))throw new Error("Referência de prazo inválida.");
  if(typeof reason!=="string"||!reason.trim()||reason.trim().length>2000)throw new Error("Justifique a prorrogação em até 2.000 caracteres.");
  return {p_request_key:key,p_kit_id:kit,p_due_on:due,p_expected_due_on:expected||null,p_reason:reason.trim()};
}
