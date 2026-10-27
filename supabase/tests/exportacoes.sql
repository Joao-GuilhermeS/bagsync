begin;


select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.companies(name) values('__teste_rollback__') returning set_config('test.other',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.other')::uuid,'__oculta__') returning set_config('test.other_workshop',id::text,true);
insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.company')::uuid,'__teste__','__teste_operacao__') returning set_config('test.unit',id::text,true);
insert into public.materials(company_id,name,unit_id) values(current_setting('test.company')::uuid,'__teste__',current_setting('test.unit')::uuid) returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__teste__') returning set_config('test.bag',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__teste1__') returning set_config('test.workshop',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__teste2__') returning set_config('test.workshop2',id::text,true);

insert into public.bags(company_id,name) values(current_setting('test.other')::uuid,'__bolsa_oculta__') returning set_config('test.other_bag',id::text,true);
insert into public.production_orders(company_id,request_key,name,bag_id,expected_quantity,created_by)
values(current_setting('test.other')::uuid,gen_random_uuid(),'__pedido_oculto__',current_setting('test.other_bag')::uuid,10,current_setting('test.uid')::uuid)
returning set_config('test.other_order',id::text,true);
insert into public.inventory_operations(company_id,request_key,kind,order_id,workshop_id,payload,created_by)
values(current_setting('test.other')::uuid,gen_random_uuid(),'bag_receipt',current_setting('test.other_order')::uuid,current_setting('test.other_workshop')::uuid,'{}',current_setting('test.uid')::uuid)
returning set_config('test.other_operation',id::text,true);
insert into public.stock_movements(company_id,operation_id,bag_id,quantity)
values(current_setting('test.other')::uuid,current_setting('test.other_operation')::uuid,current_setting('test.other_bag')::uuid,3);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare
 oid uuid; r jsonb; again jsonb; k uuid:=gen_random_uuid(); entry_key uuid:=gen_random_uuid(); receipt_id uuid; delivery_id uuid; n integer; qty numeric;
 mat jsonb; cid uuid:=current_setting('test.company')::uuid; b uuid:=current_setting('test.bag')::uuid; w uuid:=current_setting('test.workshop')::uuid;
begin
 r:=public.create_production_order(k,'__pedido__',b,10);
 oid:=(r->>'order_id')::uuid;
 if r<>public.create_production_order(k,'__pedido__',b,10) then raise exception 'Pedido duplicado'; end if;
 perform set_config('test.order',oid::text,true);
 begin
  perform public.create_production_order(k,'__outro__',b,10);
  raise exception 'Chave pedido divergente aceita';
 exception when invalid_parameter_value then null; end;
 mat:=jsonb_build_array(jsonb_build_object('material_id',current_setting('test.material'),'quantity','2.5'));
 r:=public.register_inventory_operation(entry_key,'material_entry',p_items=>mat);
 again:=public.register_inventory_operation(entry_key,'material_entry',p_items=>mat);
 if r<>again then raise exception 'Replay divergente'; end if;
 if (select count(*) from public.inventory_operations where request_key=entry_key)<>1 then raise exception 'Entrada duplicada'; end if;
 begin
  perform public.register_inventory_operation(entry_key,'material_entry',p_items=>'[]');
  raise exception 'Chave divergente aceita';
 exception when invalid_parameter_value then null; end;
 r:=public.register_inventory_operation(gen_random_uuid(),'material_delivery',oid,w,jsonb_build_array(jsonb_build_object('material_id',current_setting('test.material'),'quantity','5')));
 delivery_id:=(r->>'operation_id')::uuid;
 if not (r->'warnings' @> '[{"code":"saldo_negativo"}]') then raise exception 'Aviso de saldo ausente'; end if;
 select sum(quantity) into qty from public.stock_movements where material_id=current_setting('test.material')::uuid;
 if qty<>-2.5 then raise exception 'Saldo incorreto'; end if;
 r:=public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,w,'[{"quantity":"4"}]');
 receipt_id:=(r->>'operation_id')::uuid;
 r:=public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,current_setting('test.workshop2')::uuid,'[{"quantity":"7"}]');
 if not (r->'warnings' @> '[{"code":"recebimento_excedente"}]') then raise exception 'Aviso excedente ausente'; end if;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>receipt_id);
 select sum(s.quantity) into qty from public.stock_movements s join public.inventory_operations o on o.id=s.operation_id where o.order_id=oid and s.bag_id=b;
 if qty<>7 then raise exception 'Estorno nao abateu'; end if;
 begin
  perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>receipt_id);
  raise exception 'Duplo estorno aceito';
 exception when unique_violation then null; end;
 perform public.register_inventory_operation(gen_random_uuid(),'reversal',p_reversal_of=>delivery_id);
 select sum(quantity) into qty from public.stock_movements where material_id=current_setting('test.material')::uuid;
 if qty<>2.5 then raise exception 'Estorno material incorreto'; end if;
 select count(*) into n from public.inventory_operations;
 begin
  perform public.register_inventory_operation(gen_random_uuid(),'material_entry',p_items=>mat||jsonb_build_array(jsonb_build_object('material_id',gen_random_uuid(),'quantity','1')));
  raise exception 'Item invalido aceito';
 exception when invalid_parameter_value then null; end;
 if (select count(*) from public.inventory_operations)<>n then raise exception 'Operacao parcial persistiu'; end if;
 begin
  perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,current_setting('test.other_workshop')::uuid,'[{"quantity":"1"}]');
  raise exception 'Faccao de outra empresa aceita';
 exception when foreign_key_violation then null; end;
 begin
  perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,w,'[{"quantity":"0.5"}]');
  raise exception 'Bolsa fracionada aceita';
 exception when invalid_parameter_value then null; end;
 begin
  insert into public.stock_movements(company_id,operation_id,bag_id,quantity) values(cid,receipt_id,b,10);
  raise exception 'Escrita direta aceita';
 exception when insufficient_privilege then null; end;
 if exists(select 1 from public.production_orders where company_id=current_setting('test.other')::uuid) then raise exception 'Leitura cruzada'; end if;
end $test$;
reset role;
update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
declare oid uuid:=current_setting('test.order')::uuid; w uuid:=current_setting('test.workshop')::uuid;
begin
 perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',oid,w,'[{"quantity":"1"}]');
 begin perform public.register_inventory_operation(gen_random_uuid(),'material_delivery',oid,w,jsonb_build_array(jsonb_build_object('material_id',current_setting('test.material'),'quantity','1')));raise exception 'Motorista emitiu saída de Expedição';exception when insufficient_privilege then null;end;
 begin
  perform public.create_production_order(gen_random_uuid(),'__negado__',current_setting('test.bag')::uuid,1);
  raise exception 'Motorista criou pedido';
 exception when insufficient_privilege then null; end;
 begin
  perform public.register_inventory_operation(gen_random_uuid(),'material_entry',p_items=>'[]');
  raise exception 'Motorista criou entrada';
 exception when insufficient_privilege then null; end;
 begin
  perform public.register_inventory_operation(gen_random_uuid(),'reversal');
  raise exception 'Motorista estornou';
 exception when insufficient_privilege then null; end;
end $test$;
reset role;
update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ begin
 if not exists(select 1 from public.production_orders) then raise exception 'Gestor sem consulta'; end if;
 begin
  perform public.register_inventory_operation(gen_random_uuid(),'bag_receipt',current_setting('test.order')::uuid,current_setting('test.workshop')::uuid,'[{"quantity":"1"}]');
  raise exception 'Gestor escreveu';
 exception when insufficient_privilege then null; end;
end $test$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$ begin
 if exists(select 1 from public.stock_movements) then raise exception 'Consulta sem identidade'; end if;
 begin
  perform public.create_production_order(gen_random_uuid(),'__negado__',current_setting('test.bag')::uuid,1);
  raise exception 'Sem vinculo criou pedido';
 exception when insufficient_privilege then null; end;
end $test$;
reset role;
set local role anon;
do $test$ begin
 begin perform 1 from public.stock_movements; raise exception 'Anon leu';
 exception when insufficient_privilege then null; end;
 begin
  perform public.create_production_order(gen_random_uuid(),'__negado__',null,1);
  raise exception 'Anon chamou RPC';
 exception when insufficient_privilege then null; end;
end $test$;
reset role;
select 'OK: pedidos, recebimentos parciais, excedente, saldo, estornos, idempotencia, atomicidade, integridade e perfis' as resultado;

-- Leitura de saldos/progresso sob RLS, usando o usuário do teste.
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare q numeric;
begin
 select balance into q from public.material_stock_balances where material_id=current_setting('test.material')::uuid;
 if q<>2.5 then raise exception 'View saldo material incorreta'; end if;
 select received_quantity into q from public.production_order_progress where order_id=current_setting('test.order')::uuid;
 if q<>8 then raise exception 'View progresso incorreta'; end if;
 if exists(select 1 from public.bag_stock_balances where company_id=current_setting('test.other')::uuid) then raise exception 'View vazou dados'; end if;
end $test$;
reset role;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$ begin
 if exists(select 1 from public.inventory_operations where company_id=current_setting('test.other')::uuid)
 or exists(select 1 from public.stock_movements where company_id=current_setting('test.other')::uuid)
 or exists(select 1 from public.production_order_progress where company_id=current_setting('test.other')::uuid)
 then raise exception 'Vazamento com registros reais de teste em outra empresa'; end if;
end $test$;
reset role;
select 'OK: suíte e views validadas; rollback obrigatório' as resultado;


select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare report jsonb;op jsonb;item jsonb;stamp timestamptz;
begin
 report:=public.export_inventory_operations(p_order=>current_setting('test.order')::uuid);
 if report->>'too_large'<>'false' or jsonb_array_length(report->'operations')=0 then raise exception 'Relatorio proprio vazio';end if;
 for op in select value from jsonb_array_elements(report->'operations') loop
  if op->>'order_id'<>current_setting('test.order') then raise exception 'Filtro de pedido ignorado';end if;
  for item in select value from jsonb_array_elements(op->'items') loop
   if jsonb_typeof(item->'quantity')<>'string' then raise exception 'Quantidade nao textual';end if;
  end loop;
 end loop;
 if not exists(select 1 from jsonb_array_elements(report->'operations') x where (x->>'is_reversed')::boolean) then raise exception 'Estorno original nao identificado';end if;
 report:=public.export_inventory_operations(p_workshop=>current_setting('test.workshop')::uuid);
 for op in select value from jsonb_array_elements(report->'operations') loop
  if op->>'workshop_id'<>current_setting('test.workshop') then raise exception 'Filtro faccao ignorado';end if;
 end loop;
 report:=public.export_inventory_operations(p_operation=>current_setting('test.other_operation')::uuid);
 if jsonb_array_length(report->'operations')<>0 then raise exception 'Exportou outra empresa';end if;
 select created_at into stamp from public.inventory_operations where order_id=current_setting('test.order')::uuid limit 1;
 report:=public.export_inventory_operations(p_order=>current_setting('test.order')::uuid,p_until=>stamp);
 if jsonb_array_length(report->'operations')<>0 then raise exception 'Limite final nao exclusivo';end if;
 report:=public.export_inventory_operations(p_order=>current_setting('test.order')::uuid,p_since=>stamp);
 if jsonb_array_length(report->'operations')=0 then raise exception 'Limite inicial nao inclusivo';end if;
end $test$;
reset role;

update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ begin
 if jsonb_array_length(public.export_inventory_operations(p_order=>current_setting('test.order')::uuid)->'operations')=0 then raise exception 'Perfil perdeu consulta';end if;
end $test$;
reset role;

update public.company_users set role='gerente_logistico' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ begin
 if jsonb_array_length(public.export_inventory_operations(p_order=>current_setting('test.order')::uuid)->'operations')=0 then raise exception 'Perfil perdeu consulta';end if;
end $test$;
reset role;

insert into public.inventory_operations(company_id,request_key,kind,payload,created_by)
select current_setting('test.company')::uuid,gen_random_uuid(),'material_entry','{}'::jsonb,current_setting('test.uid')::uuid from generate_series(1,10001);
set local role authenticated;
do $test$ begin
 if public.export_inventory_operations()->>'too_large'<>'true' then raise exception 'Limite de relatorio nao aplicado';end if;
 if public.export_inventory_operations(p_order=>current_setting('test.order')::uuid)->>'too_large'<>'false' then raise exception 'Filtro nao reduz relatorio';end if;
end $test$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$ begin
 if jsonb_array_length(public.export_inventory_operations()->'operations')<>0 then raise exception 'Exportacao sem identidade';end if;
end $test$;
reset role;
set local role anon;
do $test$ begin
 begin perform public.export_inventory_operations();raise exception 'Anon executou exportacao';exception when insufficient_privilege then null;end;
end $test$;
reset role;
select 'OK: snapshot, filtros, perfis, RLS, limite e quantidade textual' as resultado;

rollback;
