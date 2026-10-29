-- Prazos por remessa e recolhimentos explicitamente conciliados.
-- Não atribuir datas ou recebimentos antigos por inferência.
alter table public.shipment_kits add column due_on date check(due_on is null or due_on between date '0001-01-01' and date '9999-12-31');
comment on column public.shipment_kits.due_on is 'Data limite atual em dias corridos; registros legados podem permanecer sem prazo.';

create table public.shipment_deadline_events (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 kit_id uuid not null,
 request_key uuid not null,
 previous_due_on date,
 due_on date not null check(due_on between date '0001-01-01' and date '9999-12-31'),
 reason text not null check(length(btrim(reason)) between 1 and 2000),
 event_type text not null check(event_type in ('initial','extension')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(company_id,request_key),
 foreign key(company_id,kit_id) references public.shipment_kits(company_id,id)
);
create index shipment_deadline_events_kit_idx on public.shipment_deadline_events(company_id,kit_id,created_at,id);
create unique index shipment_deadline_initial_idx on public.shipment_deadline_events(company_id,kit_id) where event_type='initial';
create index shipment_deadline_events_author_idx on public.shipment_deadline_events(created_by);
comment on table public.shipment_deadline_events is 'Histórico imutável de prazo inicial e prorrogações justificadas, com autor e idempotência.';

create table public.shipment_receipts (
 company_id uuid not null references public.companies(id),
 operation_id uuid not null,
 kit_id uuid not null,
 primary key(company_id,operation_id),
 foreign key(company_id,operation_id) references public.inventory_operations(company_id,id),
 foreign key(company_id,kit_id) references public.shipment_kits(company_id,id)
);
create index shipment_receipts_kit_idx on public.shipment_receipts(company_id,kit_id);
comment on table public.shipment_receipts is 'Vínculo de recolhimento à remessa escolhida; saldo considera estornos no razão de estoque.';

alter table public.shipment_deadline_events enable row level security;
alter table public.shipment_receipts enable row level security;
revoke all on public.shipment_deadline_events,public.shipment_receipts from public,anon,authenticated;
grant select on public.shipment_deadline_events,public.shipment_receipts to authenticated;
create policy shipment_deadline_events_read on public.shipment_deadline_events for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));
create policy shipment_receipts_read on public.shipment_receipts for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

-- Preservar os corpos validados, retirando sua execução direta da API pública.
alter function public.create_shipment_kit(uuid,uuid,uuid,numeric,jsonb,text) set schema bagsync_private;
alter function bagsync_private.create_shipment_kit(uuid,uuid,uuid,numeric,jsonb,text) rename to create_shipment_kit_v1;
revoke all on function bagsync_private.create_shipment_kit_v1(uuid,uuid,uuid,numeric,jsonb,text) from public,anon,authenticated;
alter function public.register_inventory_operation(uuid,text,uuid,uuid,jsonb,uuid,text) set schema bagsync_private;
alter function bagsync_private.register_inventory_operation(uuid,text,uuid,uuid,jsonb,uuid,text) rename to register_inventory_operation_v1;
revoke all on function bagsync_private.register_inventory_operation_v1(uuid,text,uuid,uuid,jsonb,uuid,text) from public,anon,authenticated;

create function public.create_shipment_kit(
 p_request_key uuid,p_order_id uuid,p_workshop_id uuid,p_bag_quantity numeric,p_items jsonb,p_note text default null,p_due_on date default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; k public.shipment_kits; initial_date date; result_data jsonb;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico']);
 select * into k from public.shipment_kits where company_id=cid and request_key=p_request_key;
 if found then
  select due_on into initial_date from public.shipment_deadline_events where company_id=cid and kit_id=k.id and event_type='initial';
  if initial_date is distinct from p_due_on then raise exception using errcode='22023',message='Chave já usada com outro prazo.';end if;
  return bagsync_private.create_shipment_kit_v1(p_request_key,p_order_id,p_workshop_id,p_bag_quantity,p_items,p_note);
 end if;
 if p_due_on is null or not isfinite(p_due_on) or p_due_on<(now() at time zone 'America/Sao_Paulo')::date then
  raise exception using errcode='22023',message='Informe prazo válido a partir de hoje.';
 end if;
 result_data:=bagsync_private.create_shipment_kit_v1(p_request_key,p_order_id,p_workshop_id,p_bag_quantity,p_items,p_note);
 update public.shipment_kits set due_on=p_due_on where company_id=cid and id=(result_data->>'kit_id')::uuid;
 insert into public.shipment_deadline_events(company_id,kit_id,request_key,due_on,reason,event_type,created_by)
 values(cid,(result_data->>'kit_id')::uuid,p_request_key,p_due_on,'Prazo definido na criação da remessa.','initial',auth.uid());
 return result_data;
end $$;
revoke all on function public.create_shipment_kit(uuid,uuid,uuid,numeric,jsonb,text,date) from public,anon,authenticated;
grant execute on function public.create_shipment_kit(uuid,uuid,uuid,numeric,jsonb,text,date) to authenticated;

create function public.extend_shipment_deadline(p_request_key uuid,p_kit_id uuid,p_due_on date,p_expected_due_on date,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; k public.shipment_kits; e public.shipment_deadline_events;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico']);
 if p_request_key is null or p_kit_id is null or p_due_on is null or not isfinite(p_due_on) or p_reason is null or length(btrim(p_reason)) not between 1 and 2000 then
  raise exception using errcode='22023',message='Informe nova data e justificativa.';
 end if;
 select * into e from public.shipment_deadline_events where company_id=cid and request_key=p_request_key;
 if found then
  if e.event_type<>'extension' or e.kit_id is distinct from p_kit_id or e.previous_due_on is distinct from p_expected_due_on or e.due_on is distinct from p_due_on or e.reason is distinct from btrim(p_reason) then
   raise exception using errcode='22023',message='Chave já usada com outros dados.';
  end if;
  return jsonb_build_object('event_id',e.id);
 end if;
 select * into k from public.shipment_kits where company_id=cid and id=p_kit_id;
 if not found then raise exception using errcode='22023',message='Remessa inválida.';end if;
 if k.due_on is distinct from p_expected_due_on then raise exception using errcode='22023',message='O prazo mudou. Atualize a consulta antes de prorrogar.';end if;
 if p_due_on<(now() at time zone 'America/Sao_Paulo')::date or (k.due_on is not null and p_due_on<=k.due_on) then
  raise exception using errcode='22023',message='A nova data deve ser futura ou hoje e posterior ao prazo atual.';
 end if;
 insert into public.shipment_deadline_events(company_id,kit_id,request_key,previous_due_on,due_on,reason,event_type,created_by)
 values(cid,k.id,p_request_key,k.due_on,p_due_on,btrim(p_reason),'extension',auth.uid()) returning * into e;
 update public.shipment_kits set due_on=p_due_on where company_id=cid and id=k.id;
 return jsonb_build_object('event_id',e.id);
end $$;
revoke all on function public.extend_shipment_deadline(uuid,uuid,date,date,text) from public,anon,authenticated;
grant execute on function public.extend_shipment_deadline(uuid,uuid,date,date,text) to authenticated;

create function public.register_inventory_operation(
 p_request_key uuid,p_kind text,p_order_id uuid default null,p_workshop_id uuid default null,p_items jsonb default '[]'::jsonb,
 p_reversal_of uuid default null,p_note text default null,p_kit_id uuid default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; k public.shipment_kits; existing public.inventory_operations; linked uuid; result_data jsonb; total_received numeric;
begin
 if p_kind is distinct from 'bag_receipt' then
  if p_kit_id is not null then raise exception using errcode='22023',message='Remessa somente no recolhimento de bolsas.';end if;
  return bagsync_private.register_inventory_operation_v1(p_request_key,p_kind,p_order_id,p_workshop_id,p_items,p_reversal_of,p_note);
 end if;
 cid:=bagsync_private.lock_company(array['gerente_logistico','motorista']);
 select * into existing from public.inventory_operations where company_id=cid and request_key=p_request_key;
 if found then
  select kit_id into linked from public.shipment_receipts where company_id=cid and operation_id=existing.id;
  if linked is distinct from p_kit_id then raise exception using errcode='22023',message='Chave já usada para outra remessa.';end if;
  return bagsync_private.register_inventory_operation_v1(p_request_key,p_kind,p_order_id,p_workshop_id,p_items,p_reversal_of,p_note);
 end if;
 select * into k from public.shipment_kits where company_id=cid and id=p_kit_id;
 if not found or k.order_id is distinct from p_order_id or k.workshop_id is distinct from p_workshop_id then
  raise exception using errcode='22023',message='Selecione a remessa do pedido e facção corretos.';
 end if;
 if not exists(select 1 from public.kit_deliveries d where d.company_id=cid and d.kit_id=k.id and not exists(select 1 from public.inventory_operations r where r.company_id=cid and r.reversal_of=d.operation_id)) then
  raise exception using errcode='22023',message='Remessa ainda não possui saída válida de material.';
 end if;
 result_data:=bagsync_private.register_inventory_operation_v1(p_request_key,p_kind,p_order_id,p_workshop_id,p_items,p_reversal_of,p_note);
 insert into public.shipment_receipts(company_id,operation_id,kit_id) values(cid,(result_data->>'operation_id')::uuid,k.id);
 select coalesce(sum(s.quantity),0) into total_received from public.shipment_receipts l
 join public.stock_movements s on s.company_id=l.company_id and s.operation_id=l.operation_id and s.bag_id=k.bag_id
 where l.company_id=cid and l.kit_id=k.id and not exists(select 1 from public.inventory_operations r where r.company_id=cid and r.reversal_of=l.operation_id);
 if total_received>k.bag_quantity then
  result_data:=jsonb_set(result_data,'{warnings}',coalesce(result_data->'warnings','[]'::jsonb)||jsonb_build_array(jsonb_build_object('code','recebimento_excedente_remessa','received',total_received::text,'expected',k.bag_quantity::text)));
  update public.inventory_operations set result=result_data where company_id=cid and id=(result_data->>'operation_id')::uuid;
 end if;
 return result_data;
end $$;
revoke all on function public.register_inventory_operation(uuid,text,uuid,uuid,jsonb,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.register_inventory_operation(uuid,text,uuid,uuid,jsonb,uuid,text,uuid) to authenticated;

create view public.shipment_receipt_progress with(security_invoker=true) as
 with receipts as (
  select l.company_id,l.kit_id,sum(s.quantity) as quantity from public.shipment_receipts l
  join public.stock_movements s on s.company_id=l.company_id and s.operation_id=l.operation_id and s.bag_id is not null
  where not exists(select 1 from public.inventory_operations r where r.company_id=l.company_id and r.reversal_of=l.operation_id)
  group by l.company_id,l.kit_id
 )
 select k.company_id,k.id as kit_id,k.order_id,k.bag_id,k.workshop_id,k.created_at,k.due_on,
 k.bag_quantity::text as bag_quantity,coalesce(r.quantity,0)::text as received_quantity,
 greatest(k.bag_quantity-coalesce(r.quantity,0),0)::text as remaining_quantity,
 greatest(coalesce(r.quantity,0)-k.bag_quantity,0)::text as excess_quantity,d.distributed_at
 from public.shipment_kits k
 join public.production_kit_distribution d on d.company_id=k.company_id and d.kit_id=k.id
 left join receipts r on r.company_id=k.company_id and r.kit_id=k.id;

create view public.production_deadlines with(security_invoker=true) as
 select p.*,b.name as model_name,o.name as order_name,w.name as workshop_name,w.phone,w.city,w.state,
 (p.due_on-(now() at time zone 'America/Sao_Paulo')::date) as days_remaining,
 case when p.due_on is null then 'sem_prazo' when p.due_on<(now() at time zone 'America/Sao_Paulo')::date then 'atrasado'
 when p.due_on<=(now() at time zone 'America/Sao_Paulo')::date+2 then 'a_vencer' else 'no_prazo' end as deadline_status
 from public.shipment_receipt_progress p
 join public.bags b on b.company_id=p.company_id and b.id=p.bag_id
 join public.production_orders o on o.company_id=p.company_id and o.id=p.order_id
 join public.workshops w on w.company_id=p.company_id and w.id=p.workshop_id
 where p.distributed_at is not null and p.remaining_quantity::numeric>0;
revoke all on public.shipment_receipt_progress,public.production_deadlines from public,anon,authenticated;
grant select on public.shipment_receipt_progress,public.production_deadlines to authenticated;
comment on view public.production_deadlines is 'Remessas com saída válida e bolsas ainda a recolher; datas de Brasília e legados sem prazo explícitos.';
notify pgrst,'reload schema';
