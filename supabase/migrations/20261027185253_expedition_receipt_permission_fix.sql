-- Corrige a permissão de recolhimento: motorista continua registrando bag_receipt.
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
 cid:=bagsync_private.lock_company(case when p_kind in ('material_entry','material_delivery','reversal') then array['gerente_logistico'] else array['gerente_logistico','motorista'] end);
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
