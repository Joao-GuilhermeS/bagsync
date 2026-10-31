import type {Role,AccessContext} from "./authorization";
export const features=["inicio","consultas","cadastros","pedidos","estoque","expedicao","motorista","observacoes","prazos","rotas","contas"] as const;
export type Feature=typeof features[number];
export const featureLabels:Record<Feature,string>={inicio:"Página inicial",consultas:"Consultas e relatórios",cadastros:"Cadastros e fichas técnicas",pedidos:"Criar pedidos de produção",estoque:"Entradas de estoque e estornos",expedicao:"Expedição e romaneios",motorista:"Motorista: entregas e recolhimentos",observacoes:"Observações de produção",prazos:"Definir e prorrogar prazos",rotas:"Atribuir rotas (módulo futuro)",contas:"Criar e administrar contas"};
export const roleFeatures:Record<Role,readonly Feature[]>={gerente_logistico:features,gestor:["inicio","consultas","observacoes","rotas","contas"],motorista:["inicio","consultas","motorista","observacoes"]};
export const roleLabels:Record<Role,string>={gerente_logistico:"Gestor Logístico",gestor:"Gestor",motorista:"Motorista"};
export function hasFeature(access:AccessContext|null,feature:Feature):boolean{
 if(!access?.userId||!access.companyId||!Object.prototype.hasOwnProperty.call(roleFeatures,access.role))return false;
 return access.isPrimary===true||(roleFeatures[access.role].includes(feature)&&(access.permissions??roleFeatures[access.role]).includes(feature));
}
export function pathFeatures(path:string):Feature[]{
 if(path==="/painel/acesso-restrito")return [];
 if(path==="/painel"||path==="/painel/visao-geral")return ["inicio"];
 if(path.startsWith("/painel/administracao"))return ["contas"];
 if(/\/painel\/(expedicao|remessas)\/(nova|[^/]+\/preencher)(\/|$)/.test(path))return ["expedicao"];
 if(path==="/painel/pedidos/novo")return ["pedidos"];
 if(/\/painel\/(expedicao|remessas)\/.+\/pdf$/.test(path))return ["consultas","motorista","expedicao"];
 if(path.startsWith("/painel/expedicao")||path.startsWith("/painel/remessas"))return ["consultas","expedicao"];
 if(path.startsWith("/painel/cadastros")||path.startsWith("/painel/modelos"))return ["consultas","cadastros"];
 if(path.startsWith("/painel/entreg"))return ["consultas","motorista"];
 if(path.startsWith("/painel/pedidos"))return ["consultas","pedidos"];
 if(path.startsWith("/painel/estoque")||path.startsWith("/painel/movimentacoes"))return ["consultas","estoque"];
 if(path.startsWith("/painel/prazos"))return ["consultas","prazos"];
 if(path.startsWith("/painel/producao"))return ["consultas","observacoes"];
 if(path.startsWith("/painel/exportacoes/romaneio"))return ["consultas","motorista"];
 return ["consultas"];
}
export function allowedPath(access:AccessContext,path:string){const required=pathFeatures(path);return required.length===0||required.some(feature=>hasFeature(access,feature));}
export function landingPath(access:AccessContext){
 for(const path of ["/painel","/painel/producao","/painel/entregador","/painel/cadastros/bolsas","/painel/pedidos","/painel/estoque","/painel/expedicao","/painel/prazos","/painel/administracao"])if(allowedPath(access,path))return path;
 return "/painel/acesso-restrito";
}
