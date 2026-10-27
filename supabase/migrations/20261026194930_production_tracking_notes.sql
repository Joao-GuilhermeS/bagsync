-- Acompanhamento por pedido/facção. Município é o nome do modelo, sem nova entidade.
create table public.production_notes (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 order_id uuid not null,
 workshop_id uuid not null,
 request_key uuid not null,
 note text not null check(length(btrim(note))>0),
 created_by uuid not null references auth.users(id),
 created_role text not null check(created_role in ('gerente_logistico','motorista','gestor')),
 created_at timestamptz not null default now(),
 unique(company_id,request_key),
 foreign key(company_id,order_id) references public.production_orders(company_id,id),
 foreign key(company_id,workshop_id) references public.workshops(company_id,id)
);
create index production_notes_context_idx on public.production_notes(company_id,order_id,workshop_id);
create index production_notes_workshop_idx on public.production_notes(company_id,workshop_id);
create index production_notes_author_idx on public.production_notes(created_by);
alter table public.production_notes enable row level security;
revoke all on public.production_notes from public,anon,authenticated;
grant select on public.production_notes to authenticated;
create policy production_notes_read on public.production_notes for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

create function public.add_production_note(p_request_key uuid,p_order_id uuid,p_workshop_id uuid,p_note text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; author_role text; existing public.production_notes; nid uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico','motorista','gestor']);
 if p_request_key is null or p_note is null or length(btrim(p_note))=0 then
  raise exception using errcode='22023',message='Informe a chave e a observação.';
 end if;
 select * into existing from public.production_notes where company_id=cid and request_key=p_request_key;
 if found then
  if existing.order_id is distinct from p_order_id or existing.workshop_id is distinct from p_workshop_id or existing.note is distinct from btrim(p_note) then
   raise exception using errcode='22023',message='Chave já usada com outra observação.';
  end if;
  return jsonb_build_object('note_id',existing.id);
 end if;
 select role into author_role from public.company_users where user_id=auth.uid() and company_id=cid;
 insert into public.production_notes(company_id,order_id,workshop_id,request_key,note,created_by,created_role)
 values(cid,p_order_id,p_workshop_id,p_request_key,btrim(p_note),auth.uid(),author_role) returning id into nid;
 return jsonb_build_object('note_id',nid);
end $$;
revoke all on function public.add_production_note(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.add_production_note(uuid,uuid,uuid,text) to authenticated;

create view public.production_kit_distribution with(security_invoker=true) as
 with deliveries as (
  select d.company_id,d.kit_id,min(o.created_at) as distributed_at,max(o.created_at) as last_delivery_at,count(*) as delivery_count
  from public.kit_deliveries d
  join public.inventory_operations o on o.company_id=d.company_id and o.id=d.operation_id
  left join public.inventory_operations r on r.company_id=o.company_id and r.reversal_of=o.id
  where r.id is null
  group by d.company_id,d.kit_id
 )
 select k.company_id,k.id as kit_id,k.order_id,k.workshop_id,k.bag_id,k.bag_quantity,k.created_at,
 d.distributed_at,d.last_delivery_at,coalesce(d.delivery_count,0) as delivery_count
 from public.shipment_kits k left join deliveries d on d.company_id=k.company_id and d.kit_id=k.id;

create view public.production_tracking with(security_invoker=true) as
 with distributions as (
  select company_id,order_id,workshop_id,
   coalesce(sum(bag_quantity) filter(where distributed_at is not null),0) as distributed_quantity,
   count(*) filter(where distributed_at is not null) as distribution_count,
   count(*) filter(where distributed_at is null) as unstarted_kit_count,
   min(distributed_at) as first_distribution_at,max(distributed_at) as last_distribution_at
  from public.production_kit_distribution group by company_id,order_id,workshop_id
 ), receipts as (
  select o.company_id,o.order_id,o.workshop_id,sum(s.quantity) as received_quantity,
   min(o.created_at) as first_receipt_at,max(o.created_at) as last_receipt_at,count(*) as receipt_count
  from public.inventory_operations o
  join public.stock_movements s on s.company_id=o.company_id and s.operation_id=o.id
  join public.production_orders p on p.company_id=o.company_id and p.id=o.order_id and p.bag_id=s.bag_id
  left join public.inventory_operations r on r.company_id=o.company_id and r.reversal_of=o.id
  where o.kind='bag_receipt' and r.id is null
  group by o.company_id,o.order_id,o.workshop_id
 ), notes as (
  select company_id,order_id,workshop_id,count(*) as note_count,max(created_at) as last_note_at
  from public.production_notes group by company_id,order_id,workshop_id
 ), contexts as (
  select company_id,order_id,workshop_id from public.shipment_kits
  union select company_id,order_id,workshop_id from public.inventory_operations where kind='bag_receipt'
  union select company_id,order_id,workshop_id from public.production_notes
 )
 select c.company_id,p.bag_id,c.order_id,c.workshop_id,p.name as order_name,w.name as workshop_name,
  coalesce(d.distributed_quantity,0)::text as distributed_quantity,
  coalesce(r.received_quantity,0)::text as received_quantity,
  greatest(coalesce(d.distributed_quantity,0)-coalesce(r.received_quantity,0),0)::text as remaining_quantity,
  greatest(coalesce(r.received_quantity,0)-coalesce(d.distributed_quantity,0),0)::text as excess_quantity,
  coalesce(d.distributed_quantity,0)>coalesce(r.received_quantity,0) as has_pending,
  coalesce(r.received_quantity,0)>coalesce(d.distributed_quantity,0) as has_excess,
  coalesce(d.distribution_count,0)::text as distribution_count,coalesce(d.unstarted_kit_count,0)::text as unstarted_kit_count,
  coalesce(r.receipt_count,0)::text as receipt_count,coalesce(n.note_count,0)::text as note_count,
  d.first_distribution_at,d.last_distribution_at,r.first_receipt_at,r.last_receipt_at,n.last_note_at
 from contexts c
 join public.production_orders p on p.company_id=c.company_id and p.id=c.order_id
 join public.workshops w on w.company_id=c.company_id and w.id=c.workshop_id
 left join distributions d on d.company_id=c.company_id and d.order_id=c.order_id and d.workshop_id=c.workshop_id
 left join receipts r on r.company_id=c.company_id and r.order_id=c.order_id and r.workshop_id=c.workshop_id
 left join notes n on n.company_id=c.company_id and n.order_id=c.order_id and n.workshop_id=c.workshop_id;
revoke all on public.production_kit_distribution,public.production_tracking from public,anon,authenticated;
grant select on public.production_kit_distribution,public.production_tracking to authenticated;

create function public.production_tracking_history(p_bag_id uuid,p_order_id uuid,p_workshop_id uuid,p_kind text,p_page integer default 1)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare cid uuid; total bigint; rows_data jsonb; start_at integer;
begin
 if p_kind not in ('distributions','receipts','notes') or p_kind is null or p_page is null or p_page<1 or p_page>1000000 then
  raise exception using errcode='22023',message='Consulta inválida.';
 end if;
 select company_id into cid from public.production_orders where id=p_order_id and bag_id=p_bag_id;
 if cid is null or not exists(select 1 from public.workshops where company_id=cid and id=p_workshop_id) then
  return jsonb_build_object('found',false);
 end if;
 start_at:=(p_page-1)*25;
 if p_kind='distributions' then
  select count(*) into total from public.production_kit_distribution where company_id=cid and order_id=p_order_id and workshop_id=p_workshop_id;
  select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into rows_data from (
   select kit_id as id,bag_quantity::text as quantity,created_at,distributed_at,last_delivery_at,delivery_count::text
   from public.production_kit_distribution where company_id=cid and order_id=p_order_id and workshop_id=p_workshop_id
   order by created_at desc,kit_id limit 25 offset start_at
  ) t;
 elsif p_kind='receipts' then
  select count(*) into total from public.inventory_operations o join public.stock_movements s on s.company_id=o.company_id and s.operation_id=o.id and s.bag_id=p_bag_id
   where o.company_id=cid and o.order_id=p_order_id and o.workshop_id=p_workshop_id and o.kind='bag_receipt';
  select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into rows_data from (
   select o.id,o.created_at,o.note,s.quantity::text as quantity,(r.id is not null) as is_reversed
   from public.inventory_operations o join public.stock_movements s on s.company_id=o.company_id and s.operation_id=o.id and s.bag_id=p_bag_id
   left join public.inventory_operations r on r.company_id=o.company_id and r.reversal_of=o.id
   where o.company_id=cid and o.order_id=p_order_id and o.workshop_id=p_workshop_id and o.kind='bag_receipt'
   order by o.created_at desc,o.id limit 25 offset start_at
  ) t;
 else
  select count(*) into total from public.production_notes where company_id=cid and order_id=p_order_id and workshop_id=p_workshop_id;
  select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into rows_data from (
   select id,note,created_at,created_role from public.production_notes where company_id=cid and order_id=p_order_id and workshop_id=p_workshop_id
   order by created_at desc,id limit 25 offset start_at
  ) t;
 end if;
 return jsonb_build_object('found',true,'kind',p_kind,'page',p_page,'count',total,'rows',rows_data);
end $$;
revoke all on function public.production_tracking_history(uuid,uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.production_tracking_history(uuid,uuid,uuid,text,integer) to authenticated;
comment on view public.production_tracking is 'Uma linha por pedido/facção. Bolsas distribuídas contadas uma vez por remessa com envio válido; complementos não duplicam a produção.';
comment on table public.production_notes is 'Observações imutáveis de produção pelos três perfis. Não concede alteração de estoque ao Gestor.';
