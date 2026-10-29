"use client";

import {useId,useMemo,useState} from "react";
import Link from "next/link";
import {createColumnHelper,useTable,type SortingState} from "@tanstack/react-table";
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from "../ui/table";
import {Badge} from "../ui/badge";
import {FormDrawer} from "../ui/drawer";
import {TransactionForm} from "@/app/painel/operacoes/transaction-form";
import {formatQuantity} from "@/lib/operations/validation";
import type {OperationOptions} from "@/lib/operations/types";
import {matchingNames} from "@/lib/catalogs/search";
import {balanceStatus,compareBalances,compareStockNames,type StockRow} from "@/lib/stock/table";
import {stockFeatures,type StockFeatures} from "./data-table-features";

const helper=createColumnHelper<StockFeatures,StockRow>();

function StockActions({item,material,options,canEnter,requestKey}:{requestKey:string;item:StockRow;material:boolean;options:OperationOptions;canEnter:boolean}) {

  return <div className="flex items-center justify-end gap-2">
    {canEnter&&<FormDrawer title={`Entrada: ${item.name}`} trigger="+ Entrada" variant="secondary" description={`Informe a quantidade recebida em ${item.unit}.`}><TransactionForm task="operation" kinds={["material_entry"]} options={options} requestKey={requestKey} materialId={item.id}/></FormDrawer>}
    <Link className="btn-secondary size-11 shrink-0 p-0 text-xl" href={`/painel/movimentacoes?${material?"material":"bolsa"}=${item.id}`} aria-label={`Histórico de movimentações: ${item.name}`} title="Ver histórico de movimentações">⋮</Link>
  </div>;
}

export function StockTable({rows,material,canEnter,options,requestKeys}:{requestKeys:Record<string,string>;rows:StockRow[];material:boolean;canEnter:boolean;options:OperationOptions}) {
  const id=useId();const [search,setSearch]=useState("");const [status,setStatus]=useState("todos");
  const [sorting,setSorting]=useState<SortingState>([{id:"name",desc:false}]);
  const data=useMemo(()=>matchingNames(rows,search).filter(row=>status==="todos"||balanceStatus(row.balance)===status),[rows,search,status]);
  const columns=useMemo(()=>helper.columns([
    helper.accessor("name",{header:({column})=><button className="min-h-11 font-semibold text-[#1B3B2B]" onClick={()=>column.toggleSorting(column.getIsSorted()==="asc")}>Material / Item <span aria-hidden="true">{column.getIsSorted()==="desc"?"↓":"↑"}</span></button>,sortFn:(a,b)=>compareStockNames(a.original,b.original),cell:({row})=><span className="block max-w-48 break-words font-semibold text-slate-900">{row.original.name}</span>}),
    helper.accessor("unit",{header:"Unidade de medida",enableSorting:false,cell:({row})=><Badge>{row.original.unit}</Badge>}),
    helper.accessor("balance",{header:({column})=><button className="min-h-11 font-semibold text-[#1B3B2B]" onClick={()=>column.toggleSorting(column.getIsSorted()==="asc")}>Quantidade / Saldo Atual <span aria-hidden="true">{column.getIsSorted()==="desc"?"↓":"↑"}</span></button>,sortFn:(a,b)=>compareBalances(a.original.balance,b.original.balance)||compareStockNames(a.original,b.original),cell:({row})=><span className={`whitespace-nowrap text-base font-semibold tabular-nums ${balanceStatus(row.original.balance)==="negativo"?"text-red-800":"text-slate-900"}`}>{formatQuantity(row.original.balance)}</span>}),
    helper.display({id:"status",header:"Status do saldo",cell:({row})=>{const value=balanceStatus(row.original.balance);return <Badge tone={value==="negativo"?"danger":value==="positivo"?"success":"neutral"}>{value==="negativo"?"Atenção: saldo negativo":value==="positivo"?"Saldo registrado / OK":"Saldo zero"}</Badge>;}}),
    helper.display({id:"actions",header:()=> <span className="block text-right">Ações rápidas</span>,cell:({row})=><StockActions item={row.original} material={material} options={options} canEnter={canEnter} requestKey={requestKeys[row.original.id]}/>}),
  ]),[material,options,canEnter,requestKeys]);
  const table=useTable({features:stockFeatures,data,columns,getRowId:row=>row.id,state:{sorting},onSortingChange:setSorting,initialState:{pagination:{pageIndex:0,pageSize:10}},enableSortingRemoval:false});
  const page=table.state.pagination;const count=data.length;
  return <div className="min-w-0 space-y-4">
    <div className="grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
      <div><label htmlFor={`${id}-search`} className="mb-2 block text-xs font-medium text-slate-600">{material?"Pesquisar material":"Pesquisar modelo"}</label><input id={`${id}-search`} type="search" value={search} onChange={event=>{setSearch(event.target.value);table.setPageIndex(0);}} placeholder={material?"Pesquisar material pelo nome...":"Pesquisar modelo pelo nome..."} className="field-input"/></div>
      <div><label htmlFor={`${id}-status`} className="mb-2 block text-xs font-medium text-slate-600">Status do saldo</label><select id={`${id}-status`} value={status} onChange={event=>{setStatus(event.target.value);table.setPageIndex(0);}} className="field-input"><option value="todos">Todos</option><option value="positivo">Saldo Positivo</option><option value="negativo">Saldo Negativo</option></select></div>
    </div>
    <p className="text-xs text-slate-500">Quantidades na unidade de cada item. Unidades diferentes não são somadas.</p>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div role="region" aria-label="Tabela de estoque com rolagem horizontal" tabIndex={0} className="max-w-full overflow-x-auto overscroll-x-contain">
        <Table className="min-w-[820px]"><caption className="sr-only">Estoque da empresa, ordenável por nome ou saldo</caption><TableHeader>{table.getHeaderGroups().map(group=><TableRow key={group.id}>{group.headers.map(header=><TableHead key={header.id} aria-sort={header.column.getIsSorted()==="asc"?"ascending":header.column.getIsSorted()==="desc"?"descending":undefined} className={header.column.id==="name"?"sticky left-0 z-20 w-52 min-w-40 bg-slate-50":"whitespace-nowrap"}><table.FlexRender header={header}/></TableHead>)}</TableRow>)}</TableHeader>
          <TableBody>{table.getRowModel().rows.map(row=><TableRow key={row.id}>{row.getAllCells().map(cell=><TableCell key={cell.id} className={cell.column.id==="name"?"sticky left-0 z-10 bg-white group-hover:bg-slate-50":""}><table.FlexRender cell={cell}/></TableCell>)}</TableRow>)}{!count&&<TableRow><TableCell colSpan={5} className="h-40 text-center text-slate-500">{rows.length?"Nenhum resultado encontrado. Revise a busca ou o status.":"Nenhum item cadastrado."}</TableCell></TableRow>}</TableBody>
        </Table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t p-4"><p role="status" className="text-xs text-slate-500">Exibindo {count?page.pageIndex*page.pageSize+1:0}–{Math.min((page.pageIndex+1)*page.pageSize,count)} de {count} {material?"materiais":"modelos"}</p><div className="flex gap-2"><button type="button" className="btn-secondary" disabled={!table.getCanPreviousPage()} onClick={()=>table.previousPage()}>Anterior</button><button type="button" className="btn-secondary" disabled={!table.getCanNextPage()} onClick={()=>table.nextPage()}>Próxima</button></div></footer>
    </div>
  </div>;
}
