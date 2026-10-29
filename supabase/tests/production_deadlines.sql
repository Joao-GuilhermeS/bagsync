-- Integração transacional: executar após a migration production_deadlines.
-- Nenhuma fixture, mudança de perfil ou movimento de teste persiste.
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.companies(name) values('__deadline_other__') returning set_config('test.other',id::text,true);
insert into public.materials(company_id,name,unit_id) select current_setting('test.company')::uuid,'__deadline__',id from public.measurement_units where company_id=current_setting('test.company')::uuid and symbol='m' returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__deadline__') returning set_config('test.bag',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__deadline__') returning set_config('test.workshop',id::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare
 cid uuid:=current_setting('test.company')::uuid; bid uuid:=current_setting('test.bag')::uuid; wid uuid:=current_setting('test.workshop')::uuid;
 today date:=(now() at time zone 'America/Sao_Paulo')::date; oid uuid; t uuid; k1 uuid; k2 uuid; req uuid; ext uuid; op uuid;
 items jsonb; result_data jsonb; item_id uuid; other_id uuid:=gen_random_uuid(); n bigint;
begin
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,bid,current_setting('test.material')::uuid,'Material','checkbox') returning id into t;
 oid:=(public.create_production_order(gen_random_uuid(),'__deadline__',bid,100)->>'order_id')::uuid;
 items:=jsonb_build_array(jsonb_build_object('template_item_id',t,'expected_quantity','1'));
 begin perform public.create_shipment_kit(gen_random_uuid(),oid,wid,60,items);raise exception 'Prazo ausente aceito';exception when invalid_parameter_value then null;end;
 begin perform public.create_shipment_kit(gen_random_uuid(),oid,wid,60,items,p_due_on=>today-1);raise exception 'Prazo passado aceito';exception when invalid_parameter_value then null;end;
 req:=gen_random_uuid();k1:=(public.create_shipment_kit(req,oid,wid,60,items,p_due_on=>today+5)->>'kit_id')::uuid;
 if k1<>(public.create_shipment_kit(req,oid,wid,60,items,p_due_on=>today+5)->>'kit_id')::uuid then raise exception 'Replay criou outra remessa';end if;
 begin perform public.create_shipment_kit(req,oid,wid,60,items,p_due_on=>today+6);raise exception 'Replay alterou data';exception when invalid_parameter_value then null;end;
 if (select count(*) from public.shipment_deadline_events where kit_id=k1)<>1 then raise exception 'Prazo inicial duplicado';end if;
 k2:=(public.create_shipment_kit(gen_random_uuid(),oid,wid,40,items,p_due_on=>today+2)->>'kit_id')::uuid;
 if exists(select 1 from public.production_deadlines where kit_id in(k1,k2)) then raise exception 'Previsão incluída como produção';end if;
 begin perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,wid,'[{"quantity":"1"}]',p_kit_id=>k1);raise exception 'Recolhimento sem saída aceito';exception when invalid_parameter_value then null;end;
 select id into item_id from public.shipment_kit_items where kit_id=k1;
 perform public.submit_shipment_checklist(gen_random_uuid(),k1,jsonb_build_array(jsonb_build_object('kit_item_id',item_id,'mode','complete')));
 select id into item_id from public.shipment_kit_items where kit_id=k2;
 perform public.submit_shipment_checklist(gen_random_uuid(),k2,jsonb_build_array(jsonb_build_object('kit_item_id',item_id,'mode','complete')));
 if (select deadline_status from public.production_deadlines where kit_id=k1)<>'no_prazo' or (select deadline_status from public.production_deadlines where kit_id=k2)<>'a_vencer' then raise exception 'Classificação incorreta';end if;
 begin perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,wid,'[{"quantity":"1"}]');raise exception 'Recolhimento sem remessa aceito';exception when invalid_parameter_value then null;end;
 begin perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,wid,'[{"quantity":"1"}]',p_kit_id=>other_id);raise exception 'Remessa inválida aceita';exception when invalid_parameter_value then null;end;
 ext:=gen_random_uuid();result_data:=public.extend_shipment_deadline(ext,k1,today+7,today+5,'Acordo com a facção');
 if result_data<>public.extend_shipment_deadline(ext,k1,today+7,today+5,'Acordo com a facção') then raise exception 'Replay de prorrogação divergente';end if;
 if (select count(*) from public.shipment_deadline_events where kit_id=k1)<>2 then raise exception 'Prorrogação duplicada';end if;
 -- Criação repetida mantém a data inicial como referência, mesmo após prorrogação.
 perform public.create_shipment_kit(req,oid,wid,60,items,p_due_on=>today+5);
 begin perform public.extend_shipment_deadline(gen_random_uuid(),k1,today+8,today+5,'Concorrente');raise exception 'Alteração concorrente aceita';exception when invalid_parameter_value then null;end;
 begin perform public.extend_shipment_deadline(gen_random_uuid(),k1,today+6,today+7,'Reduzir');raise exception 'Prorrogação reduziu prazo';exception when invalid_parameter_value then null;end;
 begin perform public.extend_shipment_deadline(gen_random_uuid(),k1,today+8,today+7,' ');raise exception 'Motivo vazio aceito';exception when invalid_parameter_value then null;end;
 begin perform public.extend_shipment_deadline(gen_random_uuid(),other_id,today+8,null,'Outro');raise exception 'Remessa cruzada aceita';exception when invalid_parameter_value then null;end;
 req:=gen_random_uuid();result_data:=public.register_inventory_operation(req,'bag_receipt',oid,wid,'[{"quantity":"20"}]',p_kit_id=>k1);op:=(result_data->>'operation_id')::uuid;
 if result_data<>public.register_inventory_operation(req,'bag_receipt',oid,wid,'[{"quantity":"20"}]',p_kit_id=>k1) then raise exception 'Replay de recolhimento divergente';end if;
 begin perform public.register_inventory_operation(req,'bag_receipt',oid,wid,'[{"quantity":"20"}]',p_kit_id=>k2);raise exception 'Replay trocou remessa';exception when invalid_parameter_value then null;end;
 perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,wid,'[{"quantity":"10"}]',p_kit_id=>k2);
 if (select remaining_quantity from public.shipment_receipt_progress where kit_id=k1)<>'40' or (select remaining_quantity from public.shipment_receipt_progress where kit_id=k2)<>'30' then raise exception 'Parciais misturadas entre remessas';end if;
 op:=(public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,wid,'[{"quantity":"40"}]',p_kit_id=>k1)->>'operation_id')::uuid;
 if exists(select 1 from public.production_deadlines where kit_id=k1) then raise exception 'Remessa concluída permanece pendente';end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>op);
 if (select remaining_quantity from public.production_deadlines where kit_id=k1)<>'40' then raise exception 'Estorno não reabriu pendência';end if;
 result_data:=public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,wid,'[{"quantity":"50"}]',p_kit_id=>k1);
 if not(result_data->'warnings' @> '[{"code":"recebimento_excedente_remessa"}]') then raise exception 'Excesso não gerou aviso';end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>(result_data->>'operation_id')::uuid);
 begin update public.shipment_kits set due_on=today+30 where id=k1;raise exception 'Data editável diretamente';exception when insufficient_privilege then null;end;
 begin delete from public.shipment_deadline_events where kit_id=k1;raise exception 'Histórico removível';exception when insufficient_privilege then null;end;
 begin update public.shipment_receipts set kit_id=k2 where company_id=cid;raise exception 'Vínculo alterável';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.shipment_receipt_progress where company_id=current_setting('test.other')::uuid) then raise exception 'Dados de outra empresa expostos';end if;
 begin perform bagsync_private.register_inventory_operation_v1(gen_random_uuid(),'bag_receipt');raise exception 'RPC interna exposta';exception when insufficient_privilege then null;end;
 perform set_config('test.k1',k1::text,true);perform set_config('test.k2',k2::text,true);
 perform set_config('test.order',oid::text,true);
end $test$;
reset role;
-- Estado de atraso controlado apenas na fixture administrativa local/transacional.
update public.shipment_kits set due_on=(now() at time zone 'America/Sao_Paulo')::date-3 where id=current_setting('test.k2')::uuid;
update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
declare today date:=(now() at time zone 'America/Sao_Paulo')::date;
begin
 if (select deadline_status from public.production_deadlines where kit_id=current_setting('test.k2')::uuid)<>'atrasado' then raise exception 'Atraso não classificado';end if;
 begin perform public.extend_shipment_deadline(gen_random_uuid(),current_setting('test.k2')::uuid,today+10,today-3,'Sem permissão');raise exception 'Motorista prorrogou';exception when insufficient_privilege then null;end;
 perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',current_setting('test.order')::uuid,current_setting('test.workshop')::uuid,'[{"quantity":"1"}]',p_kit_id=>current_setting('test.k2')::uuid);
end $test$;
reset role;
update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 begin perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',current_setting('test.order')::uuid,current_setting('test.workshop')::uuid,'[{"quantity":"1"}]',p_kit_id=>current_setting('test.k2')::uuid);raise exception 'Gestor recolheu';exception when insufficient_privilege then null;end;
 begin perform public.extend_shipment_deadline(gen_random_uuid(),current_setting('test.k2')::uuid,current_date+20,current_date-3,'Negado');raise exception 'Gestor prorrogou';exception when insufficient_privilege then null;end;
end $test$;
reset role;
set local role anon;
do $test$
begin
 begin perform count(*) from public.production_deadlines;raise exception 'Consulta anônima aceita';exception when insufficient_privilege then null;end;
end $test$;
rollback;
