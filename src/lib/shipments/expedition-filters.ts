import type {ExpeditionCardData} from "./expedition-list";
export type ExpeditionFilter="todos"|"pendentes"|"transito"|"incompletos"|"entregues";
export const incompleteKit=(card:Pick<ExpeditionCardData,"itemCount"|"pendingItems"|"kitIncomplete">)=>card.kitIncomplete||card.itemCount==="0"||card.pendingItems!=="0";
export const matchesExpeditionFilter=(card:ExpeditionCardData,filter:ExpeditionFilter)=>filter==="todos"|| (filter==="incompletos"?incompleteKit(card):card.status===filter);
