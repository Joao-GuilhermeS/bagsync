begin;

-- Executar como administrador em sessão isolada. Fixtures apenas transacionais.
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.companies(name) values ('__teste_transacional__') returning set_config('test.other',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.other')::uuid,'__oculta__');
insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.other')::uuid,'__teste__','__teste__') returning set_config('test.other_unit',id::text,true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare u uuid; m uuid; b uuid; w uuid; affected integer;
begin
 if exists(select 1 from public.workshops where company_id=current_setting('test.other')::uuid) then raise exception 'Vazamento entre empresas'; end if;
 insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__teste__') returning id into w;
 update public.workshops set name='__teste_alterado__' where id=w;
 get diagnostics affected=row_count;
 if affected<>1 then raise exception 'Gerente nao atualizou'; end if;
 delete from public.workshops where id=w;
 insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.company')::uuid,'__teste__','__teste__') returning id into u;
 insert into public.materials(company_id,unit_id,name) values(current_setting('test.company')::uuid,u,'__teste__') returning id into m;
 insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__teste__') returning id into b;
 insert into public.bag_materials values(current_setting('test.company')::uuid,b,m,0.25);
 begin
  insert into public.bag_materials values(current_setting('test.company')::uuid,b,m,0.25);
  raise exception 'Duplicacao aceita';
 exception when unique_violation then null; end;
 begin
  update public.bag_materials set quantity='NaN'::numeric where bag_id=b;
  raise exception 'NaN aceito';
 exception when check_violation then null; end;
 begin
  update public.bag_materials set quantity=0 where bag_id=b;
  raise exception 'Quantidade zero aceita';
 exception when check_violation then null; end;
 begin
  insert into public.materials(company_id,unit_id,name) values(current_setting('test.company')::uuid,current_setting('test.other_unit')::uuid,'__invalido__');
  raise exception 'FK entre empresas aceita';
 exception when foreign_key_violation then null; end;
 begin
  update public.bags set company_id=current_setting('test.other')::uuid where id=b;
  raise exception 'Transferencia entre empresas aceita';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.workshops(company_id,name) values(current_setting('test.other')::uuid,'__invalido__');
  raise exception 'Escrita em outra empresa aceita';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.materials where id=m;
  raise exception 'Exclusao de material referenciado aceita';
 exception when foreign_key_violation then null; end;
 begin
  insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'   ');
  raise exception 'Nome vazio aceito';
 exception when check_violation then null; end;
end $test$;
reset role;

update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
declare t text; n integer;
begin
 foreach t in array array['workshops','measurement_units','materials','bags','bag_materials'] loop
  execute format('select count(*) from public.%I where company_id=$1',t) into n using current_setting('test.other')::uuid;
  if n<>0 then raise exception 'Leitura cruzada: %',t; end if;
  execute format('delete from public.%I where company_id=$1',t) using current_setting('test.company')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Exclusao indevida: %',t; end if;
 end loop;
 if not exists(select 1 from public.bags where company_id=current_setting('test.company')::uuid) then raise exception 'Consulta propria bloqueada'; end if;
 begin
  insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__negado__');
  raise exception 'Escrita indevida';
 exception when insufficient_privilege then null; end;
 update public.bags set name='__negado__';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Alteracao indevida'; end if;
end $test$;
reset role;

update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$
declare t text; n integer;
begin
 foreach t in array array['workshops','measurement_units','materials','bags','bag_materials'] loop
  execute format('select count(*) from public.%I where company_id=$1',t) into n using current_setting('test.other')::uuid;
  if n<>0 then raise exception 'Leitura cruzada: %',t; end if;
  execute format('delete from public.%I where company_id=$1',t) using current_setting('test.company')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Exclusao indevida: %',t; end if;
 end loop;
 if not exists(select 1 from public.bags where company_id=current_setting('test.company')::uuid) then raise exception 'Consulta propria bloqueada'; end if;
 begin
  insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__negado__');
  raise exception 'Escrita indevida';
 exception when insufficient_privilege then null; end;
 update public.bags set name='__negado__';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Alteracao indevida'; end if;
end $test$;
reset role;

select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$ begin
 if exists(select 1 from public.bags) then raise exception 'Consulta sem identidade'; end if;
end $test$;
reset role;
set local role anon;
do $test$ begin
 begin perform 1 from public.bags; raise exception 'Leitura anonima aceita';
 exception when insufficient_privilege then null; end;
end $test$;
reset role;
select 'OK: integridade, CRUD gerente, leituras por perfil, isolamento e acesso anonimo' as resultado;
rollback;
