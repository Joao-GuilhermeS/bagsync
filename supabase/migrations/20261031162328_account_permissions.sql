-- Contas administradas, limites de concessão e autorizações por funcionalidade.
-- Identidade principal confirmada; nenhuma senha/credencial é armazenada nesta migration.
create function bagsync_private.role_features(p_role text) returns text[] language sql immutable set search_path='' as $$
 select case p_role
 when 'gerente_logistico' then array['inicio','consultas','cadastros','pedidos','estoque','expedicao','motorista','observacoes','prazos','rotas','contas']
 when 'gestor' then array['inicio','consultas','observacoes','rotas','contas']
 when 'motorista' then array['inicio','consultas','motorista','observacoes']
 else array[]::text[] end;
$$;
revoke all on function bagsync_private.role_features(text) from public,anon,authenticated;
alter table public.company_users add constraint company_users_company_user_key unique(company_id,user_id);
create table public.account_principals(
 company_id uuid primary key references public.companies(id),
 user_id uuid not null unique references public.company_users(user_id),
 foreign key(company_id,user_id) references public.company_users(company_id,user_id)
);
insert into public.account_principals(company_id,user_id)
 select company_id,user_id from public.company_users where user_id='aeaa0519-cad6-453f-ae6a-0787dd527120' and company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f';
create table public.account_settings(
 user_id uuid primary key references public.company_users(user_id),
 company_id uuid not null references public.companies(id),
 full_name text not null check(length(btrim(full_name)) between 1 and 120),
 permissions text[] not null,
 active boolean not null default true,
 updated_at timestamptz not null default now(),
 foreign key(company_id,user_id) references public.company_users(company_id,user_id)
);
create index account_settings_company_idx on public.account_settings(company_id);
create table public.account_role_limits(
 company_id uuid not null references public.companies(id),
 role text not null check(role in('gerente_logistico','motorista','gestor')),
 permissions text[] not null,
 grant_permissions text[] not null,
 primary key(company_id,role)
);
create table public.account_access_events(
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 request_key uuid not null,
 actor_id uuid not null references auth.users(id),
 target_id uuid references auth.users(id),
 operation text not null,
 payload jsonb not null,
 created_at timestamptz not null default now(),
 unique(company_id,request_key)
);
create index account_events_company_idx on public.account_access_events(company_id,created_at desc,id);
create index account_events_actor_idx on public.account_access_events(actor_id);
create index account_events_target_idx on public.account_access_events(target_id);
create table bagsync_private.account_provision_requests(
 id uuid primary key,
 company_id uuid not null references public.companies(id),
 actor_id uuid not null references auth.users(id),
 full_name text not null,
 email text not null,
 role text not null,
 permissions text[] not null,
 password_fingerprint text not null,
 created_at timestamptz not null default now(),
 lease_until timestamptz not null,
 user_id uuid references auth.users(id)
);
create index provision_email_idx on bagsync_private.account_provision_requests(company_id,email);
revoke all on bagsync_private.account_provision_requests from public,anon,authenticated;
alter table public.account_principals enable row level security;
alter table public.account_settings enable row level security;
alter table public.account_role_limits enable row level security;
alter table public.account_access_events enable row level security;
revoke all on public.account_principals,public.account_settings,public.account_role_limits,public.account_access_events from public,anon,authenticated;
-- Dados administrativos são lidos por RPC que valida a capacidade contas, sem escrita direta.

create function bagsync_private.effective_features(p_user uuid) returns text[] language plpgsql stable security definer set search_path='' as $$
declare m public.company_users; s public.account_settings; lim text[];
begin
 select * into m from public.company_users where user_id=p_user;
 if not found then return array[]::text[];end if;
 if exists(select 1 from public.account_principals where company_id=m.company_id and user_id=p_user) then return bagsync_private.role_features('gerente_logistico');end if;
 select * into s from public.account_settings where user_id=p_user and company_id=m.company_id;
 if found and not s.active then return array[]::text[];end if;
 select permissions into lim from public.account_role_limits where company_id=m.company_id and role=m.role;
 return array(select distinct x from unnest(coalesce(s.permissions,bagsync_private.role_features(m.role))) x
  where x=any(bagsync_private.role_features(m.role)) and x=any(coalesce(lim,bagsync_private.role_features(m.role))) order by x);
end $$;
revoke all on function bagsync_private.effective_features(uuid) from public,anon,authenticated;
create function public.has_permission(p_permission text) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(p_permission=any(bagsync_private.effective_features(auth.uid())),false);
$$;
revoke all on function public.has_permission(text) from public,anon,authenticated;
grant execute on function public.has_permission(text) to authenticated;
create function bagsync_private.require_feature(p_permission text) returns void language plpgsql set search_path='' as $$
begin if not public.has_permission(p_permission) then raise exception using errcode='42501',message='Funcionalidade não autorizada.';end if;end $$;
revoke all on function bagsync_private.require_feature(text) from public,anon,authenticated;
create or replace function bagsync_private.lock_company(p_roles text[]) returns uuid language plpgsql set search_path='' as $$
declare cid uuid;
begin
 select company_id into cid from public.company_users where user_id=auth.uid() and role=any(p_roles);
 if cid is null or cardinality(bagsync_private.effective_features(auth.uid()))=0 then raise exception using errcode='42501',message='Acesso não autorizado.';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(cid::text,0));return cid;
end $$;
create function public.get_access_context() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('userId',m.user_id,'companyId',m.company_id,'role',m.role,
 'permissions',bagsync_private.effective_features(m.user_id),'isPrimary',exists(select 1 from public.account_principals p where p.company_id=m.company_id and p.user_id=m.user_id),
 'active',coalesce(s.active,true),'fullName',s.full_name)
 from public.company_users m left join public.account_settings s on s.user_id=m.user_id and s.company_id=m.company_id where m.user_id=auth.uid();
$$;
revoke all on function public.get_access_context() from public,anon,authenticated;
grant execute on function public.get_access_context() to authenticated;

create function bagsync_private.delegable_features(p_user uuid) returns text[] language plpgsql stable security definer set search_path='' as $$
declare cid uuid; r text; result_data text[];
begin
 select company_id,role into cid,r from public.company_users where user_id=p_user;
 if cid is null or not 'contas'=any(bagsync_private.effective_features(p_user)) then return array[]::text[];end if;
 if exists(select 1 from public.account_principals where company_id=cid and user_id=p_user) then return bagsync_private.role_features('gerente_logistico');end if;
 select grant_permissions into result_data from public.account_role_limits where company_id=cid and role=r;
 return coalesce(result_data,case when r='gerente_logistico' then bagsync_private.role_features(r) else array[]::text[] end);
end $$;
revoke all on function bagsync_private.delegable_features(uuid) from public,anon,authenticated;

create function bagsync_private.assert_account_grant(p_role text,p_permissions text[]) returns uuid language plpgsql set search_path='' as $$
declare cid uuid; own public.company_users; allowed text[]; target_limit text[]; target_grants text[];
begin
 select * into own from public.company_users where user_id=auth.uid();cid:=own.company_id;
 if cid is null then raise exception using errcode='42501',message='Acesso não autorizado.';end if;
 perform bagsync_private.require_feature('contas');
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(cid::text,0));
 if p_role not in('gerente_logistico','motorista','gestor') or p_role is null or p_permissions is null or array_position(p_permissions,null) is not null or not p_permissions<@bagsync_private.role_features(p_role) then
  raise exception using errcode='22023',message='Perfil ou permissões inválidos.';
 end if;
 select permissions into target_limit from public.account_role_limits where company_id=cid and role=p_role;
 if not p_permissions<@coalesce(target_limit,bagsync_private.role_features(p_role)) or not p_permissions<@bagsync_private.delegable_features(auth.uid()) then
  raise exception using errcode='42501',message='Você não pode conceder acessos além do limite de concessão definido pela conta principal.';
 end if;
 if 'contas'=any(p_permissions) then
  select grant_permissions into target_grants from public.account_role_limits where company_id=cid and role=p_role;
  target_grants:=coalesce(target_grants,case when p_role='gerente_logistico' then bagsync_private.role_features(p_role) else array[]::text[] end);
  if not target_grants<@bagsync_private.delegable_features(auth.uid()) then raise exception using errcode='42501',message='Não é permitido criar um administrador com poder de concessão maior que o seu.';end if;
 end if;
 return cid;
end $$;
revoke all on function bagsync_private.assert_account_grant(text,text[]) from public,anon,authenticated;

create function public.get_access_administration(p_page integer default 1) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; result_data jsonb;
begin
 if p_page is null or p_page<1 or p_page>1000000 then raise exception using errcode='22023',message='Página inválida.';end if;
 perform bagsync_private.require_feature('contas');select company_id into cid from public.company_users where user_id=auth.uid();
 select jsonb_build_object('users',coalesce((select jsonb_agg(jsonb_build_object('id',m.user_id,'name',coalesce(s.full_name,'Nome não cadastrado'),'email',a.email,'role',m.role,'active',coalesce(s.active,true),'permissions',bagsync_private.effective_features(m.user_id),'assigned',coalesce(s.permissions,bagsync_private.role_features(m.role)),'primary',exists(select 1 from public.account_principals p where p.company_id=cid and p.user_id=m.user_id)) order by coalesce(s.full_name,a.email)) from (select * from public.company_users where company_id=cid order by user_id limit 25 offset ((p_page-1)*25)) m join auth.users a on a.id=m.user_id left join public.account_settings s on s.user_id=m.user_id and s.company_id=m.company_id),'[]'::jsonb),
 'limits',(select jsonb_object_agg(r,coalesce(l.permissions,bagsync_private.role_features(r))) from unnest(array['gerente_logistico','motorista','gestor']) r left join public.account_role_limits l on l.company_id=cid and l.role=r),
 'total',(select count(*) from public.company_users where company_id=cid),
 'grantable',bagsync_private.delegable_features(auth.uid()),
 'grants',(select jsonb_object_agg(r,coalesce(l.grant_permissions,case when r='gerente_logistico' then bagsync_private.role_features(r) else array[]::text[] end)) from unnest(array['gerente_logistico','motorista','gestor']) r left join public.account_role_limits l on l.company_id=cid and l.role=r),
 'events',coalesce((select jsonb_agg(e) from(select operation,target_id,actor_id,created_at from public.account_access_events where company_id=cid order by created_at desc,id desc limit 20)e),'[]'::jsonb)) into result_data;
 return result_data;
end $$;
revoke all on function public.get_access_administration(integer) from public,anon,authenticated;
grant execute on function public.get_access_administration(integer) to authenticated;

create function public.set_account_role_limit(p_request_key uuid,p_role text,p_permissions text[],p_grant_permissions text[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; body jsonb; prior public.account_access_events;
begin
 select company_id into cid from public.account_principals where user_id=auth.uid();
 if cid is null then raise exception using errcode='42501',message='Somente a conta principal define os limites.';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(cid::text,0));
 if p_request_key is null or p_role is null or p_role not in('gerente_logistico','motorista','gestor') or p_permissions is null or array_position(p_permissions,null) is not null or not p_permissions<@bagsync_private.role_features(p_role) or p_grant_permissions is null or array_position(p_grant_permissions,null) is not null or not p_grant_permissions<@bagsync_private.role_features('gerente_logistico') then raise exception using errcode='22023',message='Limite inválido.';end if;
 body:=jsonb_build_object('role',p_role,'permissions',p_permissions,'grant_permissions',p_grant_permissions);
 select * into prior from public.account_access_events where company_id=cid and request_key=p_request_key;
 if found then if prior.operation<>'limite' or prior.payload is distinct from body then raise exception using errcode='22023',message='Chave já utilizada.';end if;return jsonb_build_object('saved',true);end if;
 insert into public.account_role_limits values(cid,p_role,p_permissions,p_grant_permissions) on conflict(company_id,role) do update set permissions=excluded.permissions,grant_permissions=excluded.grant_permissions;
 insert into public.account_access_events(company_id,request_key,actor_id,operation,payload) values(cid,p_request_key,auth.uid(),'limite',body);
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.set_account_role_limit(uuid,text,text[],text[]) from public,anon,authenticated;
grant execute on function public.set_account_role_limit(uuid,text,text[],text[]) to authenticated;

create function public.update_account_access(p_request_key uuid,p_user_id uuid,p_name text,p_role text,p_permissions text[],p_active boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; body jsonb; prior public.account_access_events;
begin
 cid:=bagsync_private.assert_account_grant(p_role,p_permissions);
 if p_user_id=auth.uid() or exists(select 1 from public.account_principals where user_id=p_user_id) then raise exception using errcode='42501',message='Não é permitido alterar sua própria conta ou a conta principal.';end if;
 if not exists(select 1 from public.company_users where company_id=cid and user_id=p_user_id) then raise exception using errcode='42501',message='Conta não disponível.';end if;
 if not bagsync_private.effective_features(p_user_id)<@bagsync_private.delegable_features(auth.uid()) or ('contas'=any(bagsync_private.effective_features(p_user_id)) and not bagsync_private.delegable_features(p_user_id)<@bagsync_private.delegable_features(auth.uid())) then raise exception using errcode='42501',message='Conta fora do seu limite de administração.';end if;
 if p_request_key is null or p_active is null or p_name is null or length(btrim(p_name)) not between 1 and 120 then raise exception using errcode='22023',message='Dados inválidos.';end if;
 body:=jsonb_build_object('user',p_user_id,'name',btrim(p_name),'role',p_role,'permissions',p_permissions,'active',p_active);
 select * into prior from public.account_access_events where company_id=cid and request_key=p_request_key;
 if found then if prior.operation<>'alteracao' or prior.payload is distinct from body then raise exception using errcode='22023',message='Chave já utilizada.';end if;return jsonb_build_object('saved',true);end if;
 update public.company_users set role=p_role where company_id=cid and user_id=p_user_id;
 insert into public.account_settings(user_id,company_id,full_name,permissions,active) values(p_user_id,cid,btrim(p_name),p_permissions,p_active)
 on conflict(user_id) do update set full_name=excluded.full_name,permissions=excluded.permissions,active=excluded.active,updated_at=now();
 insert into public.account_access_events(company_id,request_key,actor_id,target_id,operation,payload) values(cid,p_request_key,auth.uid(),p_user_id,'alteracao',body);
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.update_account_access(uuid,uuid,text,text,text[],boolean) from public,anon,authenticated;
grant execute on function public.update_account_access(uuid,uuid,text,text,text[],boolean) to authenticated;

create function public.prepare_account_creation(p_request_key uuid,p_name text,p_email text,p_role text,p_permissions text[],p_fingerprint text) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; prior bagsync_private.account_provision_requests; normalized text:=lower(btrim(p_email));
begin
 cid:=bagsync_private.assert_account_grant(p_role,p_permissions);
 if p_request_key is null or p_name is null or length(btrim(p_name)) not between 1 and 120 or normalized is null or length(normalized)>254 or normalized!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_fingerprint is null or length(p_fingerprint)<>64 then raise exception using errcode='22023',message='Dados de criação inválidos.';end if;
 select * into prior from bagsync_private.account_provision_requests where id=p_request_key;
 if found then
  if prior.company_id<>cid or prior.actor_id<>auth.uid() or prior.full_name<>btrim(p_name) or prior.email<>normalized or prior.role<>p_role or prior.permissions is distinct from p_permissions or prior.password_fingerprint<>p_fingerprint then raise exception using errcode='42501',message='Tentativa não disponível ou dados divergentes.';end if;
  if prior.user_id is not null then return jsonb_build_object('completed',true,'user_id',prior.user_id);end if;
  if prior.lease_until>clock_timestamp() then raise exception using errcode='55P03',message='Criação em andamento. Aguarde antes de repetir.';end if;
  update bagsync_private.account_provision_requests set lease_until=clock_timestamp()+interval '30 seconds' where id=p_request_key;
 else
  if exists(select 1 from auth.users where lower(email)=normalized) then raise exception using errcode='22023',message='Não foi possível cadastrar esse acesso. Confira o e-mail.';end if;
  insert into bagsync_private.account_provision_requests(id,company_id,actor_id,full_name,email,role,permissions,password_fingerprint,lease_until)
  values(p_request_key,cid,auth.uid(),btrim(p_name),normalized,p_role,p_permissions,p_fingerprint,clock_timestamp()+interval '30 seconds');
 end if;
 return jsonb_build_object('completed',false,'request_id',p_request_key,'name',btrim(p_name),'email',normalized);
end $$;
revoke all on function public.prepare_account_creation(uuid,text,text,text,text[],text) from public,anon,authenticated;
grant execute on function public.prepare_account_creation(uuid,text,text,text,text[],text) to authenticated;

-- Recuperação restrita ao backend privilegiado; app_metadata é escrita somente pela API Admin.
create function public.lookup_account_provision_user(p_request_key uuid) returns uuid language sql stable security definer set search_path='' as $$
 select a.id from auth.users a join bagsync_private.account_provision_requests r on lower(a.email)=r.email
 where r.id=p_request_key and a.raw_app_meta_data->>'bagsync_provision_request'=p_request_key::text;
$$;
revoke all on function public.lookup_account_provision_user(uuid) from public,anon,authenticated;
grant execute on function public.lookup_account_provision_user(uuid) to service_role;
create function public.complete_account_creation(p_request_key uuid,p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r bagsync_private.account_provision_requests; cid uuid;
begin
 select * into r from bagsync_private.account_provision_requests where id=p_request_key;
 if not found or r.actor_id<>auth.uid() then raise exception using errcode='42501',message='Tentativa não disponível.';end if;
 cid:=bagsync_private.assert_account_grant(r.role,r.permissions);
 if r.company_id<>cid then raise exception using errcode='42501',message='Empresa inválida.';end if;
 if r.user_id is not null then return jsonb_build_object('user_id',r.user_id);end if;
 if not exists(select 1 from auth.users where id=p_user_id and lower(email)=r.email and raw_app_meta_data->>'bagsync_provision_request'=p_request_key::text and email_confirmed_at is not null) then raise exception using errcode='42501',message='Criação de identidade não comprovada.';end if;
 if exists(select 1 from public.company_users where user_id=p_user_id) then raise exception using errcode='42501',message='Usuário já vinculado.';end if;
 insert into public.company_users(user_id,company_id,role) values(p_user_id,cid,r.role);
 insert into public.account_settings(user_id,company_id,full_name,permissions) values(p_user_id,cid,r.full_name,r.permissions);
 update bagsync_private.account_provision_requests set user_id=p_user_id where id=p_request_key;
 insert into public.account_access_events(company_id,request_key,actor_id,target_id,operation,payload)
 values(cid,p_request_key,auth.uid(),p_user_id,'criacao',jsonb_build_object('name',r.full_name,'role',r.role,'permissions',r.permissions));
 return jsonb_build_object('user_id',p_user_id);
end $$;
revoke all on function public.complete_account_creation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.complete_account_creation(uuid,uuid) to authenticated;

-- As verificações existentes de perfil permanecem como limites máximos aprovados.
-- A nova verificação pode restringir cada funcionalidade dentro desse perfil.
do $migration$
declare entry record; definition text; guard text;
begin
 for entry in select * from (values
 ('create_production_order','pedidos'),('create_shipment_kit','expedicao'),('record_kit_delivery','expedicao'),
 ('submit_shipment_checklist','expedicao'),('submit_shipment_checklist_review','expedicao'),('set_shipment_kit_review','expedicao'),
 ('extend_shipment_deadline','prazos'),('confirm_shipment_delivery','motorista'),('add_production_note','observacoes'),('register_inventory_operation','')
 ) t(name,permission) loop
  select pg_get_functiondef(p.oid) into strict definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=entry.name;
  guard:=case when entry.name='register_inventory_operation' then E'\n perform bagsync_private.require_feature(case p_kind when ''bag_receipt'' then ''motorista'' when ''material_delivery'' then ''expedicao'' else ''estoque'' end);'
   else E'\n perform bagsync_private.require_feature('||quote_literal(entry.permission)||');' end;
  definition:=regexp_replace(definition,E'\nbegin\n',E'\nbegin\n'||guard||E'\n');
  if strpos(definition,'perform bagsync_private.require_feature(')=0 then raise exception 'RPC sem marcador de autorização: %',entry.name;end if;
  execute definition;
 end loop;
end $migration$;
-- Escrita de catálogos exige capacidade própria; mantém filtro de empresa e perfil.
do $migration$
declare p record; condition text;
begin
 for p in select * from pg_policies where schemaname='public' and tablename in('workshops','materials','bags','bag_materials','bag_checklist_items') and cmd<>'SELECT' loop
  execute format('drop policy %I on public.%I',p.policyname,p.tablename);
  condition:='company_id in(select company_id from public.company_users where user_id=(select auth.uid()) and role=''gerente_logistico'') and public.has_permission(''cadastros'')';
  if p.cmd='INSERT' then execute format('create policy %I on public.%I for insert to authenticated with check(%s)',p.policyname,p.tablename,condition);
  elsif p.cmd='UPDATE' then execute format('create policy %I on public.%I for update to authenticated using(%s) with check(%s)',p.policyname,p.tablename,condition,condition);
  else execute format('create policy %I on public.%I for delete to authenticated using(%s)',p.policyname,p.tablename,condition);end if;
 end loop;
 -- As leituras necessárias aos módulos atribuídos mantêm RLS por empresa.
 for p in select * from pg_policies where schemaname='public' and cmd='SELECT' and tablename not in('company_users','companies') loop
  condition:='public.has_permission(''inicio'') or public.has_permission(''consultas'') or public.has_permission(''pedidos'') or public.has_permission(''estoque'') or public.has_permission(''expedicao'') or public.has_permission(''motorista'') or public.has_permission(''observacoes'') or public.has_permission(''prazos'')';
  if p.tablename in('workshops','materials','bags','measurement_units','bag_materials','bag_checklist_items') then condition:=condition||' or public.has_permission(''cadastros'')';end if;
  execute format('alter policy %I on public.%I using((%s) and (%s))',p.policyname,p.tablename,p.qual,condition);
 end loop;
end $migration$;
-- Extratos diretos também respeitam a permissão de consulta, mantendo SECURITY INVOKER.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.export_inventory_operations(timestamptz,timestamptz,uuid,uuid,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'where o.company_id in','where (public.has_permission(''consultas'') or (p_operation is not null and public.has_permission(''motorista''))) and o.company_id in');
 execute definition;
end $migration$;
comment on table public.account_settings is 'Permissões individuais limitadas ao perfil aprovado e aos limites da conta principal. Bloqueio tem efeito imediato nas RPCs e nas leituras de negócio.';
comment on table public.account_principals is 'Conta principal protegida, identificada por UUID e empresa. Sem operações de escrita pelos usuários.';

-- Histórico de produção invoker: negar também a chamada direta sem consulta/observação.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.production_tracking_history(uuid,uuid,uuid,text,integer)'::regprocedure) into definition;
 definition:=regexp_replace(definition,E'\nbegin\n',E'\nbegin\n if not (public.has_permission(''consultas'') or public.has_permission(''observacoes'')) then raise exception using errcode=''42501'',message=''Histórico não autorizado.'';end if;\n');
 execute definition;
end $migration$;
