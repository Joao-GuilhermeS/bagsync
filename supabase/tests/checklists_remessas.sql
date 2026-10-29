-- Executar após a migração. Dados temporários e troca de perfil revertidos integralmente.
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.companies(name) values('__kit_rollback__') returning set_config('test.other',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.other')::uuid,'__oculta__') returning set_config('test.other_workshop',id::text,true);
insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.company')::uuid,'__kit__','__kit_test__') returning set_config('test.unit',id::text,true);
insert into public.materials(company_id,name,unit_id) values(current_setting('test.company')::uuid,'__kit__',current_setting('test.unit')::uuid) returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__kit__') returning set_config('test.bag',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__kit__') returning set_config('test.workshop',id::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare
 cid uuid:=current_setting('test.company')::uuid; b uuid:=current_setting('test.bag')::uuid;
 m uuid:=current_setting('test.material')::uuid; w uuid:=current_setting('test.workshop')::uuid;
 t1 uuid; t2 uuid; oid uuid; kid uuid; i1 uuid; i2 uuid; op uuid;
 k uuid:=gen_random_uuid(); dk uuid:=gen_random_uuid(); items jsonb; delivery jsonb; r jsonb; n bigint;
begin
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,b,m,'Item A','checkbox') returning id into t1;
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,position,input_type) values(cid,b,m,'Item B',1,'text') returning id into t2;
 oid:=(public.create_production_order(gen_random_uuid(),'__kit__',b,10)->>'order_id')::uuid;
 items:=jsonb_build_array(jsonb_build_object('template_item_id',t1,'expected_quantity','100'),jsonb_build_object('template_item_id',t2,'expected_quantity','25'));
 r:=public.create_shipment_kit(k,oid,w,10,items,p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7); kid:=(r->>'kit_id')::uuid;
 perform set_config('test.kit',kid::text,true);
 if r<>public.create_shipment_kit(k,oid,w,10,items,p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7) then raise exception 'Replay do kit divergente';end if;
 if (select count(*) from public.stock_movements where material_id=m)<>0 then raise exception 'Criação movimentou estoque';end if;
 if (select status from public.shipment_kit_status where kit_id=kid)<>'incompleto' then raise exception 'Kit vazio de envios completo';end if;
 if (select pending_items from public.shipment_kit_status where kit_id=kid)<>2 then raise exception 'Itens não enviados não ficaram pendentes';end if;
 begin
  perform public.create_shipment_kit(k,oid,w,11,items,p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7);raise exception 'Replay alterado aceito';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.create_shipment_kit(gen_random_uuid(),oid,w,10,jsonb_build_array(items->0),p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7);raise exception 'Checklist incompleto aceito';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.create_shipment_kit(gen_random_uuid(),oid,current_setting('test.other_workshop')::uuid,10,items,p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7);raise exception 'Facção de outra empresa aceita';
 exception when foreign_key_violation then null;end;
 select id into i1 from public.shipment_kit_items where kit_id=kid and template_item_id=t1;
 select id into i2 from public.shipment_kit_items where kit_id=kid and template_item_id=t2;
 if (select input_type from public.shipment_kit_items where id=i1) is distinct from 'checkbox' or (select input_type from public.shipment_kit_items where id=i2) is distinct from 'text' then raise exception 'Tipo não capturado na remessa';end if;
 begin
  update public.bag_checklist_items set input_type='number' where id=t1;raise exception 'Tipo inválido aceito';
 exception when check_violation then null;end;
 update public.bag_checklist_items set input_type=null where id=t1;
 begin
  perform public.create_shipment_kit(gen_random_uuid(),oid,w,10,items,p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7);raise exception 'Nova remessa com tipo não configurado';
 exception when invalid_parameter_value then null;end;
 update public.bag_checklist_items set input_type='text' where id=t1;
 if (select input_type from public.shipment_kit_items where id=i1) is distinct from 'checkbox' then raise exception 'Mudança do modelo alterou tipo histórico';end if;
 perform set_config('test.item',i1::text,true);
 delivery:=jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','50'));
 r:=public.record_kit_delivery(dk,kid,delivery);op:=(r->>'operation_id')::uuid;
 if r<>public.record_kit_delivery(dk,kid,delivery) then raise exception 'Replay de envio divergente';end if;
 if (select remaining_quantity from public.shipment_kit_item_progress where kit_item_id=i1)<>50 then raise exception 'Saldo parcial incorreto';end if;
 begin
  perform public.record_kit_delivery(dk,kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','51')));raise exception 'Chave reutilizada com quantidade diferente';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.record_kit_delivery(gen_random_uuid(),kid,delivery||delivery);raise exception 'Item repetido aceito';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.record_kit_delivery(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','-1')));raise exception 'Quantidade negativa aceita';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.record_kit_delivery(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','NaN')));raise exception 'NaN aceito';
 exception when invalid_parameter_value then null;end;
 if (select sum(quantity) from public.stock_movements where material_id=m)<>-50 then raise exception 'Envio duplicou baixa';end if;
 select count(*) into n from public.inventory_operations;
 begin
  perform public.record_kit_delivery(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','complete'),jsonb_build_object('kit_item_id',gen_random_uuid(),'mode','complete')));
  raise exception 'Item inválido aceito';
 exception when invalid_parameter_value then null;end;
 if (select count(*) from public.inventory_operations)<>n then raise exception 'Falha deixou operação parcial';end if;
 r:=public.record_kit_delivery(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','complete'),jsonb_build_object('kit_item_id',i2,'mode','complete')));
 if (select count(*) from public.stock_movements where operation_id=(r->>'operation_id')::uuid)<>1 then raise exception 'Mesmo material não foi agregado';end if;
 if (select status from public.shipment_kit_status where kit_id=kid)<>'completo' then raise exception 'Confirmação completa falhou';end if;
 if (select sum(quantity) from public.stock_movements where material_id=m)<>-125 then raise exception 'Baixa total incorreta';end if;
 begin
  perform public.record_kit_delivery(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','complete')));raise exception 'OK sem saldo criou nova saída';
 exception when invalid_parameter_value then null;end;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>op);
 if (select remaining_quantity from public.shipment_kit_item_progress where kit_item_id=i1)<>50 then raise exception 'Estorno não reabriu pendência';end if;
 if (select status from public.shipment_kit_status where kit_id=kid)<>'incompleto' then raise exception 'Estorno não reabriu kit';end if;
 update public.bag_checklist_items set label='Alterado',active=false where id=t1;
 delete from public.bag_checklist_items where id=t2;
 if (select label from public.shipment_kit_items where id=i1)<>'Item A' then raise exception 'Snapshot alterado';end if;
 if (select template_item_id from public.shipment_kit_items where id=i2) is not null then raise exception 'Exclusão de template não preservou snapshot';end if;
 begin
  delete from public.shipment_kits where id=kid;raise exception 'Histórico apagável';
 exception when insufficient_privilege then null;end;
end $test$;
reset role;
update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 begin perform public.record_kit_delivery(gen_random_uuid(),current_setting('test.kit')::uuid,jsonb_build_array(jsonb_build_object('kit_item_id',current_setting('test.item'),'mode','complete')));raise exception 'Motorista emitiu saída de Expedição';exception when insufficient_privilege then null;end;
 begin
  perform public.create_shipment_kit(gen_random_uuid(),null,null,1,'[]',p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7);raise exception 'Motorista criou kit';
 exception when insufficient_privilege then null;end;
 begin
  insert into public.bag_checklist_items(company_id,bag_id,material_id,label) values(current_setting('test.company')::uuid,current_setting('test.bag')::uuid,current_setting('test.material')::uuid,'Proibido');
  raise exception 'Motorista editou template';
 exception when insufficient_privilege then null;end;
end $test$;
reset role;
update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 if not exists(select 1 from public.shipment_kits where id=current_setting('test.kit')::uuid) then raise exception 'Gestor sem leitura';end if;
 begin
  perform public.record_kit_delivery(gen_random_uuid(),current_setting('test.kit')::uuid,'[]');raise exception 'Gestor registrou entrega';
 exception when insufficient_privilege then null;end;
end $test$;
reset role;
-- A mesma identidade, com vínculo em outra empresa, não pode ler nem gravar no kit original.
update public.company_users set company_id=current_setting('test.other')::uuid,role='gerente_logistico' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 if exists(select 1 from public.shipment_kits) or exists(select 1 from public.shipment_kit_items) or exists(select 1 from public.kit_deliveries) or exists(select 1 from public.kit_delivery_items) or exists(select 1 from public.shipment_kit_status) or exists(select 1 from public.shipment_kit_item_progress) or exists(select 1 from public.bag_checklist_items) then raise exception 'Vazamento multiempresa';end if;
 begin
  perform public.record_kit_delivery(gen_random_uuid(),current_setting('test.kit')::uuid,jsonb_build_array(jsonb_build_object('kit_item_id',current_setting('test.item'),'mode','complete')));raise exception 'Kit alheio aceito';
 exception when invalid_parameter_value then null;end;
end $test$;
reset role;
set local role anon;
do $test$
begin
 begin
  perform public.create_shipment_kit(gen_random_uuid(),null,null,1,'[]',p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7);raise exception 'Anônimo acessou RPC';
 exception when insufficient_privilege then null;end;
 begin
  perform 1 from public.shipment_kits;raise exception 'Anônimo leu kits';
 exception when insufficient_privilege then null;end;
end $test$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$
begin
 if exists(select 1 from public.shipment_kits) then raise exception 'Sem identidade leu kits';end if;
 begin
  perform public.create_shipment_kit(gen_random_uuid(),null,null,1,'[]',p_due_on=>(now() at time zone 'America/Sao_Paulo')::date+7);raise exception 'Sem identidade criou kit';
 exception when insufficient_privilege then null;end;
end $test$;
reset role;
rollback;
