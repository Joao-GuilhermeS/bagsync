import test from "node:test";
import assert from "node:assert/strict";
import { calculateOrderProgress } from "../src/lib/production/order-progress.ts";

test("recebimentos parciais abatem o mesmo pedido", () => {
  assert.deepEqual(calculateOrderProgress(100, [20, 30]), {expected: 100, received: 50, remaining: 50});
  assert.equal(calculateOrderProgress(100, [20, 30, 50]).remaining, 0);
});
test("pedido sem recebimento mantém previsto", () => {
  assert.equal(calculateOrderProgress(100, []).remaining, 100);
});
test("não esconde excedente nem decide encerramento", () => {
  assert.equal(calculateOrderProgress(10, [12]).remaining, -2);
});
test("rejeita quantidades inválidas e overflow", () => {
  for (const value of [NaN, Infinity, -1, 0, 1.5]) {
    assert.throws(() => calculateOrderProgress(10, [value]));
  }
  assert.throws(() => calculateOrderProgress(-1, []));
  assert.throws(() => calculateOrderProgress(10, [Number.MAX_SAFE_INTEGER, 1]));
});
