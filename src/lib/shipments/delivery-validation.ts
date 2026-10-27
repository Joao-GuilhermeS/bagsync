import {isUuid} from "../catalogs/validation.ts";
export function parseDeliveryConfirmation(form:FormData) {
 const key=form.get("request_key"),submission=form.get("submission_id"),note=form.get("note");
 if(!isUuid(key)||!isUuid(submission))throw new Error("Selecione um romaneio emitido válido.");
 if(note!==null&&typeof note!=="string")throw new Error("Anotação inválida.");
 const text=(note??"").trim();
 if(text.length>2000)throw new Error("Use até 2.000 caracteres na anotação.");
 return {p_request_key:key.toLowerCase(),p_submission_id:submission.toLowerCase(),p_note:text};
}
