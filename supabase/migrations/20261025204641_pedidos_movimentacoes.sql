
-- Pedidos e lançamentos rastreáveis. Sem exclusão ou alteração direta do histórico.
create schema if not exists bagsync_private;
revoke all on schema bagsync_private from public, anon, authenticated;

create table public.production_orders (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 request_key uuid not null,
 name text not null check (length(btrim(name))>0),
 bag_id uuid not null,
 expected_quantity numeric not null check (expected_quantity>0 and expected_quantity<'Infinity'::numeric and expected_quantity=trunc(expected_quantity)),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(company_id,id),
 unique(company_id,request_key),
 foreign key(company_id,bag_id) references public.bags(company_id,id)
);
create index production_orders_bag_idx on public.production_orders(company_id,bag_id);
create index production_orders_author_idx on public.production_orders(created_by);

create table public.inventory_operations (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 request_key uuid not null,
 kind text not null check(kind in ('material_entry','material_delivery','bag_receipt','reversal')),
 order_id uuid,
 workshop_id uuid,
 reversal_of uuid,
 note text,
 payload jsonb not null,
 result jsonb not null default '{}'::jsonb,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(company_id,id),
 unique(company_id,request_key),
 unique(company_id,reversal_of),
 foreign key(company_id,order_id) references public.production_orders(company_id,id),
 foreign key(company_id,workshop_id) references public.workshops(company_id,id),
 foreign key(company_id,reversal_of) references public.inventory_operations(company_id,id),
 check ((kind='reversal')=(reversal_of is not null)),
 check (kind not in ('material_delivery','bag_receipt') or (order_id is not null and workshop_id is not null))
);
create index inventory_operations_order_idx on public.inventory_operations(company_id,order_id);
create index inventory_operations_workshop_idx on public.inventory_operations(company_id,workshop_id);
create index inventory_operations_author_idx on public.inventory_operations(created_by);

alter table public.materials add constraint materials_unit_reference unique(company_id,id,unit_id);
create table public.stock_movements (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 operation_id uuid not null,
 material_id uuid,
 bag_id uuid,
 unit_id uuid,
 quantity numeric not null check(quantity<>0 and abs(quantity)<'Infinity'::numeric),
 created_at timestamptz not null default now(),
 foreign key(company_id,operation_id) references public.inventory_operations(company_id,id),
 foreign key(company_id,material_id,unit_id) references public.materials(company_id,id,unit_id),
 foreign key(company_id,bag_id) references public.bags(company_id,id),
 check ((material_id is not null and unit_id is not null and bag_id is null) or (bag_id is not null and material_id is null and unit_id is null)),
 check (bag_id is null or quantity=trunc(quantity)),
 unique(company_id,operation_id,material_id),
 unique(company_id,operation_id,bag_id)
);
create index stock_movements_material_idx on public.stock_movements(company_id,material_id,unit_id);
create index stock_movements_bag_idx on public.stock_movements(company_id,bag_id);

-- Helper interno: identidade atual e serialização das gravações por empresa.
create function bagsync_private.lock_company(p_roles text[]) returns uuid
language plpgsql security invoker set search_path='' as $$
declare cid uuid;
begin
 select company_id into cid from public.company_users where user_id=auth.uid() and role=any(p_roles);
 if cid is null then raise exception using errcode='42501',message='Acesso não autorizado.'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(cid::text,0));
 return cid;
end $$;
revoke all on function bagsync_private.lock_company(text[]) from public,anon,authenticated;

create function public.create_production_order(p_request_key uuid,p_name text,p_bag_id uuid,p_expected_quantity numeric)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; existing public.production_orders; result_id uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico']);
 if p_request_key is null or p_name is null or length(btrim(p_name))=0 or p_bag_id is null or p_expected_quantity is null then
  raise exception using errcode='22023',message='Dados obrigatórios do pedido ausentes.';
 end if;
 select * into existing from public.production_orders where company_id=cid and request_key=p_request_key;
 if found then
  if existing.name is distinct from btrim(p_name) or existing.bag_id is distinct from p_bag_id or existing.expected_quantity is distinct from p_expected_quantity then
   raise exception using errcode='22023',message='Chave já usada para outro pedido.';
  end if;
  return jsonb_build_object('order_id',existing.id);
 end if;
 insert into public.production_orders(company_id,request_key,name,bag_id,expected_quantity,created_by)
 values(cid,p_request_key,btrim(p_name),p_bag_id,p_expected_quantity,auth.uid()) returning id into result_id;
 return jsonb_build_object('order_id',result_id);
end $$;

create function public.register_inventory_operation(
 p_request_key uuid,p_kind text,p_order_id uuid default null,p_workshop_id uuid default null,
 p_items jsonb default '[]'::jsonb,p_reversal_of uuid default null,p_note text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 cid uuid; op_id uuid; original public.inventory_operations; existing public.inventory_operations;
 requested jsonb; item jsonb; q numeric; mid uuid; uid uuid; bid uuid; oid uuid; wid uuid;
 warnings jsonb:='[]'::jsonb; result_data jsonb; bal record; received numeric; expected numeric;
begin
 if p_kind is null or p_kind not in ('material_entry','material_delivery','bag_receipt','reversal') then
  raise exception using errcode='22023',message='Tipo de operação inválido.';
 end if;
 cid:=bagsync_private.lock_company(case when p_kind in ('material_entry','reversal') then array['gerente_logistico'] else array['gerente_logistico','motorista'] end);
 if p_request_key is null or p_items is null or jsonb_typeof(p_items)<>'array' then
  raise exception using errcode='22023',message='Chave e itens válidos são obrigatórios.';
 end if;
 requested:=jsonb_build_object('kind',p_kind,'order',p_order_id,'workshop',p_workshop_id,'items',p_items,'reversal',p_reversal_of,'note',p_note);
 select * into existing from public.inventory_operations where company_id=cid and request_key=p_request_key;
 if found then
  if existing.payload is distinct from requested then raise exception using errcode='22023',message='Chave já usada com outros dados.'; end if;
  return existing.result;
 end if;
 if p_kind='reversal' then
  if p_reversal_of is null or p_order_id is not null or p_workshop_id is not null or jsonb_array_length(p_items)<>0 then
   raise exception using errcode='22023',message='Estorno exige somente a referência original e observação opcional.';
  end if;
  select * into original from public.inventory_operations where company_id=cid and id=p_reversal_of;
  if not found or original.kind='reversal' then raise exception using errcode='22023',message='Operação original inválida.'; end if;
  oid:=original.order_id; wid:=original.workshop_id;
 else
  if p_reversal_of is not null or jsonb_array_length(p_items)=0 then raise exception using errcode='22023',message='Itens obrigatórios ou referência incompatível.'; end if;
  oid:=p_order_id; wid:=p_workshop_id;
  if p_kind='material_entry' and (oid is not null or wid is not null) then raise exception using errcode='22023',message='Entrada de material não pertence a facção/pedido.'; end if;
  if p_kind in ('material_delivery','bag_receipt') then
   if oid is null or wid is null then raise exception using errcode='22023',message='Pedido e facção obrigatórios.'; end if;
   select bag_id into bid from public.production_orders where company_id=cid and id=oid;
   if not found then raise exception using errcode='22023',message='Pedido inválido.'; end if;
  end if;
 end if;
 insert into public.inventory_operations(company_id,request_key,kind,order_id,workshop_id,reversal_of,note,payload,created_by)
 values(cid,p_request_key,p_kind,oid,wid,p_reversal_of,p_note,requested,auth.uid()) returning id into op_id;
 if p_kind='reversal' then
  insert into public.stock_movements(company_id,operation_id,material_id,bag_id,unit_id,quantity)
  select cid,op_id,material_id,bag_id,unit_id,-quantity from public.stock_movements where company_id=cid and operation_id=p_reversal_of;
 elsif p_kind='bag_receipt' then
  if jsonb_array_length(p_items)<>1 then raise exception using errcode='22023',message='Recebimento exige uma quantidade de bolsas.'; end if;
  item:=p_items->0;
  if jsonb_typeof(item)<>'object' or (item-'quantity')<>'{}'::jsonb then raise exception using errcode='22023',message='Item inválido.'; end if;
  q:=(item->>'quantity')::numeric;
  if q is null or q<=0 or q>='Infinity'::numeric or q<>trunc(q) then raise exception using errcode='22023',message='Quantidade de bolsas inválida.'; end if;
  insert into public.stock_movements(company_id,operation_id,bag_id,quantity) values(cid,op_id,bid,q);
 else
  for item in select value from jsonb_array_elements(p_items) loop
   if jsonb_typeof(item)<>'object' or (item-array['material_id','quantity'])<>'{}'::jsonb then raise exception using errcode='22023',message='Item de material inválido.'; end if;
   mid:=(item->>'material_id')::uuid; q:=(item->>'quantity')::numeric;
   if mid is null or q is null or q<=0 or q>='Infinity'::numeric then raise exception using errcode='22023',message='Material/quantidade inválidos.'; end if;
   select unit_id into uid from public.materials where company_id=cid and id=mid;
   if not found then raise exception using errcode='22023',message='Material inválido.'; end if;
   insert into public.stock_movements(company_id,operation_id,material_id,unit_id,quantity)
   values(cid,op_id,mid,uid,case when p_kind='material_delivery' then -q else q end);
  end loop;
 end if;
 for bal in
  select s.material_id,s.bag_id,sum(s.quantity) as balance from public.stock_movements s
  where s.company_id=cid and exists(select 1 from public.stock_movements touched where touched.operation_id=op_id and touched.company_id=cid and (touched.material_id=s.material_id or touched.bag_id=s.bag_id))
  group by s.material_id,s.bag_id having sum(s.quantity)<0
 loop
  warnings:=warnings||jsonb_build_array(jsonb_build_object('code','saldo_negativo','material_id',bal.material_id,'bag_id',bal.bag_id,'balance',bal.balance::text));
 end loop;
 if oid is not null then
  select expected_quantity into expected from public.production_orders where company_id=cid and id=oid;
  select coalesce(sum(s.quantity),0) into received from public.stock_movements s join public.inventory_operations o on o.company_id=s.company_id and o.id=s.operation_id where o.company_id=cid and o.order_id=oid and s.bag_id is not null;
  if received>expected then warnings:=warnings||jsonb_build_array(jsonb_build_object('code','recebimento_excedente','received',received::text,'expected',expected::text)); end if;
 end if;
 result_data:=jsonb_build_object('operation_id',op_id,'warnings',warnings);
 update public.inventory_operations set result=result_data where id=op_id and company_id=cid;
 return result_data;
end $$;
revoke all on function public.create_production_order(uuid,text,uuid,numeric) from public,anon,authenticated;
revoke all on function public.register_inventory_operation(uuid,text,uuid,uuid,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.create_production_order(uuid,text,uuid,numeric) to authenticated;
grant execute on function public.register_inventory_operation(uuid,text,uuid,uuid,jsonb,uuid,text) to authenticated;

alter table public.production_orders enable row level security;
revoke all on public.production_orders from public,anon,authenticated;
grant select on public.production_orders to authenticated;
create policy production_orders_read on public.production_orders for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

alter table public.inventory_operations enable row level security;
revoke all on public.inventory_operations from public,anon,authenticated;
grant select on public.inventory_operations to authenticated;
create policy inventory_operations_read on public.inventory_operations for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

alter table public.stock_movements enable row level security;
revoke all on public.stock_movements from public,anon,authenticated;
grant select on public.stock_movements to authenticated;
create policy stock_movements_read on public.stock_movements for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

comment on table public.production_orders is 'Pedido de um modelo de bolsa. Recebimentos de várias facções abatem a quantidade prevista.';
comment on table public.inventory_operations is 'Histórico de operações e estornos, com chave de idempotência por empresa e resposta original preservada.';
comment on table public.stock_movements is 'Razão de estoque assinado. Quantidades positivas entram e negativas saem; correção exclusivamente por estorno.';

-- Consultas respeitam RLS das tabelas base.
create view public.material_stock_balances with (security_invoker=true) as
 select m.company_id,m.id as material_id,m.unit_id,coalesce(sum(s.quantity),0) as balance,
 coalesce(sum(s.quantity),0)<0 as negative_balance
 from public.materials m left join public.stock_movements s on s.company_id=m.company_id and s.material_id=m.id
 group by m.company_id,m.id,m.unit_id;
create view public.bag_stock_balances with (security_invoker=true) as
 select b.company_id,b.id as bag_id,coalesce(sum(s.quantity),0) as balance,
 coalesce(sum(s.quantity),0)<0 as negative_balance
 from public.bags b left join public.stock_movements s on s.company_id=b.company_id and s.bag_id=b.id
 group by b.company_id,b.id;
create view public.production_order_progress with (security_invoker=true) as
 select o.company_id,o.id as order_id,o.bag_id,o.expected_quantity,
 coalesce(sum(s.quantity),0) as received_quantity,
 o.expected_quantity-coalesce(sum(s.quantity),0) as remaining_quantity,
 coalesce(sum(s.quantity),0)>o.expected_quantity as excess_receipt
 from public.production_orders o
 left join public.inventory_operations e on e.company_id=o.company_id and e.order_id=o.id
 left join public.stock_movements s on s.company_id=e.company_id and s.operation_id=e.id and s.bag_id=o.bag_id
 group by o.company_id,o.id,o.bag_id,o.expected_quantity;
revoke all on public.material_stock_balances,public.bag_stock_balances,public.production_order_progress from public,anon,authenticated;
grant select on public.material_stock_balances,public.bag_stock_balances,public.production_order_progress to authenticated;
