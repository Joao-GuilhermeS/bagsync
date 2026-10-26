-- Sem atribuir um tipo arbitrário aos itens ou às remessas existentes.
alter table public.bag_checklist_items add column input_type text
 check(input_type in ('checkbox','text'));
alter table public.shipment_kit_items add column input_type text
 check(input_type in ('checkbox','text'));
comment on column public.bag_checklist_items.input_type is 'Tipo escolhido por item no modelo: caixa de conferência ou texto livre. NULL indica legado ainda não configurado.';
comment on column public.shipment_kit_items.input_type is 'Tipo de resposta congelado na criação da remessa. Quantidade de estoque permanece numérica e independente do texto.';

create or replace function public.create_shipment_kit(
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
 select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'material',t.material_id,'unit',m.unit_id,'label',t.label,'symbol',u.symbol,'position',t.position,'input_type',t.input_type) order by t.position,t.id),'[]'::jsonb)
 into templates from public.bag_checklist_items t
 join public.materials m on m.company_id=t.company_id and m.id=t.material_id
 join public.measurement_units u on u.company_id=m.company_id and u.id=m.unit_id
 where t.company_id=cid and t.bag_id=bid and t.active;
 if exists(select 1 from jsonb_array_elements(templates) e where e->>'input_type' is null) then raise exception using errcode='22023',message='Configure o tipo de resposta dos itens ativos do modelo.';end if;
 if jsonb_array_length(templates)=0 or jsonb_array_length(templates)<>jsonb_array_length(p_items) then raise exception using errcode='22023',message='Informe a previsão manual de todos os itens do checklist.';end if;
 if (select count(distinct (x->>'template_item_id')::uuid) from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception using errcode='22023',message='Itens inválidos ou repetidos.';end if;
 insert into public.shipment_kits(company_id,request_key,order_id,bag_id,workshop_id,bag_quantity,note,payload,created_by)
 values(cid,p_request_key,p_order_id,bid,p_workshop_id,p_bag_quantity,p_note,requested,auth.uid()) returning id into kid;
 for t in select value from jsonb_array_elements(templates) loop
  select (x->>'expected_quantity')::numeric into expected from jsonb_array_elements(p_items) x where (x->>'template_item_id')::uuid=(t->>'id')::uuid;
  if expected is null then raise exception using errcode='22023',message='Previsão manual ausente.';end if;
  insert into public.shipment_kit_items(company_id,kit_id,template_item_id,material_id,unit_id,label,unit_symbol,position,expected_quantity,input_type)
  values(cid,kid,(t->>'id')::uuid,(t->>'material')::uuid,(t->>'unit')::uuid,t->>'label',t->>'symbol',(t->>'position')::integer,expected,t->>'input_type');
 end loop;
 return jsonb_build_object('kit_id',kid);
end $$;
