export type Option={id:string;name:string};
export type OperationOptions={bags:Option[];materials:Option[];workshops:Option[];orders:Option[]};
export type TransactionState={success:boolean;uncertain:boolean;message:string;id?:string;warnings:string[]};
export type Order={id:string;name:string;bag_id:string;expected_quantity:string;created_at:string};
export type Progress={order_id:string;expected_quantity:string;received_quantity:string;remaining_quantity:string;excess_receipt:boolean};
export type Operation={id:string;kind:string;order_id:string|null;workshop_id:string|null;reversal_of:string|null;note:string|null;created_at:string;result:{warnings?:Record<string,unknown>[]}|null};
