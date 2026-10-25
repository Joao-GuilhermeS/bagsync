export const catalogs = {
 faccoes: {table: "workshops", title: "Facções e costureiras", singular: "facção"},
 unidades: {table: "measurement_units", title: "Unidades de medida", singular: "unidade"},
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
 if (catalog === "unidades") {
  const symbol = form.get("symbol");
  if(typeof symbol !== "string" || !symbol.trim()) throw new Error("Informe o símbolo da unidade.");
  result.symbol = symbol.trim();
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
