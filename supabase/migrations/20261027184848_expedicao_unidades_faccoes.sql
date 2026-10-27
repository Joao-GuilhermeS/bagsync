-- Unidades disponíveis para seleção; preservar IDs/símbolos e vínculos existentes.
create function bagsync_private.seed_measurement_units(p_company uuid) returns void
language sql security definer set search_path='' as $$
 insert into public.measurement_units(company_id,name,symbol)
 select p_company,v.name,v.symbol from (values
 ('Unidade','un'),('Peça','pç'),('Par','par'),('Dúzia','dz'),
 ('Metro','m'),('Centímetro','cm'),('Milímetro','mm'),('Metro quadrado','m²'),
 ('Quilograma','kg'),('Grama','g'),('Litro','L'),('Mililitro','mL'),
 ('Rolo','rolo'),('Bobina','bob'),('Cone','cone'),('Pacote','pct'),('Caixa','cx')
 ) v(name,symbol)
 where not exists(select 1 from public.measurement_units u where u.company_id=p_company and lower(u.symbol)=lower(v.symbol))
 on conflict(company_id,symbol) do nothing;
$$;
revoke all on function bagsync_private.seed_measurement_units(uuid) from public,anon,authenticated;
select bagsync_private.seed_measurement_units(id) from public.companies;
create function bagsync_private.company_measurement_units() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform bagsync_private.seed_measurement_units(new.id);
 return new;
end $$;
revoke all on function bagsync_private.company_measurement_units() from public,anon,authenticated;
create trigger company_default_measurement_units after insert on public.companies
for each row execute function bagsync_private.company_measurement_units();
revoke insert,update,delete on public.measurement_units from authenticated;
drop policy measurement_units_insert on public.measurement_units;
drop policy measurement_units_update on public.measurement_units;
drop policy measurement_units_delete on public.measurement_units;
comment on table public.measurement_units is 'Unidades predefinidas por empresa, somente leitura no aplicativo; sem conversão automática. Unidades legadas preservadas.';

-- Campos opcionais para preservar cadastros antigos e não inventar obrigatoriedade.
alter table public.workshops
 add column document_number text not null default '' check(length(document_number)<=40),
 add column phone text not null default '' check(length(phone)<=30),
 add column street text not null default '' check(length(street)<=200),
 add column address_number text not null default '' check(length(address_number)<=30),
 add column address_complement text not null default '' check(length(address_complement)<=150),
 add column neighborhood text not null default '' check(length(neighborhood)<=100),
 add column city text not null default '' check(length(city)<=100),
 add column state text not null default '' check(state='' or state ~ '^[A-Z]{2}$'),
 add column postal_code text not null default '' check(postal_code='' or postal_code ~ '^[0-9]{5}-?[0-9]{3}$');
comment on table public.workshops is 'Facções/costureiros: nome, documento, telefone e endereço. Novos campos opcionais; RLS por empresa e escrita pelo Gerente Logístico.';
comment on column public.workshops.document_number is 'Número de documento informado pelo usuário, sem assumir tipo ou unicidade.';
comment on column public.workshops.city is 'Município físico da facção; não é o modelo de bolsa.';

-- Confirmação na facção é independente da baixa já realizada na Expedição.
alter table public.kit_checklist_submissions add constraint kit_checklist_submissions_company_id_key unique(company_id,id);
create table public.shipment_delivery_confirmations (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 submission_id uuid not null,
 request_key uuid not null,
 note text not null default '' check(length(note)<=2000),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(company_id,id),
 unique(company_id,submission_id),
 unique(company_id,request_key),
 foreign key(company_id,submission_id) references public.kit_checklist_submissions(company_id,id)
);
create index shipment_delivery_confirmations_author_idx on public.shipment_delivery_confirmations(created_by);
alter table public.shipment_delivery_confirmations enable row level security;
revoke all on public.shipment_delivery_confirmations from public,anon,authenticated;
grant select on public.shipment_delivery_confirmations to authenticated;
create policy shipment_delivery_confirmations_read on public.shipment_delivery_confirmations for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

create function public.confirm_shipment_delivery(p_request_key uuid,p_submission_id uuid,p_note text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; existing public.shipment_delivery_confirmations; sid uuid; op uuid; nid uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico','motorista']);
 if p_request_key is null or p_submission_id is null or length(coalesce(p_note,''))>2000 then
  raise exception using errcode='22023',message='Dados da confirmação inválidos.';
 end if;
 select * into existing from public.shipment_delivery_confirmations where company_id=cid and request_key=p_request_key;
 if found then
  if existing.submission_id is distinct from p_submission_id or existing.note is distinct from coalesce(p_note,'') then
   raise exception using errcode='22023',message='Chave já usada com outros dados.';
  end if;
  return jsonb_build_object('confirmation_id',existing.id);
 end if;
 select s.id,s.operation_id into sid,op from public.kit_checklist_submissions s
 where s.company_id=cid and s.id=p_submission_id;
 if sid is null or op is null or exists(select 1 from public.inventory_operations where company_id=cid and reversal_of=op) then
  raise exception using errcode='22023',message='Romaneio não disponível para entrega.';
 end if;
 if exists(select 1 from public.shipment_delivery_confirmations where company_id=cid and submission_id=sid) then
  raise exception using errcode='22023',message='Entrega já confirmada. Atualize a consulta.';
 end if;
 insert into public.shipment_delivery_confirmations(company_id,submission_id,request_key,note,created_by)
 values(cid,sid,p_request_key,coalesce(p_note,''),auth.uid()) returning id into nid;
 return jsonb_build_object('confirmation_id',nid);
end $$;
revoke all on function public.confirm_shipment_delivery(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.confirm_shipment_delivery(uuid,uuid,text) to authenticated;
comment on table public.shipment_delivery_confirmations is 'Confirmação imutável do recebimento na facção após emissão na Expedição; não movimenta estoque. Uma confirmação por romaneio, com autor, data e idempotência.';

create view public.shipment_dispatches with(security_invoker=true) as
 select s.company_id,s.id as submission_id,s.kit_id,s.operation_id,s.created_at as issued_at,s.note,
 k.order_id,k.workshop_id,k.bag_id,k.bag_quantity,
 c.id as confirmation_id,c.created_at as delivered_at,c.note as delivery_note,
 case when r.id is not null then 'estornado' when c.id is not null then 'entregue' else 'a_entregar' end as delivery_status
 from public.kit_checklist_submissions s
 join public.shipment_kits k on k.company_id=s.company_id and k.id=s.kit_id
 left join public.shipment_delivery_confirmations c on c.company_id=s.company_id and c.submission_id=s.id
 left join public.inventory_operations r on r.company_id=s.company_id and r.reversal_of=s.operation_id
 where s.operation_id is not null;
revoke all on public.shipment_dispatches from public,anon,authenticated;
grant select on public.shipment_dispatches to authenticated;

-- Saída/baixa restrita ao gerente; motorista confirma entrega ou recolhe bolsas.
create or replace function public.submit_shipment_checklist(p_request_key uuid,p_kit_id uuid,p_answers jsonb,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 cid uuid; existing public.kit_checklist_submissions; requested jsonb; sid uuid:=gen_random_uuid();
 answer jsonb; item record; q numeric; mode_value text; free_text text;
 answers_data jsonb:='[]'::jsonb; delivery_data jsonb:='[]'::jsonb;
 result_data jsonb; opid uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico']);
 if p_request_key is null or p_answers is null or jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)=0 then
  raise exception using errcode='22023',message='Informe a chave e as respostas do checklist.';
 end if;
 requested:=jsonb_build_object('kit',p_kit_id,'answers',p_answers,'note',p_note);
 select * into existing from public.kit_checklist_submissions where company_id=cid and request_key=p_request_key;
 if found then
  if existing.payload is distinct from requested then raise exception using errcode='22023',message='Chave já usada com outros dados.';end if;
  return existing.result;
 end if;
 if not exists(select 1 from public.shipment_kits where company_id=cid and id=p_kit_id) then
  raise exception using errcode='22023',message='Remessa inválida.';
 end if;
 if exists(select 1 from public.inventory_operations where company_id=cid and request_key=p_request_key)
 or exists(select 1 from public.kit_deliveries where company_id=cid and request_key=p_request_key) then
  raise exception using errcode='22023',message='Chave já utilizada em outro lançamento.';
 end if;
 if (select count(*) from public.shipment_kit_items where company_id=cid and kit_id=p_kit_id)<>jsonb_array_length(p_answers)
 or (select count(distinct (x->>'kit_item_id')::uuid) from jsonb_array_elements(p_answers) x)<>jsonb_array_length(p_answers) then
  raise exception using errcode='22023',message='Responda todos os itens uma única vez.';
 end if;
 for answer in select value from jsonb_array_elements(p_answers) loop
  select i.id,i.input_type,p.remaining_quantity into item
  from public.shipment_kit_items i join public.shipment_kit_item_progress p
   on p.company_id=i.company_id and p.kit_item_id=i.id and p.kit_id=i.kit_id
  where i.company_id=cid and i.kit_id=p_kit_id and i.id=(answer->>'kit_item_id')::uuid;
  if not found or item.input_type is null then raise exception using errcode='22023',message='Item inválido ou remessa anterior sem tipo configurado.';end if;
  mode_value:=answer->>'mode';
  if answer ? 'text' and jsonb_typeof(answer->'text') not in ('string','null') then
   raise exception using errcode='22023',message='A resposta livre deve ser texto.';
  end if;
  free_text:=answer->>'text';
  if item.input_type='checkbox' and coalesce(free_text,'')<>'' then
   raise exception using errcode='22023',message='Este item usa caixa de marcação, não texto livre.';
  end if;
  if mode_value='complete' and item.input_type='checkbox' then q:=item.remaining_quantity;
  elsif mode_value='partial' then
   q:=(answer->>'quantity')::numeric;
   if q is null or q<=0 or q>='Infinity'::numeric then raise exception using errcode='22023',message='Quantidade enviada inválida.';end if;
  elsif mode_value='pending' then
   q:=0;
   if coalesce((answer->>'quantity')::numeric,0)<>0 then raise exception using errcode='22023',message='Item pendente não pode informar envio.';end if;
  else raise exception using errcode='22023',message='Tipo de resposta inválido.';end if;
  answers_data:=answers_data||jsonb_build_array(jsonb_build_object('kit_item_id',item.id,'mode',mode_value,'text',free_text,'quantity',q::text));
  if q>0 then delivery_data:=delivery_data||jsonb_build_array(jsonb_build_object('kit_item_id',item.id,'mode','partial','quantity',q::text));end if;
 end loop;
 if jsonb_array_length(delivery_data)>0 then
  result_data:=public.record_kit_delivery(p_request_key,p_kit_id,delivery_data,p_note);
  opid:=(result_data->>'operation_id')::uuid;
 else result_data:=jsonb_build_object('kit_id',p_kit_id,'warnings','[]'::jsonb);end if;
 result_data:=result_data||jsonb_build_object('submission_id',sid,'operation_id',opid,'kit_id',p_kit_id);
 insert into public.kit_checklist_submissions(id,company_id,kit_id,request_key,operation_id,note,payload,result,created_by)
 values(sid,cid,p_kit_id,p_request_key,opid,p_note,requested,result_data,auth.uid());
 insert into public.kit_checklist_answers(company_id,kit_id,submission_id,kit_item_id,mode,response_text,quantity)
 select cid,p_kit_id,sid,(x->>'kit_item_id')::uuid,x->>'mode',x->>'text',(x->>'quantity')::numeric
 from jsonb_array_elements(answers_data) x;
 return result_data;
end $$;

create or replace function public.record_kit_delivery(p_request_key uuid,p_kit_id uuid,p_items jsonb,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; kit public.shipment_kits; existing public.kit_deliveries; requested jsonb; entry jsonb; row_data record; q numeric;
 mapped jsonb:='[]'::jsonb; inventory_items jsonb; result_data jsonb; opid uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico']);
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

create or replace function public.register_inventory_operation(
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
 cid:=bagsync_private.lock_company(case when p_kind in ('material_entry','reversal') then array['gerente_logistico'] else array['gerente_logistico'] end);
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
