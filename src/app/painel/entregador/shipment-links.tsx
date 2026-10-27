import type {SupabaseClient} from "@supabase/supabase-js";
import {DispatchList} from "../entregas/dispatch-list";
export async function DriverShipmentLinks({client,company,order,workshop}:{client:SupabaseClient;company:string;order:string;workshop:string;manager?:boolean}) {
 return <section><h2 className="font-semibold">Materiais a entregar</h2><p className="my-3 text-sm text-slate-600">Confirme a entrega de um romaneio já emitido pela Expedição. Não é necessário preencher a saída nem baixar estoque novamente.</p><DispatchList client={client} company={company} order={order} workshop={workshop} canConfirm preview/></section>;
}
