export function businessDate(now:Date):string {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const part=(type:string)=>parts.find(item=>item.type===type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function validDate(value:unknown):value is string {
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<"0001-01-01")return false;
  const date=new Date(`${value}T12:00:00Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function addDays(date:string,days:number):string {
  if(!validDate(date)||!Number.isInteger(days))throw new Error("Data ou quantidade de dias inválida.");
  const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);
}
export type DeadlineStatus="no_prazo"|"a_vencer"|"atrasado"|"sem_prazo";
export function deadlineState(due:string|null,today:string):{status:DeadlineStatus;days:number|null;label:string} {
  if(!due)return {status:"sem_prazo",days:null,label:"Sem prazo"};
  if(!validDate(due)||!validDate(today))throw new Error("Data inválida.");
  const days=Math.round((Date.parse(`${due}T12:00:00Z`)-Date.parse(`${today}T12:00:00Z`))/86400000);
  return {status:days<0?"atrasado":days<=2?"a_vencer":"no_prazo",days,label:days<0?`Atrasado há ${-days} dia(s)`:days===0?"Vence hoje":days===1?"Vence amanhã":`Faltam ${days} dias`};
}
