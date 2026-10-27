-- Acompanhamento e exceção de observações pelos três perfis. Sem fixtures persistentes.
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.companies(name) values('__producao_rollback__') returning set_config('test.other',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.other')::uuid,'__oculta__') returning set_config('test.other_workshop',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.other')::uuid,'__oculto__') returning set_config('test.other_bag',id::text,true);
insert into public.production_orders(company_id,request_key,name,bag_id,expected_quantity,created_by)
 values(current_setting('test.other')::uuid,gen_random_uuid(),'__oculto__',current_setting('test.other_bag')::uuid,10,current_setting('test.uid')::uuid) returning set_config('test.other_order',id::text,true);
insert into public.production_notes(company_id,order_id,workshop_id,request_key,note,created_by,created_role)
 values(current_setting('test.other')::uuid,current_setting('test.other_order')::uuid,current_setting('test.other_workshop')::uuid,gen_random_uuid(),'__oculta__',current_setting('test.uid')::uuid,'gestor');
insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.company')::uuid,'__producao__','__producao__') returning set_config('test.unit',id::text,true);
insert into public.materials(company_id,name,unit_id) values(current_setting('test.company')::uuid,'__producao__',current_setting('test.unit')::uuid) returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__producao__') returning set_config('test.bag',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__producao__') returning set_config('test.workshop',id::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare
 cid uuid:=current_setting('test.company')::uuid;b uuid:=current_setting('test.bag')::uuid;w uuid:=current_setting('test.workshop')::uuid;m uuid:=current_setting('test.material')::uuid;
 tid uuid;oid uuid;oid2 uuid;k1 uuid;k2 uuid;k3 uuid;i1 uuid;i2 uuid;i3 uuid;d1 uuid;d2 uuid;d3 uuid;receipt uuid;
 key_id uuid:=gen_random_uuid();result_data jsonb;again jsonb;history jsonb;row_data record;
begin
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,b,m,'Material','checkbox') returning id into tid;
 oid:=(public.create_production_order(gen_random_uuid(),'__pedido_1__',b,1000)->>'order_id')::uuid;
 oid2:=(public.create_production_order(gen_random_uuid(),'__pedido_2__',b,1000)->>'order_id')::uuid;
 perform set_config('test.order',oid::text,true);
 k1:=(public.create_shipment_kit(gen_random_uuid(),oid,w,100,jsonb_build_array(jsonb_build_object('template_item_id',tid,'expected_quantity','10')))->>'kit_id')::uuid;
 k2:=(public.create_shipment_kit(gen_random_uuid(),oid,w,50,jsonb_build_array(jsonb_build_object('template_item_id',tid,'expected_quantity','10')))->>'kit_id')::uuid;
 select id into i1 from public.shipment_kit_items where kit_id=k1;
 select id into i2 from public.shipment_kit_items where kit_id=k2;
 if (select distributed_quantity::numeric from public.production_tracking where order_id=oid and workshop_id=w)<>0 then raise exception 'Previsão foi contada como distribuição';end if;
 d1:=(public.record_kit_delivery(gen_random_uuid(),k1,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','2')))->>'operation_id')::uuid;
 d2:=(public.record_kit_delivery(gen_random_uuid(),k1,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','3')))->>'operation_id')::uuid;
 select * into row_data from public.production_tracking where order_id=oid and workshop_id=w;
 if row_data.distributed_quantity::numeric<>100 or row_data.distribution_count::integer<>1 or row_data.last_distribution_at is null then raise exception 'Complemento duplicou produção ou data ausente';end if;
 d3:=(public.record_kit_delivery(gen_random_uuid(),k2,jsonb_build_array(jsonb_build_object('kit_item_id',i2,'mode','complete')))->>'operation_id')::uuid;
 perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,w,'[{"quantity":"20"}]');
 receipt:=(public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,w,'[{"quantity":"30"}]')->>'operation_id')::uuid;
 select * into row_data from public.production_tracking where order_id=oid and workshop_id=w;
 if row_data.distributed_quantity::numeric<>150 or row_data.received_quantity::numeric<>50 or row_data.remaining_quantity::numeric<>100 or row_data.receipt_count::integer<>2 then raise exception 'Junção multiplicou totais';end if;
 k3:=(public.create_shipment_kit(gen_random_uuid(),oid2,w,400,jsonb_build_array(jsonb_build_object('template_item_id',tid,'expected_quantity','10')))->>'kit_id')::uuid;
 select id into i3 from public.shipment_kit_items where kit_id=k3;
 perform public.record_kit_delivery(gen_random_uuid(),k3,jsonb_build_array(jsonb_build_object('kit_item_id',i3,'mode','complete')));
 perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid2,w,'[{"quantity":"5"}]');
 if (select remaining_quantity::numeric from public.production_tracking where order_id=oid2 and workshop_id=w)<>395 then raise exception 'Pedidos simultâneos misturados';end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>receipt);
 if (select received_quantity::numeric from public.production_tracking where order_id=oid and workshop_id=w)<>20 then raise exception 'Recebimento estornado contou';end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>d1);
 if (select distributed_quantity::numeric from public.production_tracking where order_id=oid and workshop_id=w)<>150 then raise exception 'Outro envio válido foi ignorado';end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>d2);
 if (select distributed_quantity::numeric from public.production_tracking where order_id=oid and workshop_id=w)<>50 then raise exception 'Kit sem envio válido continuou contado';end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>d3);
 select * into row_data from public.production_tracking where order_id=oid and workshop_id=w;
 if row_data.distributed_quantity::numeric<>0 or row_data.excess_quantity::numeric<>20 or not row_data.has_excess then raise exception 'Recolhimento sem distribuição foi escondido';end if;
 result_data:=public.add_production_note(key_id,oid,w,'Observação do gerente');
 again:=public.add_production_note(key_id,oid,w,'Observação do gerente');
 if result_data<>again then raise exception 'Observação duplicada';end if;
 begin perform public.add_production_note(key_id,oid,w,'Mudou');raise exception 'Chave divergente aceita';exception when invalid_parameter_value then null;end;
 begin perform public.add_production_note(gen_random_uuid(),oid,w,' ');raise exception 'Observação vazia aceita';exception when invalid_parameter_value then null;end;
 begin perform public.add_production_note(gen_random_uuid(),oid,current_setting('test.other_workshop')::uuid,'Alheia');raise exception 'Facção alheia aceita';exception when foreign_key_violation then null;end;
 history:=public.production_tracking_history(b,oid,w,'receipts',1);
 if not (history->>'found')::boolean or (history->>'count')::integer<>2 or jsonb_array_length(history->'rows')<>2 then raise exception 'Histórico de recolhimentos incompleto';end if;
 if not exists(select 1 from jsonb_array_elements(history->'rows') x where (x->>'is_reversed')::boolean) then raise exception 'Original estornado sumiu';end if;
 history:=public.production_tracking_history(b,oid,w,'distributions',1);
 if (history->>'count')::integer<>2 then raise exception 'Distribuições incompletas';end if;
 if (public.production_tracking_history(current_setting('test.other_bag')::uuid,oid,w,'notes',1)->>'found')::boolean then raise exception 'Modelo divergente aceito';end if;
 begin perform public.production_tracking_history(b,oid,w,'arbitrario',1);raise exception 'Tipo arbitrário aceito';exception when invalid_parameter_value then null;end;
 begin perform public.production_tracking_history(b,oid,w,'notes',0);raise exception 'Página inválida aceita';exception when invalid_parameter_value then null;end;
 if exists(select 1 from public.production_tracking where company_id=current_setting('test.other')::uuid) or exists(select 1 from public.production_notes where company_id=current_setting('test.other')::uuid) then raise exception 'Vazamento multiempresa';end if;
 begin insert into public.production_notes default values;raise exception 'Escrita direta liberada';exception when insufficient_privilege then null;end;
 begin update public.production_notes set note='Editado';raise exception 'Histórico alterável';exception when insufficient_privilege then null;end;
end $test$;
reset role;
update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
select public.add_production_note(gen_random_uuid(),current_setting('test.order')::uuid,current_setting('test.workshop')::uuid,'Observação do motorista');
reset role;
update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
declare i integer; h jsonb;oid uuid:=current_setting('test.order')::uuid;w uuid:=current_setting('test.workshop')::uuid;b uuid:=current_setting('test.bag')::uuid;
begin
 perform public.add_production_note(gen_random_uuid(),oid,w,'Observação do gestor');
 if not exists(select 1 from public.production_notes where order_id=oid and created_role='gestor' and created_by=auth.uid()) then raise exception 'Perfil/autor não derivados da identidade';end if;
 for i in 1..25 loop perform public.add_production_note(gen_random_uuid(),oid,w,'Nota de paginação '||i);end loop;
 h:=public.production_tracking_history(b,oid,w,'notes',1);
 if (h->>'count')::integer<>28 or jsonb_array_length(h->'rows')<>25 then raise exception 'Primeira página incorreta';end if;
 h:=public.production_tracking_history(b,oid,w,'notes',2);
 if jsonb_array_length(h->'rows')<>3 then raise exception 'Segunda página incorreta';end if;
 if (select note_count::integer from public.production_tracking where order_id=oid and workshop_id=w)<>28 then raise exception 'Contagem de observações multiplicada';end if;
 begin perform public.register_inventory_operation(gen_random_uuid(),'material_entry',p_items=>jsonb_build_array(jsonb_build_object('material_id',current_setting('test.material'),'quantity','1')));raise exception 'Exceção de notas liberou estoque';exception when insufficient_privilege then null;end;
 begin delete from public.production_notes where order_id=oid;raise exception 'Gestor apagou notas';exception when insufficient_privilege then null;end;
end $test$;
reset role;
update public.company_users set company_id=current_setting('test.other')::uuid where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 if exists(select 1 from public.production_tracking where company_id=current_setting('test.company')::uuid) or exists(select 1 from public.production_kit_distribution) then raise exception 'Vazamento em view';end if;
 if (public.production_tracking_history(current_setting('test.bag')::uuid,current_setting('test.order')::uuid,current_setting('test.workshop')::uuid,'notes',1)->>'found')::boolean then raise exception 'Histórico alheio acessível';end if;
end $test$;
reset role;
set local role anon;
do $test$
begin
 begin perform 1 from public.production_tracking;raise exception 'Anônimo leu produção';exception when insufficient_privilege then null;end;
 begin perform public.add_production_note(gen_random_uuid(),null,null,'Nota');raise exception 'Anônimo escreveu';exception when insufficient_privilege then null;end;
 begin perform public.production_tracking_history(null,null,null,'notes',1);raise exception 'Anônimo consultou RPC';exception when insufficient_privilege then null;end;
end $test$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$
begin
 if exists(select 1 from public.production_notes) then raise exception 'Sem identidade leu notas';end if;
 begin perform public.add_production_note(gen_random_uuid(),null,null,'Nota');raise exception 'Sem identidade escreveu';exception when insufficient_privilege then null;end;
end $test$;
reset role;
rollback;
