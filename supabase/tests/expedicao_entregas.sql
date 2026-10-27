-- Integração transacional: nenhuma fixture ou mudança de perfil persiste.
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.companies(name) values('__expedicao_rollback__') returning set_config('test.other',id::text,true);
insert into public.materials(company_id,name,unit_id) select current_setting('test.company')::uuid,'__expedicao__',id from public.measurement_units where company_id=current_setting('test.company')::uuid and symbol='m' returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__expedicao__') returning set_config('test.bag',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__expedicao__') returning set_config('test.workshop',id::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare
 cid uuid:=current_setting('test.company')::uuid; b uuid:=current_setting('test.bag')::uuid;
 m uuid:=current_setting('test.material')::uuid; w uuid:=current_setting('test.workshop')::uuid;
 t1 uuid; t2 uuid; oid uuid; kid uuid; i1 uuid; i2 uuid; r jsonb; sid uuid; op uuid; k uuid; answers jsonb; n bigint;
begin
 if (select count(*) from public.measurement_units where company_id=cid)<17 then raise exception 'Unidades predefinidas ausentes';end if;
 if exists(select 1 from public.measurement_units where company_id=current_setting('test.other')::uuid) then raise exception 'Unidades de outra empresa expostas';end if;
 begin insert into public.measurement_units(company_id,name,symbol) values(cid,'__negado__','__negado__');raise exception 'Unidade editável';exception when insufficient_privilege then null;end;
 begin update public.measurement_units set name='__negado__' where company_id=cid;raise exception 'Unidade alterável';exception when insufficient_privilege then null;end;
 begin delete from public.measurement_units where company_id=cid;raise exception 'Unidade removível';exception when insufficient_privilege then null;end;
 update public.workshops set document_number='DOC-123',phone='(85) 99999-0000',street='Rua de teste',address_number='10',address_complement='Galpão',neighborhood='Centro',city='Quixadá',state='CE',postal_code='63900-000' where id=w;
 if (select document_number from public.workshops where id=w)<>'DOC-123' then raise exception 'Contato não salvo';end if;
 begin update public.workshops set state='INVALIDA' where id=w;raise exception 'UF inválida aceita';exception when check_violation then null;end;
 begin update public.workshops set postal_code='123' where id=w;raise exception 'CEP inválido aceito';exception when check_violation then null;end;
 begin insert into public.workshops(company_id,name) values(current_setting('test.other')::uuid,'__negado__');raise exception 'Cadastro cruzado';exception when insufficient_privilege then null;end;
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,b,m,'Conferência','checkbox') returning id into t1;
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,b,m,'Texto livre','text') returning id into t2;
 oid:=(public.create_production_order(gen_random_uuid(),'__expedicao__',b,100)->>'order_id')::uuid;
 kid:=(public.create_shipment_kit(gen_random_uuid(),oid,w,100,jsonb_build_array(jsonb_build_object('template_item_id',t1,'expected_quantity','100'),jsonb_build_object('template_item_id',t2,'expected_quantity','25')))->>'kit_id')::uuid;
 select id into i1 from public.shipment_kit_items where kit_id=kid and template_item_id=t1;
 select id into i2 from public.shipment_kit_items where kit_id=kid and template_item_id=t2;
 if exists(select 1 from public.shipment_dispatches where kit_id=kid) then raise exception 'Previsão liberada para entrega';end if;
 answers:=jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','pending'),jsonb_build_object('kit_item_id',i2,'mode','pending','text','Aguardando'));
 r:=public.submit_shipment_checklist(gen_random_uuid(),kid,answers);
 begin perform public.confirm_shipment_delivery(gen_random_uuid(),(r->>'submission_id')::uuid);raise exception 'Romaneio sem material entregue';exception when invalid_parameter_value then null;end;
 if exists(select 1 from public.shipment_dispatches where kit_id=kid) then raise exception 'Sem envio liberou entrega';end if;
 answers:=jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','20'),jsonb_build_object('kit_item_id',i2,'mode','partial','quantity','3','text','Cor azul'));
 k:=gen_random_uuid();r:=public.submit_shipment_checklist(k,kid,answers,'Saída parcial');sid:=(r->>'submission_id')::uuid;op:=(r->>'operation_id')::uuid;
 if r<>public.submit_shipment_checklist(k,kid,answers,'Saída parcial') then raise exception 'Replay de emissão divergente';end if;
 if (select sum(quantity) from public.stock_movements where material_id=m)<>-23 then raise exception 'Baixa na Expedição incorreta';end if;
 if not(r->'warnings' @> '[{"code":"saldo_negativo"}]') then raise exception 'Aviso negativo ausente';end if;
 if (select delivery_status from public.shipment_dispatches where submission_id=sid)<>'a_entregar' then raise exception 'Saída não está a entregar';end if;
 if (select distributed_quantity::numeric from public.production_tracking where order_id=oid and workshop_id=w)<>100 then raise exception 'Primeira saída não contou distribuição';end if;
 perform set_config('test.sid',sid::text,true);perform set_config('test.op',op::text,true);perform set_config('test.kit',kid::text,true);perform set_config('test.order',oid::text,true);
 -- Conferir o restante não repete o previsto; texto e quantidade permanecem separados.
 r:=public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','complete'),jsonb_build_object('kit_item_id',i2,'mode','partial','quantity','22','text','Complemento')));
 perform set_config('test.sid2',r->>'submission_id',true);perform set_config('test.op2',r->>'operation_id',true);
 if (select sum(quantity) from public.stock_movements where material_id=m)<>-125 then raise exception 'Conferência duplicou previsto';end if;
 if (select distributed_quantity::numeric from public.production_tracking where order_id=oid and workshop_id=w)<>100 then raise exception 'Complemento duplicou bolsas';end if;
 select count(*) into n from public.stock_movements where company_id=cid;
 perform set_config('test.movements',n::text,true);
 begin insert into public.shipment_delivery_confirmations default values;raise exception 'Inserção direta de confirmação aceita';exception when insufficient_privilege then null;end;
end $test$;
reset role;
-- Novas empresas também recebem o catálogo, sem cadastro manual.
do $test$ begin if (select count(*) from public.measurement_units where company_id=current_setting('test.other')::uuid)<>17 then raise exception 'Empresa nova sem catálogo';end if;end $test$;
update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
declare k uuid:=gen_random_uuid();r jsonb;sid uuid:=current_setting('test.sid')::uuid;cid uuid:=current_setting('test.company')::uuid;n bigint;
begin
 begin perform public.submit_shipment_checklist(gen_random_uuid(),current_setting('test.kit')::uuid,'[]');raise exception 'Motorista emitiu saída';exception when insufficient_privilege then null;end;
 begin perform public.record_kit_delivery(gen_random_uuid(),current_setting('test.kit')::uuid,'[]');raise exception 'Motorista baixou via API antiga';exception when insufficient_privilege then null;end;
 begin perform public.register_inventory_operation(gen_random_uuid(),'material_delivery');raise exception 'Motorista baixou direto';exception when insufficient_privilege then null;end;
 r:=public.confirm_shipment_delivery(k,sid,'Recebido na facção');
 if r<>public.confirm_shipment_delivery(k,sid,'Recebido na facção') then raise exception 'Replay da confirmação divergente';end if;
 begin perform public.confirm_shipment_delivery(k,sid,'Outra nota');raise exception 'Chave conflitante aceita';exception when invalid_parameter_value then null;end;
 begin perform public.confirm_shipment_delivery(gen_random_uuid(),sid);raise exception 'Entrega confirmada duas vezes';exception when invalid_parameter_value then null;end;
 if (select count(*) from public.stock_movements where company_id=cid)<>current_setting('test.movements')::bigint then raise exception 'Entrega movimentou estoque novamente';end if;
 if (select delivery_status from public.shipment_dispatches where submission_id=sid)<>'entregue' then raise exception 'Entrega não atualizou estado';end if;
 if not exists(select 1 from public.shipment_delivery_confirmations where submission_id=sid and created_by=current_setting('test.uid')::uuid and note='Recebido na facção') then raise exception 'Autor/nota ausentes';end if;
 update public.workshops set phone='__negado__' where id=current_setting('test.workshop')::uuid;get diagnostics n=row_count;
 if n<>0 then raise exception 'Motorista alterou contato';end if;
 begin delete from public.shipment_delivery_confirmations where submission_id=sid;raise exception 'Histórico apagável';exception when insufficient_privilege then null;end;
 -- Recolhimento continua disponível ao motorista.
 perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',current_setting('test.order')::uuid,current_setting('test.workshop')::uuid,'[{"quantity":"10"}]');
end $test$;
reset role;
update public.company_users set role='gerente_logistico' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ begin
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>current_setting('test.op2')::uuid);
 begin perform public.confirm_shipment_delivery(gen_random_uuid(),current_setting('test.sid2')::uuid);raise exception 'Romaneio estornado entregue';exception when invalid_parameter_value then null;end;
 if (select delivery_status from public.shipment_dispatches where submission_id=current_setting('test.sid2')::uuid)<>'estornado' then raise exception 'Estorno não visível';end if;
end $test$;
reset role;
update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ begin
 if not exists(select 1 from public.shipment_dispatches where submission_id=current_setting('test.sid')::uuid) then raise exception 'Gestor sem consulta';end if;
 begin perform public.confirm_shipment_delivery(gen_random_uuid(),current_setting('test.sid2')::uuid);raise exception 'Gestor confirmou entrega';exception when insufficient_privilege then null;end;
end $test$;
reset role;
update public.company_users set company_id=current_setting('test.other')::uuid,role='gerente_logistico' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ begin
 if exists(select 1 from public.shipment_dispatches where company_id=current_setting('test.company')::uuid) then raise exception 'Leitura cruzada da view';end if;
 if exists(select 1 from public.shipment_delivery_confirmations where company_id=current_setting('test.company')::uuid) then raise exception 'Leitura cruzada das confirmações';end if;
 begin perform public.confirm_shipment_delivery(gen_random_uuid(),current_setting('test.sid')::uuid);raise exception 'Confirmação cruzada aceita';exception when invalid_parameter_value then null;end;
end $test$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$ begin
 if exists(select 1 from public.shipment_dispatches) then raise exception 'Leitura sem identidade';end if;
 begin perform public.confirm_shipment_delivery(gen_random_uuid(),current_setting('test.sid')::uuid);raise exception 'Confirmação sem identidade';exception when insufficient_privilege then null;end;
end $test$;
reset role;
set local role anon;
do $test$ begin
 begin perform 1 from public.shipment_dispatches;raise exception 'Consulta anônima';exception when insufficient_privilege then null;end;
 begin perform public.confirm_shipment_delivery(gen_random_uuid(),current_setting('test.sid')::uuid);raise exception 'RPC anônima';exception when insufficient_privilege then null;end;
end $test$;
reset role;
select 'OK: unidades, contatos, emissão, entrega sem nova baixa, replay, estorno, perfis e isolamento' as resultado;
rollback;
