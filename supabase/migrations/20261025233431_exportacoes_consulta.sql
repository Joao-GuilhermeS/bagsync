
-- Relatório somente leitura, em um único snapshot e sob as políticas do chamador.
create index inventory_operations_created_idx on public.inventory_operations(company_id,created_at,id);
create function public.export_inventory_operations(
 p_since timestamptz default null,p_until timestamptz default null,
 p_order uuid default null,p_workshop uuid default null,p_operation uuid default null
) returns jsonb language sql stable security invoker set search_path='' as $$
 with selected as materialized (
  select o.* from public.inventory_operations o
  where o.company_id in(select company_id from public.company_users where user_id=(select auth.uid()))
   and (p_since is null or o.created_at>=p_since) and (p_until is null or o.created_at<p_until)
   and (p_order is null or o.order_id=p_order) and (p_workshop is null or o.workshop_id=p_workshop)
   and (p_operation is null or o.id=p_operation)
  order by o.created_at,o.id limit 10001
 ), lines as materialized (
  select s.id,s.operation_id,coalesce(m.name,b.name) as name,coalesce(u.symbol,'un') as unit,s.quantity::text as quantity
  from public.stock_movements s join selected o on o.company_id=s.company_id and o.id=s.operation_id
  left join public.materials m on m.company_id=s.company_id and m.id=s.material_id
  left join public.measurement_units u on u.company_id=m.company_id and u.id=m.unit_id
  left join public.bags b on b.company_id=s.company_id and b.id=s.bag_id
  order by s.id limit 50001
 ), grouped as (
  select operation_id,jsonb_agg(jsonb_build_object('name',name,'unit',unit,'quantity',quantity) order by id) as items
  from lines group by operation_id
 ), report as (
  select o.created_at,o.id,jsonb_build_object(
   'id',o.id,'company',c.name,'kind',o.kind,'created_at',o.created_at,
   'order_id',o.order_id,'order_name',p.name,'workshop_id',o.workshop_id,'workshop_name',w.name,
   'reversal_of',o.reversal_of,'is_reversed',exists(select 1 from public.inventory_operations r where r.company_id=o.company_id and r.reversal_of=o.id),
   'note',o.note,'warnings',coalesce(o.result->'warnings','[]'::jsonb),'items',coalesce(g.items,'[]'::jsonb)
  ) as data
  from selected o join public.companies c on c.id=o.company_id
  left join public.production_orders p on p.company_id=o.company_id and p.id=o.order_id
  left join public.workshops w on w.company_id=o.company_id and w.id=o.workshop_id
  left join grouped g on g.operation_id=o.id
 )
 select case when (select count(*) from selected)>10000 or (select count(*) from lines)>50000
 then jsonb_build_object('too_large',true,'operations','[]'::jsonb)
 else jsonb_build_object('too_large',false,'operations',coalesce((select jsonb_agg(data order by created_at,id) from report),'[]'::jsonb)) end;
$$;
revoke all on function public.export_inventory_operations(timestamptz,timestamptz,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.export_inventory_operations(timestamptz,timestamptz,uuid,uuid,uuid) to authenticated;
comment on function public.export_inventory_operations(timestamptz,timestamptz,uuid,uuid,uuid) is 'Exportação somente leitura sob RLS, com quantidades textuais. Não retorna resultado parcial acima de 10 mil operações ou 50 mil itens.';
