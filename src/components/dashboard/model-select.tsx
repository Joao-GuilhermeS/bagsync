"use client";
import type {ModelMetrics} from "@/lib/production/dashboard-metrics";
import {SearchSelect} from "../ui/search-select";
export function ModelSelect({models,value,onChange,compact=false}:{models:ModelMetrics[];value:string;onChange:(id:string)=>void;compact?:boolean}){
 return <SearchSelect options={models} value={value} onChange={onChange} label="Modelo de Bolsa" emptyLabel="Todos os modelos" allowAll compact={compact}/>;
}
