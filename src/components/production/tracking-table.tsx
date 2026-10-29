"use client";
import Link from "next/link";
import {useMemo} from "react";
import {createColumnHelper,tableFeatures,useTable} from "@tanstack/react-table";
import {Table,TableHeader,TableHead,TableRow,TableBody,TableCell} from "../ui/table";
import {Icon} from "../ui/icon";
import {Badge} from "../ui/badge";
import {ProductionDetails} from "@/app/painel/producao/production-details";
import {formatQuantity} from "@/lib/operations/validation";
import type {ProductionRow} from "@/lib/production/tracking-types";

export type TrackingTableRow=ProductionRow&{phone:string|null};
const features=tableFeatures({});
const helper=createColumnHelper<typeof features,TrackingTableRow>();
const date=(value:string|null)=>value?new Date(value).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"}):"—";

export function TrackingTable({bag,rows}:{bag:string;rows:TrackingTableRow[]}){
 const columns=useMemo(()=>helper.columns([
  helper.accessor("workshop_name",{header:"Facção / Costureiro",cell:({row})=><div><p className="break-words font-semibold text-slate-900">{row.original.workshop_name}</p><p className="mt-1 break-words text-[11px] text-slate-500">{row.original.phone||"Contato não informado"}</p></div>}),
  helper.accessor("order_name",{header:"Pedido",cell:({row})=><span className="break-words text-xs text-slate-600">{row.original.order_name}</span>}),
  helper.accessor("distributed_quantity",{header:"Distribuídas",cell:({row})=><div className="text-right"><strong className="break-all tabular-nums">{formatQuantity(row.original.distributed_quantity)}</strong>{row.original.unstarted_kit_count!=="0"&&<p className="mt-1 text-[10px] text-slate-500" title="Remessas sem saída válida não entram na quantidade distribuída.">{row.original.unstarted_kit_count} sem saída válida</p>}</div>}),
  helper.accessor("received_quantity",{header:"Recolhidas",cell:({row})=><div className="text-right"><strong className="break-all tabular-nums">{formatQuantity(row.original.received_quantity)}</strong>{row.original.has_excess&&<p className="mt-1 text-[10px] text-amber-900">{formatQuantity(row.original.excess_quantity)} acima do distribuído</p>}</div>}),
  helper.accessor("remaining_quantity",{header:"Pendentes",cell:({row})=>row.original.has_pending?<Badge tone="pending">{formatQuantity(row.original.remaining_quantity)} pendentes</Badge>:<span title="Saldo pendente zerado. Não encerra o pedido nem inclui remessas sem saída válida."><Badge tone="success">Concluído ✓</Badge></span>}),
  helper.display({id:"dates",header:"Distribuição / Recolhimento",cell:({row})=><div className="space-y-1 text-[11px] text-slate-500"><p><span className="mr-1 text-slate-400">Dist.</span><time dateTime={row.original.last_distribution_at??undefined}>{date(row.original.last_distribution_at)}</time></p><p><span className="mr-1 text-slate-400">Recol.</span><time dateTime={row.original.last_receipt_at??undefined}>{date(row.original.last_receipt_at)}</time></p></div>}),
  helper.display({id:"actions",header:()=> <span className="block text-right">Ações</span>,cell:({row})=><div className="flex items-center justify-end gap-2"><ProductionDetails bag={bag} row={row.original}/><Link href={`/painel/entregador/${bag}/${row.original.workshop_id}?pedido=${row.original.order_id}`} className="btn-secondary px-3 text-xs" aria-label={`Ver movimentações: ${row.original.workshop_name} — ${row.original.order_name}`} title="Ver Movimentações"><Icon name="arrow" className="size-4 shrink-0"/><span className="hidden sm:inline">Movimentações</span></Link></div>}),
 ]),[bag]);
 const table=useTable({features,data:rows,columns,getRowId:row=>`${row.order_id}:${row.workshop_id}`});
 const columnClass=(id:string)=>id==="workshop_name"?"sticky left-0 z-10 w-28 min-w-28 bg-white sm:w-40":id==="actions"?"sticky right-0 z-10 w-28 min-w-28 bg-white shadow-[-4px_0_8px_-6px_#64748b] sm:w-64":id==="order_name"?"w-32":id==="dates"?"w-36":id==="remaining_quantity"?"w-32":"w-24 text-right";
 return <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div role="region" aria-label="Acompanhamento de produção; tabela com rolagem horizontal" tabIndex={0} className="max-w-full overflow-x-auto overscroll-x-contain scroll-smooth"><Table className="min-w-[880px] table-fixed"><caption className="sr-only">Distribuições, recolhimentos e saldos por pedido e facção, com datas em Brasília</caption><TableHeader>{table.getHeaderGroups().map(group=><TableRow key={group.id}>{group.headers.map(header=><TableHead key={header.id} className={`${columnClass(header.column.id)} bg-slate-50 px-2 py-2 text-[11px] sm:px-3`}><table.FlexRender header={header}/></TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map(row=><TableRow key={row.id}>{row.getAllCells().map(cell=><TableCell key={cell.id} className={`${columnClass(cell.column.id)} px-2 py-3 text-xs group-hover:bg-slate-50 sm:px-3`}><table.FlexRender cell={cell}/></TableCell>)}</TableRow>)}{!rows.length&&<TableRow><TableCell colSpan={7} className="h-36 text-center text-sm text-slate-500">Nenhum registro para estes filtros.</TableCell></TableRow>}</TableBody></Table></div></div>;
}
