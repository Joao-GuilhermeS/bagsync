export type StockRow={id:string;name:string;unit:string;balance:string};
export function compareBalances(a:string,b:string):number {
  const decimals=Math.max(a.split(".")[1]?.length??0,b.split(".")[1]?.length??0);
  const scaled=(value:string)=>{const [whole,fraction=""]=value.replace(/^-/,"").split(".");const amount=BigInt(whole+fraction.padEnd(decimals,"0"));return value.startsWith("-")?-amount:amount;};
  const left=scaled(a),right=scaled(b);return left<right?-1:left>right?1:0;
}
export function balanceStatus(value:string):"positivo"|"negativo"|"zero" {
  const comparison=compareBalances(value,"0");return comparison<0?"negativo":comparison>0?"positivo":"zero";
}
export const compareStockNames=(a:StockRow,b:StockRow)=>a.name.localeCompare(b.name,"pt-BR",{sensitivity:"base",numeric:true})||a.id.localeCompare(b.id);
