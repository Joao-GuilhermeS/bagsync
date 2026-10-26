export type ExportItem={name:string;unit:string;quantity:string};
export type ExportOperation={id:string;company:string;kind:string;created_at:string;order_id:string|null;order_name:string|null;workshop_id:string|null;workshop_name:string|null;reversal_of:string|null;is_reversed:boolean;note:string|null;warnings:Record<string,unknown>[];items:ExportItem[]};
export type ExportResult={too_large:boolean;operations:ExportOperation[]};
