-- Fixtures temporárias; executar após as duas migrações de tipos/respostas.
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.companies(name) values('__respostas_rollback__') returning set_config('test.other',id::text,true);
insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.company')::uuid,'__resposta__','__resposta__') returning set_config('test.unit',id::text,true);
insert into public.materials(company_id,name,unit_id) values(current_setting('test.company')::uuid,'__resposta__',current_setting('test.unit')::uuid) returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__resposta__') returning set_config('test.bag',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__resposta__') returning set_config('test.workshop',id::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare
 cid uuid:=current_setting('test.company')::uuid; b uuid:=current_setting('test.bag')::uuid;
 m uuid:=current_setting('test.material')::uuid; w uuid:=current_setting('test.workshop')::uuid;
 t1 uuid; t2 uuid; oid uuid; kid uuid; i1 uuid; i2 uuid;
 k uuid:=gen_random_uuid(); r jsonb; answers jsonb; op uuid; sid uuid; n bigint;
begin
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,b,m,'Marcação','checkbox') returning id into t1;
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,b,m,'Texto','text') returning id into t2;
 oid:=(public.create_production_order(gen_random_uuid(),'__respostas__',b,100)->>'order_id')::uuid;
 kid:=(public.create_shipment_kit(gen_random_uuid(),oid,w,100,jsonb_build_array(jsonb_build_object('template_item_id',t1,'expected_quantity','100'),jsonb_build_object('template_item_id',t2,'expected_quantity','25')))->>'kit_id')::uuid;
 select id into i1 from public.shipment_kit_items where kit_id=kid and template_item_id=t1;
 select id into i2 from public.shipment_kit_items where kit_id=kid and template_item_id=t2;
 perform set_config('test.kit',kid::text,true);perform set_config('test.i1',i1::text,true);perform set_config('test.i2',i2::text,true);
 answers:=jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','pending'),jsonb_build_object('kit_item_id',i2,'mode','pending','text','Não enviado: aguardando material'));
 r:=public.submit_shipment_checklist(k,kid,answers,'Anotações gerais');sid:=(r->>'submission_id')::uuid;
 if r<>public.submit_shipment_checklist(k,kid,answers,'Anotações gerais') then raise exception 'Replay sem envio divergente';end if;
 if (r->>'operation_id') is not null or exists(select 1 from public.stock_movements where material_id=m) then raise exception 'Pendência gerou baixa';end if;
 if (select response_text from public.kit_checklist_answers where submission_id=sid and kit_item_id=i2) is distinct from 'Não enviado: aguardando material' then raise exception 'Texto livre não preservado';end if;
 if (select pending_items from public.shipment_kit_status where kit_id=kid)<>2 then raise exception 'Pendência foi atendida sem envio';end if;
 begin
  perform public.submit_shipment_checklist(k,kid,answers,'Mudou');raise exception 'Chave divergente aceita';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(answers->0));raise exception 'Respostas incompletas aceitas';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(answers->0,answers->0));raise exception 'Resposta repetida aceita';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','complete'),jsonb_build_object('kit_item_id',i2,'mode','complete')));raise exception 'Texto confirmado como checkbox';
 exception when invalid_parameter_value then null;end;
 if exists(select 1 from public.stock_movements where material_id=m) then raise exception 'Falha deixou baixa parcial';end if;
 begin
  perform public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','pending','quantity','1'),answers->1));raise exception 'Pendência com quantidade aceita';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(answers->0,jsonb_build_object('kit_item_id',i2,'mode','partial','quantity','NaN','text','Texto')));raise exception 'NaN aceito';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(answers->0,jsonb_build_object('kit_item_id',i2,'mode','partial','quantity','2','text',123)));raise exception 'Resposta numérica usada como texto';
 exception when invalid_parameter_value then null;end;
 answers:=jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','partial','quantity','20'),jsonb_build_object('kit_item_id',i2,'mode','partial','quantity','3','text','Conteúdo livre: tamanho 50, cor azul'));
 k:=gen_random_uuid();r:=public.submit_shipment_checklist(k,kid,answers,'Primeira saída');op:=(r->>'operation_id')::uuid;
 if r<>public.submit_shipment_checklist(k,kid,answers,'Primeira saída') then raise exception 'Replay da saída divergente';end if;
 if (select sum(quantity) from public.stock_movements where material_id=m)<>-23 then raise exception 'Texto interpretado como quantidade ou envio duplicado';end if;
 if not(r->'warnings' @> '[{"code":"saldo_negativo"}]') then raise exception 'Aviso de estoque negativo ausente';end if;
 answers:=jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','complete','quantity','999999'),jsonb_build_object('kit_item_id',i2,'mode','partial','quantity','22','text','Complemento'));
 r:=public.submit_shipment_checklist(gen_random_uuid(),kid,answers,'Segunda saída');sid:=(r->>'submission_id')::uuid;
 if (select quantity from public.kit_checklist_answers where submission_id=sid and kit_item_id=i1)<>80 then raise exception 'Conferência não usou saldo real';end if;
 if (select sum(quantity) from public.stock_movements where material_id=m)<>-125 then raise exception 'Conferência duplicou quantidade prevista';end if;
 if (select status from public.shipment_kit_status where kit_id=kid)<>'completo' then raise exception 'Kit não completou';end if;
 select count(*) into n from public.inventory_operations;
 perform public.submit_shipment_checklist(gen_random_uuid(),kid,jsonb_build_array(jsonb_build_object('kit_item_id',i1,'mode','complete'),jsonb_build_object('kit_item_id',i2,'mode','pending','text','Já atendido')));
 if (select count(*) from public.inventory_operations)<>n then raise exception 'Checkbox completo gerou nova baixa';end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>op);
 if (select remaining_quantity from public.shipment_kit_item_progress where kit_item_id=i1)<>20 or (select remaining_quantity from public.shipment_kit_item_progress where kit_item_id=i2)<>3 then raise exception 'Estorno não reabriu pendências';end if;
 if (select count(*) from public.kit_checklist_submissions where kit_id=kid)<>4 then raise exception 'Histórico de preenchimentos alterado';end if;
 begin delete from public.kit_checklist_submissions where id=sid;raise exception 'Histórico apagável';exception when insufficient_privilege then null;end;
 begin insert into public.kit_checklist_submissions default values;raise exception 'Inserção direta permitida';exception when insufficient_privilege then null;end;
 begin update public.kit_checklist_answers set quantity=0 where submission_id=sid;raise exception 'Resposta alterável diretamente';exception when insufficient_privilege then null;end;
end $test$;
reset role;
update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 perform public.submit_shipment_checklist(gen_random_uuid(),current_setting('test.kit')::uuid,jsonb_build_array(jsonb_build_object('kit_item_id',current_setting('test.i1'),'mode','complete'),jsonb_build_object('kit_item_id',current_setting('test.i2'),'mode','partial','quantity','3','text','Motorista complementou')),'Registrado em campo');
end $test$;
reset role;
update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 if not exists(select 1 from public.kit_checklist_submissions) then raise exception 'Gestor sem consulta';end if;
 begin perform public.submit_shipment_checklist(gen_random_uuid(),current_setting('test.kit')::uuid,'[]');raise exception 'Gestor registrou saída';exception when insufficient_privilege then null;end;
end $test$;
reset role;
update public.company_users set company_id=current_setting('test.other')::uuid,role='gerente_logistico' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
begin
 if exists(select 1 from public.kit_checklist_submissions) or exists(select 1 from public.kit_checklist_answers) then raise exception 'Vazamento entre empresas';end if;
 begin perform public.submit_shipment_checklist(gen_random_uuid(),current_setting('test.kit')::uuid,jsonb_build_array(jsonb_build_object('kit_item_id',current_setting('test.i1'),'mode','complete')));raise exception 'Acesso ao kit alheio';exception when invalid_parameter_value then null;end;
end $test$;
reset role;
set local role anon;
do $test$
begin
 begin perform 1 from public.kit_checklist_answers;raise exception 'Anônimo leu respostas';exception when insufficient_privilege then null;end;
 begin perform public.submit_shipment_checklist(gen_random_uuid(),null,'[]');raise exception 'Anônimo executou RPC';exception when insufficient_privilege then null;end;
end $test$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$
begin
 begin perform public.submit_shipment_checklist(gen_random_uuid(),null,'[]');raise exception 'Sem identidade executou RPC';exception when insufficient_privilege then null;end;
end $test$;
reset role;
rollback;
