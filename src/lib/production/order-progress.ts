/** Quantidades de bolsas inteiras. Não decide encerramento nem bloqueia excedentes. */
export function calculateOrderProgress(expected: number, receipts: readonly number[]) {
  if (!Number.isSafeInteger(expected) || expected < 0) {
    throw new Error("Quantidade prevista inválida.");
  }
  let received = 0;
  for (const quantity of receipts) {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error("Quantidade recebida inválida.");
    }
    received += quantity;
    if (!Number.isSafeInteger(received)) throw new Error("Quantidade recebida fora do limite.");
  }
  return { expected, received, remaining: expected - received };
}
