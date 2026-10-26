
-- Checklists por modelo e remessas manuais. Nenhum dado da fotografia é cadastrado.
create table public.bag_checklist_items (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 bag_id uuid not null,
 material_id uuid not null,
 label text not null check(length(btrim(label))>0),
 position integer not null default 0 check(position>=0),
 active boolean not null default true,
 unique(company_id,id),
 foreign key(company_id,bag_id) references public.bags(company_id,id),
 foreign key(company_id,material_id) references public.materials(company_id,id)
);
create index bag_checklist_items_bag_idx on public.bag_checklist_items(company_id,bag_id);
create index bag_checklist_items_material_idx on public.bag_checklist_items(company_id,material_id);

alter table public.production_orders add constraint production_orders_bag_reference unique(company_id,id,bag_id);
create table public.shipment_kits (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 request_key uuid not null,
 order_id uuid not null,
 bag_id uuid not null,
 workshop_id uuid not null,
 bag_quantity numeric not null check(bag_quantity>0 and bag_quantity<'Infinity'::numeric and bag_quantity=trunc(bag_quantity)),
 note text,
 payload jsonb not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(company_id,id),
 unique(company_id,request_key),
 foreign key(company_id,order_id,bag_id) references public.production_orders(company_id,id,bag_id),
 foreign key(company_id,workshop_id) references public.workshops(company_id,id)
);
create index shipment_kits_order_idx on public.shipment_kits(company_id,order_id,bag_id);
create index shipment_kits_workshop_idx on public.shipment_kits(company_id,workshop_id);
create index shipment_kits_author_idx on public.shipment_kits(created_by);

create table public.shipment_kit_items (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 kit_id uuid not null,
 template_item_id uuid,
 material_id uuid not null,
 unit_id uuid not null,
 label text not null check(length(btrim(label))>0),
 unit_symbol text not null,
 position integer not null,
 expected_quantity numeric not null check(expected_quantity>0 and expected_quantity<'Infinity'::numeric),
 unique(company_id,id),
 unique(company_id,kit_id,id),
 foreign key(company_id,kit_id) references public.shipment_kits(company_id,id),
 foreign key(company_id,template_item_id) references public.bag_checklist_items(company_id,id) on delete set null(template_item_id),
 foreign key(company_id,material_id,unit_id) references public.materials(company_id,id,unit_id)
);
create index shipment_kit_items_kit_idx on public.shipment_kit_items(company_id,kit_id);
create index shipment_kit_items_template_idx on public.shipment_kit_items(company_id,template_item_id);
create index shipment_kit_items_material_idx on public.shipment_kit_items(company_id,material_id,unit_id);

create table public.kit_deliveries (
 company_id uuid not null references public.companies(id),
 kit_id uuid not null,
 operation_id uuid not null,
 request_key uuid not null,
 payload jsonb not null,
 result jsonb not null,
 primary key(company_id,operation_id),
 unique(company_id,request_key),
 unique(company_id,kit_id,operation_id),
 foreign key(company_id,kit_id) references public.shipment_kits(company_id,id),
 foreign key(company_id,operation_id) references public.inventory_operations(company_id,id)
);
create index kit_deliveries_kit_idx on public.kit_deliveries(company_id,kit_id);

create table public.kit_delivery_items (
 company_id uuid not null references public.companies(id),
 kit_id uuid not null,
 operation_id uuid not null,
 kit_item_id uuid not null,
 quantity numeric not null check(quantity>0 and quantity<'Infinity'::numeric),
 primary key(company_id,operation_id,kit_item_id),
 foreign key(company_id,kit_id,operation_id) references public.kit_deliveries(company_id,kit_id,operation_id),
 foreign key(company_id,kit_id,kit_item_id) references public.shipment_kit_items(company_id,kit_id,id)
);
create index kit_delivery_items_item_idx on public.kit_delivery_items(company_id,kit_id,kit_item_id);

alter table public.bag_checklist_items enable row level security;
revoke all on public.bag_checklist_items from public,anon,authenticated;
grant select on public.bag_checklist_items to authenticated;
create policy bag_checklist_items_read on public.bag_checklist_items for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

alter table public.shipment_kits enable row level security;
revoke all on public.shipment_kits from public,anon,authenticated;
grant select on public.shipment_kits to authenticated;
create policy shipment_kits_read on public.shipment_kits for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

alter table public.shipment_kit_items enable row level security;
revoke all on public.shipment_kit_items from public,anon,authenticated;
grant select on public.shipment_kit_items to authenticated;
create policy shipment_kit_items_read on public.shipment_kit_items for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

alter table public.kit_deliveries enable row level security;
revoke all on public.kit_deliveries from public,anon,authenticated;
grant select on public.kit_deliveries to authenticated;
create policy kit_deliveries_read on public.kit_deliveries for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

alter table public.kit_delivery_items enable row level security;
revoke all on public.kit_delivery_items from public,anon,authenticated;
grant select on public.kit_delivery_items to authenticated;
create policy kit_delivery_items_read on public.kit_delivery_items for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

create policy bag_checklist_items_insert on public.bag_checklist_items for insert to authenticated
 with check(company_id in(select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));

create policy bag_checklist_items_delete on public.bag_checklist_items for delete to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));

grant insert,update,delete on public.bag_checklist_items to authenticated;
create policy bag_checklist_items_update on public.bag_checklist_items for update to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'))
 with check(company_id in(select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));

create view public.shipment_kit_item_progress with(security_invoker=true) as
 select i.company_id,i.kit_id,i.id as kit_item_id,i.material_id,i.unit_id,i.label,i.unit_symbol,i.position,i.expected_quantity,
 coalesce(sum(case when r.id is null then d.quantity else 0 end),0) as sent_quantity,
 greatest(i.expected_quantity-coalesce(sum(case when r.id is null then d.quantity else 0 end),0),0) as remaining_quantity,
 greatest(coalesce(sum(case when r.id is null then d.quantity else 0 end),0)-i.expected_quantity,0) as excess_quantity
 from public.shipment_kit_items i
 left join public.kit_delivery_items d on d.company_id=i.company_id and d.kit_item_id=i.id and d.kit_id=i.kit_id
 left join public.inventory_operations r on r.company_id=d.company_id and r.reversal_of=d.operation_id
 group by i.company_id,i.kit_id,i.id,i.material_id,i.unit_id,i.label,i.unit_symbol,i.position,i.expected_quantity;
create view public.shipment_kit_status with(security_invoker=true) as
 select k.company_id,k.id as kit_id,count(p.kit_item_id) as item_count,
 count(p.kit_item_id) filter(where p.remaining_quantity>0) as pending_items,
 case when count(p.kit_item_id)=0 or count(p.kit_item_id) filter(where p.remaining_quantity>0)>0 then 'incompleto' else 'completo' end as status
 from public.shipment_kits k left join public.shipment_kit_item_progress p on p.company_id=k.company_id and p.kit_id=k.id
 group by k.company_id,k.id;
revoke all on public.shipment_kit_item_progress,public.shipment_kit_status from public,anon,authenticated;
grant select on public.shipment_kit_item_progress,public.shipment_kit_status to authenticated;

create function public.create_shipment_kit(
 p_request_key uuid,p_order_id uuid,p_workshop_id uuid,p_bag_quantity numeric,p_items jsonb,p_note text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; bid uuid; kid uuid; templates jsonb; t jsonb; expected numeric; requested jsonb; existing public.shipment_kits;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico']);
 if p_request_key is null or p_items is null or jsonb_typeof(p_items)<>'array' then raise exception using errcode='22023',message='Chave e itens obrigatórios.';end if;
 requested:=jsonb_build_object('order',p_order_id,'workshop',p_workshop_id,'bag_quantity',p_bag_quantity,'items',p_items,'note',p_note);
 select * into existing from public.shipment_kits where company_id=cid and request_key=p_request_key;
 if found then
  if existing.payload is distinct from requested then raise exception using errcode='22023',message='Chave já usada com outros dados.';end if;
  return jsonb_build_object('kit_id',existing.id);
 end if;
 select bag_id into bid from public.production_orders where company_id=cid and id=p_order_id;
 if not found then raise exception using errcode='22023',message='Pedido inválido.';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'material',t.material_id,'unit',m.unit_id,'label',t.label,'symbol',u.symbol,'position',t.position) order by t.position,t.id),'[]'::jsonb)
 into templates from public.bag_checklist_items t
 join public.materials m on m.company_id=t.company_id and m.id=t.material_id
 join public.measurement_units u on u.company_id=m.company_id and u.id=m.unit_id
 where t.company_id=cid and t.bag_id=bid and t.active;
 if jsonb_array_length(templates)=0 or jsonb_array_length(templates)<>jsonb_array_length(p_items) then raise exception using errcode='22023',message='Informe a previsão manual de todos os itens do checklist.';end if;
 if (select count(distinct (x->>'template_item_id')::uuid) from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception using errcode='22023',message='Itens inválidos ou repetidos.';end if;
 insert into public.shipment_kits(company_id,request_key,order_id,bag_id,workshop_id,bag_quantity,note,payload,created_by)
 values(cid,p_request_key,p_order_id,bid,p_workshop_id,p_bag_quantity,p_note,requested,auth.uid()) returning id into kid;
 for t in select value from jsonb_array_elements(templates) loop
  select (x->>'expected_quantity')::numeric into expected from jsonb_array_elements(p_items) x where (x->>'template_item_id')::uuid=(t->>'id')::uuid;
  if expected is null then raise exception using errcode='22023',message='Previsão manual ausente.';end if;
  insert into public.shipment_kit_items(company_id,kit_id,template_item_id,material_id,unit_id,label,unit_symbol,position,expected_quantity)
  values(cid,kid,(t->>'id')::uuid,(t->>'material')::uuid,(t->>'unit')::uuid,t->>'label',t->>'symbol',(t->>'position')::integer,expected);
 end loop;
 return jsonb_build_object('kit_id',kid);
end $$;

create function public.record_kit_delivery(p_request_key uuid,p_kit_id uuid,p_items jsonb,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; kit public.shipment_kits; existing public.kit_deliveries; requested jsonb; entry jsonb; row_data record; q numeric;
 mapped jsonb:='[]'::jsonb; inventory_items jsonb; result_data jsonb; opid uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico','motorista']);
 if p_request_key is null or p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception using errcode='22023',message='Informe a chave e os itens enviados.';end if;
 requested:=jsonb_build_object('kit',p_kit_id,'items',p_items,'note',p_note);
 select * into existing from public.kit_deliveries where company_id=cid and request_key=p_request_key;
 if found then
  if existing.payload is distinct from requested then raise exception using errcode='22023',message='Chave já usada com outros dados.';end if;
  return existing.result;
 end if;
 if exists(select 1 from public.inventory_operations where company_id=cid and request_key=p_request_key) then raise exception using errcode='22023',message='Chave já utilizada fora deste checklist.';end if;
 select * into kit from public.shipment_kits where company_id=cid and id=p_kit_id;
 if not found then raise exception using errcode='22023',message='Kit inválido.';end if;
 if (select count(distinct (x->>'kit_item_id')::uuid) from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception using errcode='22023',message='Itens repetidos ou inválidos.';end if;
 for entry in select value from jsonb_array_elements(p_items) loop
  select * into row_data from public.shipment_kit_item_progress where company_id=cid and kit_id=p_kit_id and kit_item_id=(entry->>'kit_item_id')::uuid;
  if not found then raise exception using errcode='22023',message='Item não pertence ao kit.';end if;
  if entry->>'mode'='complete' then q:=row_data.remaining_quantity;
  elsif entry->>'mode'='partial' then
   q:=(entry->>'quantity')::numeric;
   if q is null or q<=0 or q>='Infinity'::numeric then raise exception using errcode='22023',message='Quantidade enviada inválida.';end if;
  else raise exception using errcode='22023',message='Use confirmação completa ou quantidade parcial.';end if;
  if q>0 then mapped:=mapped||jsonb_build_array(jsonb_build_object('kit_item_id',row_data.kit_item_id,'material_id',row_data.material_id,'quantity',q::text));end if;
 end loop;
 if jsonb_array_length(mapped)=0 then raise exception using errcode='22023',message='Nenhuma quantidade pendente para confirmar.';end if;
 select jsonb_agg(jsonb_build_object('material_id',material,'quantity',total::text) order by material) into inventory_items
 from (select x->>'material_id' as material,sum((x->>'quantity')::numeric) as total from jsonb_array_elements(mapped) x group by x->>'material_id') a;
 result_data:=public.register_inventory_operation(p_request_key,'material_delivery',kit.order_id,kit.workshop_id,inventory_items,null,p_note);
 opid:=(result_data->>'operation_id')::uuid;result_data:=result_data||jsonb_build_object('kit_id',p_kit_id);
 insert into public.kit_deliveries(company_id,kit_id,operation_id,request_key,payload,result) values(cid,p_kit_id,opid,p_request_key,requested,result_data);
 insert into public.kit_delivery_items(company_id,kit_id,operation_id,kit_item_id,quantity)
 select cid,p_kit_id,opid,(x->>'kit_item_id')::uuid,(x->>'quantity')::numeric from jsonb_array_elements(mapped) x;
 return result_data;
end $$;
revoke all on function public.create_shipment_kit(uuid,uuid,uuid,numeric,jsonb,text) from public,anon,authenticated;
revoke all on function public.record_kit_delivery(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_shipment_kit(uuid,uuid,uuid,numeric,jsonb,text) to authenticated;
grant execute on function public.record_kit_delivery(uuid,uuid,jsonb,text) to authenticated;
comment on table public.bag_checklist_items is 'Checklist predefinido por modelo. Sem multiplicação automática da composição.';
comment on table public.shipment_kit_items is 'Previsão manual e snapshot do checklist para a remessa. Item não enviado permanece pendente.';
