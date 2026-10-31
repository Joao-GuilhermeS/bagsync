import {roles,type Role} from "./authorization.ts";
import {features,type Feature} from "./features.ts";
export function parseAccessForm(form:FormData){
 const value=(name:string)=>{const raw=form.get(name);return typeof raw==="string"?raw.trim():"";};
 const role=value("role");if(!roles.includes(role as Role))throw new Error("Selecione um perfil válido.");
 const name=value("name");if(!name||name.length>120)throw new Error("Informe o nome (até 120 caracteres).");
 const permissionValues=form.getAll("permissions");if(permissionValues.some(value=>typeof value!=="string"||!features.includes(value as Feature)))throw new Error("Permissão inválida.");
 const requestKey=value("request_key");if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey))throw new Error("Atualize o formulário antes de salvar.");
 const userId=value("user_id");if(userId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))throw new Error("Conta inválida.");
 return {requestKey,name,role:role as Role,permissions:[...new Set(permissionValues as Feature[])].sort(),userId,active:form.get("active")==="sim",email:value("email").toLowerCase()};
}
export type AccountRow={id:string;name:string;email:string;role:Role;active:boolean;primary:boolean;permissions:Feature[];assigned:Feature[]};
export type AccessAdministration={total:number;users:AccountRow[];limits:Record<Role,Feature[]>;grants:Record<Role,Feature[]>;grantable:Feature[];events:{operation:string;target_id:string|null;actor_id:string;created_at:string}[]};
export type AccountActionState={success:boolean;message:string;uncertain?:boolean};
