import test from "node:test";
import assert from "node:assert/strict";
import { canAccess } from "../src/lib/auth/authorization.ts";

const context = (role) => ({userId: "usuario", companyId: "empresa", role});
test("somente gerente pode gerenciar operações", () => {
  for (const role of ["gerente_logistico", "motorista", "gestor"]) {
    assert.equal(canAccess(context(role), "empresa", "gerenciar_operacoes"), role === "gerente_logistico");
  }
});
test("motorista registra entregas e recebimentos; gestor somente consulta", () => {
  assert.equal(canAccess(context("motorista"), "empresa", "registrar_entrega_recebimento"), true);
  assert.equal(canAccess(context("gestor"), "empresa", "registrar_entrega_recebimento"), false);
  for (const role of ["gerente_logistico", "motorista", "gestor"]) {
    assert.equal(canAccess(context(role), "empresa", "consultar"), true);
  }
});
test("nega todas as permissões entre empresas e sem sessão", () => {
  for (const permission of ["consultar", "gerenciar_operacoes", "registrar_entrega_recebimento"]) {
    for (const role of ["gerente_logistico", "motorista", "gestor"]) {
      assert.equal(canAccess(context(role), "outra-empresa", permission), false);
    }
    assert.equal(canAccess(null, "empresa", permission), false);
  }
});
test("nega papel desconhecido, usuário ausente e permissão desconhecida", () => {
  assert.equal(canAccess(context("administrador"), "empresa", "consultar"), false);
  assert.equal(canAccess({...context("gestor"), userId: ""}, "empresa", "consultar"), false);
  assert.equal(canAccess(context("gerente_logistico"), "empresa", "desconhecida"), false);
});
