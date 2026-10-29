import type {ComponentProps} from "react";

// Primitivas locais do padrão Table do shadcn/ui, adaptadas aos tokens do BagSync.
export function Table({className="",...props}:ComponentProps<"table">){return <table data-slot="table" className={`w-full caption-bottom text-sm ${className}`} {...props}/>;}
export function TableHeader({className="",...props}:ComponentProps<"thead">){return <thead data-slot="table-header" className={`border-b bg-slate-50 ${className}`} {...props}/>;}
export function TableBody({className="",...props}:ComponentProps<"tbody">){return <tbody data-slot="table-body" className={`divide-y ${className}`} {...props}/>;}
export function TableRow({className="",...props}:ComponentProps<"tr">){return <tr data-slot="table-row" className={`group transition-colors hover:bg-slate-50 ${className}`} {...props}/>;}
export function TableHead({className="",...props}:ComponentProps<"th">){return <th data-slot="table-head" scope="col" className={`px-4 py-3 text-left text-xs font-medium text-slate-500 ${className}`} {...props}/>;}
export function TableCell({className="",...props}:ComponentProps<"td">){return <td data-slot="table-cell" className={`px-4 py-4 align-middle ${className}`} {...props}/>;}
