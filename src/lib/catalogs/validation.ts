export const catalogs = {
 faccoes: {table: "workshops", title: "Facções e costureiras", singular: "facção"},
 materiais: {table: "materials", title: "Materiais de produção", singular: "material"},
 bolsas: {table: "bags", title: "Modelos de bolsas", singular: "modelo de bolsa"},
} as const;
export type Catalog = keyof typeof catalogs;
export function isCatalog(value: string): value is Catalog {
 return Object.prototype.hasOwnProperty.call(catalogs,value);
}
export function isUuid(value: unknown): value is string {
 return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
export function validateCatalog(catalog: Catalog, form: FormData): Record<string,string> {
 const raw = form.get("name");
 if (typeof raw !== "string" || !raw.trim()) throw new Error("Informe o nome.");
 const result: Record<string,string> = {name:raw.trim()};
 if(catalog === "faccoes") {
  const limits={document_number:40,phone:30,street:200,address_number:30,address_complement:150,neighborhood:100,city:100,state:2,postal_code:9};
  for(const [field,limit] of Object.entries(limits)) {
   const raw=form.get(field);
   if(raw!==null&&typeof raw!=="string")throw new Error("Dados de contato inválidos.");
   const value=(raw??"").trim();
   if(value.length>limit)throw new Error(`Revise os dados de contato: máximo de ${limit} caracteres no campo informado.`);
   result[field]=field==="state"?value.toUpperCase():value;
  }
  if(result.state&&!/^[A-Z]{2}$/.test(result.state))throw new Error("Informe a UF com duas letras.");
  if(result.postal_code&&!/^\d{5}-?\d{3}$/.test(result.postal_code))throw new Error("Informe um CEP com oito dígitos.");
 }
 if(catalog === "materiais") {
  const unit = form.get("unit_id");
  if(!isUuid(unit)) throw new Error("Selecione uma unidade de medida válida.");
  result.unit_id = unit;
 }
 return result;
}
export function catalogError(code?: string): string {
 if(code === "23503") return "Este registro está vinculado a outros dados, ou a referência não está disponível. Revise os vínculos antes de alterar ou excluir.";
 if(code === "23505") return "Já existe um registro com essa identificação. Confira os dados antes de tentar novamente.";
 if(code === "42501") return "Você não tem permissão para esta operação.";
 return "Não foi possível concluir a operação. Tente novamente.";
}
export function pageNumber(value: unknown): number {
 if(typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;
 const n=Number(value);
 return Number.isSafeInteger(n) && n <= 1000000 ? n : 1;
}
