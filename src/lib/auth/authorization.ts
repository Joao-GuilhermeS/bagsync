export const roles = ["gerente_logistico", "motorista", "gestor"] as const;
export type Role = (typeof roles)[number];
export type Permission = "consultar" | "gerenciar_operacoes" | "registrar_entrega_recebimento" | "registrar_observacao_producao";

export interface AccessContext {
  userId: string;
  companyId: string;
  role: Role;
}

// O contexto deve vir da sessão validada e do vínculo no banco, nunca do formulário.
export function canAccess(
  context: AccessContext | null,
  companyId: string,
  permission: Permission,
): boolean {
  if (!context?.userId || !companyId || context.companyId !== companyId) return false;
  if (!roles.includes(context.role)) return false;
  switch (permission) {
    case "consultar":
    case "registrar_observacao_producao": return true;
    case "gerenciar_operacoes": return context.role === "gerente_logistico";
    case "registrar_entrega_recebimento":
      return context.role === "gerente_logistico" || context.role === "motorista";
    default: return false;
  }
}
