-- Exercícios de autorização sem contas, senhas ou dados persistentes.
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.account_principals(company_id,user_id) values(current_setting('test.company')::uuid,current_setting('test.uid')::uuid) on conflict(company_id) do nothing;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $$
declare request_id uuid:=gen_random_uuid(); target uuid:=gen_random_uuid(); roles_access text[]:=array['inicio','consultas','observacoes','rotas','contas'];
begin
 if not (public.get_access_context()->>'isPrimary')::boolean then raise exception 'Principal não identificada';end if;
 perform public.set_account_role_limit(gen_random_uuid(),'gestor',roles_access,array['inicio','consultas','motorista','observacoes','contas','rotas']);
 perform public.prepare_account_creation(request_id,'__access__','__access__@example.invalid','gestor',roles_access,repeat('a',64));
 begin perform public.prepare_account_creation(request_id,'Outro','__access__@example.invalid','gestor',roles_access,repeat('a',64));raise exception 'Payload divergente aceito';exception when insufficient_privilege then null;end;
 perform set_config('test.req',request_id::text,true);perform set_config('test.newuser',target::text,true);
 begin perform public.complete_account_creation(request_id,target);raise exception 'Identidade falsa aceita';exception when insufficient_privilege then null;end;
 begin update public.account_principals set user_id=target;raise exception 'Principal alterada diretamente';exception when insufficient_privilege then null;end;
 begin perform public.update_account_access(gen_random_uuid(),auth.uid(),'Principal','gerente_logistico',array['consultas'],true);raise exception 'Principal alterada via RPC';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into auth.users(id,email,raw_app_meta_data,email_confirmed_at) values(current_setting('test.newuser')::uuid,'__access__@example.invalid',jsonb_build_object('bagsync_provision_request',current_setting('test.req')),now());
set local role authenticated;
do $$
declare n bigint;
begin
 perform public.complete_account_creation(current_setting('test.req')::uuid,current_setting('test.newuser')::uuid);
 perform public.complete_account_creation(current_setting('test.req')::uuid,current_setting('test.newuser')::uuid);
 select count(*) into n from jsonb_array_elements(public.get_access_administration()->'events') e where e->>'operation'='criacao' and e->>'target_id'=current_setting('test.newuser');
 if n<>1 then raise exception 'Replay criou evento duplicado';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.newuser'),'role','authenticated')::text,true);
do $$
begin
 if not public.has_permission('contas') or public.has_permission('cadastros') then raise exception 'Permissões do Gestor incorretas';end if;
 perform public.prepare_account_creation(gen_random_uuid(),'Motorista de teste','__driver__@example.invalid','motorista',array['inicio','motorista'],repeat('b',64));
 begin perform public.set_account_role_limit(gen_random_uuid(),'motorista',array['consultas'],array['consultas']);raise exception 'Gestor alterou limite';exception when insufficient_privilege then null;end;
 begin perform public.prepare_account_creation(gen_random_uuid(),'Escalada','__escalation__@example.invalid','gerente_logistico',array['contas'],repeat('c',64));raise exception 'Escalada por perfil administrador';exception when insufficient_privilege then null;end;
 begin perform public.prepare_account_creation(gen_random_uuid(),'Escalada','__escalation__@example.invalid','gerente_logistico',array['cadastros'],repeat('c',64));raise exception 'Concedeu além do teto';exception when insufficient_privilege then null;end;
 begin perform public.lookup_account_provision_user(current_setting('test.req')::uuid);raise exception 'Lookup administrativo exposto';exception when insufficient_privilege then null;end;
 begin update public.company_users set role='gerente_logistico' where user_id=auth.uid();raise exception 'Autoelevação direta';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
select public.update_account_access(gen_random_uuid(),current_setting('test.newuser')::uuid,'__access__','gerente_logistico',array['inicio','consultas'],true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.newuser'),'role','authenticated')::text,true);
do $$ begin
 begin perform public.create_production_order(gen_random_uuid(),'Negado',gen_random_uuid(),1);raise exception 'RPC de pedido ignorou máscara';exception when insufficient_privilege then null;end;
 begin insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__not_allowed__');raise exception 'RLS ignorou máscara';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
select public.update_account_access(gen_random_uuid(),current_setting('test.newuser')::uuid,'__access__','gestor',array['inicio','consultas'],false);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.newuser'),'role','authenticated')::text,true);
do $$ begin
 if public.has_permission('consultas') or public.has_permission('inicio') then raise exception 'Bloqueio não removeu acesso';end if;
 if exists(select 1 from public.bags where company_id=current_setting('test.company')::uuid) then raise exception 'Conta bloqueada leu dados';end if;
end $$;
reset role;
insert into public.companies(name) values('__access_other__') returning set_config('test.other',id::text,true);
insert into auth.users(id,email) values(gen_random_uuid(),'__other__@example.invalid') returning set_config('test.other_user',id::text,true);
insert into public.company_users(user_id,company_id,role) values(current_setting('test.other_user')::uuid,current_setting('test.other')::uuid,'gerente_logistico');
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 begin perform public.update_account_access(gen_random_uuid(),current_setting('test.other_user')::uuid,'Outro','motorista',array['consultas'],false);raise exception 'Alterou outra empresa';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.get_access_administration();raise exception 'Anônimo leu contas';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
