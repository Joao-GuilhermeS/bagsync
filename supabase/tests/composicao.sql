
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
select set_config('test.stock_count',(select count(*)::text from public.stock_movements),true);
insert into public.companies(name) values('__teste_composicao__') returning set_config('test.other',id::text,true);
insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.company')::uuid,'__teste__',gen_random_uuid()::text) returning set_config('test.unit',id::text,true);
insert into public.materials(company_id,name,unit_id) values(current_setting('test.company')::uuid,'__teste__',current_setting('test.unit')::uuid) returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__teste__') returning set_config('test.bag',id::text,true);
insert into public.measurement_units(company_id,name,symbol) values(current_setting('test.other')::uuid,'__teste__','__teste__') returning set_config('test.other_unit',id::text,true);
insert into public.materials(company_id,name,unit_id) values(current_setting('test.other')::uuid,'__teste__',current_setting('test.other_unit')::uuid) returning set_config('test.other_material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.other')::uuid,'__teste__') returning set_config('test.other_bag',id::text,true);
insert into public.bag_materials values(current_setting('test.other')::uuid,current_setting('test.other_bag')::uuid,current_setting('test.other_material')::uuid,1);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare cid uuid:=current_setting('test.company')::uuid;bid uuid:=current_setting('test.bag')::uuid;mid uuid:=current_setting('test.material')::uuid;n integer;
begin
 insert into public.bag_materials values(cid,bid,mid,0.125);
 update public.bag_materials set quantity=0.000000000000000001 where company_id=cid and bag_id=bid and material_id=mid;
 if (select quantity from public.bag_materials where bag_id=bid and material_id=mid)<>0.000000000000000001 then raise exception 'Precisao perdida';end if;
 begin insert into public.bag_materials values(cid,bid,mid,2);raise exception 'Duplicacao aceita';exception when unique_violation then null;end;
 begin insert into public.bag_materials values(cid,bid,current_setting('test.other_material')::uuid,1);raise exception 'Material de outra empresa aceito';exception when foreign_key_violation then null;end;
 begin update public.bag_materials set quantity=-1 where bag_id=bid;raise exception 'Quantidade negativa aceita';exception when check_violation then null;end;
 if exists(select 1 from public.bag_materials where bag_id=current_setting('test.other_bag')::uuid) then raise exception 'Leitura cruzada';end if;
 delete from public.bag_materials where bag_id=bid and material_id=mid;
 get diagnostics n=row_count;if n<>1 then raise exception 'Gerente nao removeu';end if;
 insert into public.bag_materials values(cid,bid,mid,0.5);
end $test$;
reset role;

update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ declare n integer;begin
 if not exists(select 1 from public.bag_materials where bag_id=current_setting('test.bag')::uuid) then raise exception 'Consulta propria bloqueada';end if;
 if exists(select 1 from public.bag_materials where bag_id=current_setting('test.other_bag')::uuid) then raise exception 'Leitura de outra empresa';end if;
 update public.bag_materials set quantity=10 where bag_id=current_setting('test.bag')::uuid;
 get diagnostics n=row_count;if n<>0 then raise exception 'Atualizacao indevida';end if;
 delete from public.bag_materials where bag_id=current_setting('test.bag')::uuid;
 get diagnostics n=row_count;if n<>0 then raise exception 'Exclusao indevida';end if;
 begin insert into public.bag_materials values(current_setting('test.company')::uuid,current_setting('test.bag')::uuid,current_setting('test.material')::uuid,1);raise exception 'Insercao indevida';exception when insufficient_privilege then null;end;
end $test$;
reset role;

update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $test$ declare n integer;begin
 if not exists(select 1 from public.bag_materials where bag_id=current_setting('test.bag')::uuid) then raise exception 'Consulta propria bloqueada';end if;
 if exists(select 1 from public.bag_materials where bag_id=current_setting('test.other_bag')::uuid) then raise exception 'Leitura de outra empresa';end if;
 update public.bag_materials set quantity=10 where bag_id=current_setting('test.bag')::uuid;
 get diagnostics n=row_count;if n<>0 then raise exception 'Atualizacao indevida';end if;
 delete from public.bag_materials where bag_id=current_setting('test.bag')::uuid;
 get diagnostics n=row_count;if n<>0 then raise exception 'Exclusao indevida';end if;
 begin insert into public.bag_materials values(current_setting('test.company')::uuid,current_setting('test.bag')::uuid,current_setting('test.material')::uuid,1);raise exception 'Insercao indevida';exception when insufficient_privilege then null;end;
end $test$;
reset role;

select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $test$ begin if exists(select 1 from public.bag_materials) then raise exception 'Leitura sem identidade';end if;end $test$;
reset role;
set local role anon;
do $test$ begin
 begin perform 1 from public.bag_materials;raise exception 'Leitura anonima';exception when insufficient_privilege then null;end;
end $test$;
reset role;
do $test$ begin
 if (select count(*) from public.stock_movements)<>current_setting('test.stock_count')::bigint then raise exception 'Composicao movimentou estoque';end if;
end $test$;
select 'OK: CRUD de composicao, precisao, isolamento, perfis e ausencia de baixa automatica' as resultado;
rollback;
