"use client";
import type {ModelMetrics} from "@/lib/production/dashboard-metrics";
import {SearchSelect} from "../ui/search-select";
export function ModelSelect({models,value,onChange}:{models:ModelMetrics[];value:string;onChange:(id:string)=>void}){
 return <SearchSelect options={models} value={value} onChange={onChange} label="Modelo de Bolsa" emptyLabel="Todos os modelos" allowAll/>;
}
