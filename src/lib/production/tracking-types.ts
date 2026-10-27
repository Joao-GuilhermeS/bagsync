import type {Role} from "../auth/authorization";
import type {HistoryKind} from "./tracking-validation";
export type ProductionRow={
 bag_id:string;order_id:string;workshop_id:string;order_name:string;workshop_name:string;
 distributed_quantity:string;received_quantity:string;remaining_quantity:string;excess_quantity:string;
 distribution_count:string;unstarted_kit_count:string;receipt_count:string;note_count:string;
 has_pending:boolean;has_excess:boolean;last_distribution_at:string|null;last_receipt_at:string|null;
};
export type ProductionHistoryRow={id:string;created_at:string;quantity?:string;distributed_at?:string|null;last_delivery_at?:string|null;delivery_count?:string;is_reversed?:boolean;note?:string;created_role?:Role};
export type ProductionHistory={kind:HistoryKind;page:number;count:number;rows:ProductionHistoryRow[]};
