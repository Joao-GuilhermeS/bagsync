/** Soma lançamentos assinados de bolsas, incluindo estornos, sem perda de precisão. */
export function sumBagMovements(quantities:readonly string[]):string {
 let total=BigInt(0);
 for(const value of quantities){
  if(!/^-?\d+(?:\.0+)?$/.test(value))throw new Error("Quantidade de bolsas inválida.");
  total+=BigInt(value.split(".")[0]);
 }
 return total.toString();
}
