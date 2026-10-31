import {allowedPath} from "./auth/features.ts";
import type {Role} from "./auth/authorization";
import type {IconName} from "../components/ui/icon";
export type NavItem={href:string;label:string;icon:IconName};
export type NavGroup={label:string;items:NavItem[]};
export function navigationFor(role:Role,access?:import("./auth/authorization").AccessContext):NavGroup[]{
 const groups:NavGroup[]=[
  {label:"Principal",items:[{href:"/painel",label:"Visão geral",icon:"home"},{href:"/painel/pedidos",label:"Pedidos de produção",icon:"orders"}]},
  {label:"Produção e facções",items:[{href:"/painel/producao",label:"Acompanhar produção",icon:"chart"},{href:"/painel/prazos",label:"Prazos de produção",icon:"orders"}]},
  {label:"Materiais e logística",items:[{href:"/painel/estoque/materiais",label:"Estoque de materiais",icon:"layers"},{href:"/painel/expedicao",label:"Expedição",icon:"box"},{href:"/painel/entregas",label:"Entregas de materiais",icon:"truck"},{href:"/painel/entregador",label:"Entregas e recolhimentos",icon:"truck"}]},
  {label:"Produto final",items:[{href:"/painel/estoque/bolsas",label:"Bolsas prontas",icon:"bag"}]},
  {label:"Cadastros",items:[{href:"/painel/cadastros/faccoes",label:"Facções e costureiros",icon:"users"},{href:"/painel/cadastros/bolsas",label:"Modelos de bolsas",icon:"bag"},{href:"/painel/cadastros/materiais",label:"Materiais e insumos",icon:"layers"}]},
  {label:"Consultas",items:[{href:"/painel/movimentacoes",label:"Histórico de movimentos",icon:"history"},{href:"/painel/exportacoes",label:"Relatórios e documentos",icon:"file"}]},
 ];
 const visible=role==="motorista"?groups.map(group=>group.label==="Cadastros"?{...group,items:group.items.slice(0,2)}:group):groups;
 const filtered=access?visible.map(group=>({...group,items:group.items.filter(item=>allowedPath(access,item.href))})).filter(group=>group.items.length):visible;
 if(access&&(access.isPrimary||access.permissions?.includes("contas")))filtered.push({label:"Administração",items:[{href:"/painel/administracao",label:access.isPrimary?"Contas e permissões":"Contas de acesso",icon:"users"}]});
 return filtered;
}
export function navigationLocation(pathname:string,groups:NavGroup[]){
 const matches=groups.flatMap(group=>group.items.map(item=>({group:group.label,item}))).filter(({item})=>item.href==="/painel"?pathname===item.href:pathname===item.href||pathname.startsWith(item.href+"/"));
 return matches.sort((a,b)=>b.item.href.length-a.item.href.length)[0]??{group:"Principal",item:{href:"/painel",label:"Visão geral",icon:"home" as const}};
}
export function driverStep(pathname:string):number {return Math.min(3,Math.max(1,pathname.split("/").filter(Boolean).length-1));}
