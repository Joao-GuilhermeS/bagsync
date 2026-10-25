-- Catálogos de produção: sem movimentações ou consumo automático.
create table public.workshops (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 name text not null check (length(btrim(name)) > 0),
 created_at timestamptz not null default now(),
 unique (company_id,id)
);
create table public.measurement_units (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 name text not null check (length(btrim(name)) > 0),
 symbol text not null check (length(btrim(symbol)) > 0),
 created_at timestamptz not null default now(),
 unique (company_id,id),
 unique (company_id,symbol)
);
create table public.materials (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 unit_id uuid not null,
 name text not null check (length(btrim(name)) > 0),
 created_at timestamptz not null default now(),
 unique (company_id,id),
 foreign key (company_id,unit_id) references public.measurement_units(company_id,id)
);
create index materials_unit_idx on public.materials(company_id,unit_id);
create table public.bags (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 name text not null check (length(btrim(name)) > 0),
 created_at timestamptz not null default now(),
 unique (company_id,id)
);
create table public.bag_materials (
 company_id uuid not null references public.companies(id),
 bag_id uuid not null,
 material_id uuid not null,
 quantity numeric not null check (quantity > 0 and quantity < 'Infinity'::numeric),
 primary key (company_id,bag_id,material_id),
 foreign key (company_id,bag_id) references public.bags(company_id,id),
 foreign key (company_id,material_id) references public.materials(company_id,id)
);
create index bag_materials_material_idx on public.bag_materials(company_id,material_id);

alter table public.workshops enable row level security;
revoke all on public.workshops from public, anon, authenticated;
grant select, insert, update, delete on public.workshops to authenticated;
create policy workshops_read on public.workshops for select to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid())));
create policy workshops_insert on public.workshops for insert to authenticated
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy workshops_update on public.workshops for update to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'))
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy workshops_delete on public.workshops for delete to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));

alter table public.measurement_units enable row level security;
revoke all on public.measurement_units from public, anon, authenticated;
grant select, insert, update, delete on public.measurement_units to authenticated;
create policy measurement_units_read on public.measurement_units for select to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid())));
create policy measurement_units_insert on public.measurement_units for insert to authenticated
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy measurement_units_update on public.measurement_units for update to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'))
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy measurement_units_delete on public.measurement_units for delete to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));

alter table public.materials enable row level security;
revoke all on public.materials from public, anon, authenticated;
grant select, insert, update, delete on public.materials to authenticated;
create policy materials_read on public.materials for select to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid())));
create policy materials_insert on public.materials for insert to authenticated
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy materials_update on public.materials for update to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'))
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy materials_delete on public.materials for delete to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));

alter table public.bags enable row level security;
revoke all on public.bags from public, anon, authenticated;
grant select, insert, update, delete on public.bags to authenticated;
create policy bags_read on public.bags for select to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid())));
create policy bags_insert on public.bags for insert to authenticated
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy bags_update on public.bags for update to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'))
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy bags_delete on public.bags for delete to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));

alter table public.bag_materials enable row level security;
revoke all on public.bag_materials from public, anon, authenticated;
grant select, insert, update, delete on public.bag_materials to authenticated;
create policy bag_materials_read on public.bag_materials for select to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid())));
create policy bag_materials_insert on public.bag_materials for insert to authenticated
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy bag_materials_update on public.bag_materials for update to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'))
 with check (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
create policy bag_materials_delete on public.bag_materials for delete to authenticated
 using (company_id in (select company_id from public.company_users where user_id=(select auth.uid()) and role='gerente_logistico'));
comment on table public.workshops is 'Facções e costureiras de uma empresa. Cadastro mínimo por nome; dados adicionais dependem dos requisitos.';
comment on table public.measurement_units is 'Unidades de medida por empresa. Sem conversões automáticas.';
comment on table public.materials is 'Materiais de produção associados a uma unidade da mesma empresa.';
comment on table public.bags is 'Modelos de bolsas. Sem saldo ou quantidade produzida nesta etapa.';
comment on table public.bag_materials is 'Composição opcional: quantidade de material por uma bolsa, na unidade do material. Não movimenta estoque.';
