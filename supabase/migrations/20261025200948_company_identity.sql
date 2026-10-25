create table public.companies (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(btrim(name)) > 0),
 created_at timestamptz not null default now()
);
create table public.company_users (
 user_id uuid primary key references auth.users(id),
 company_id uuid not null references public.companies(id),
 role text not null check (role in ('gerente_logistico', 'motorista', 'gestor')),
 created_at timestamptz not null default now()
);
create index company_users_company_id_idx on public.company_users(company_id);
alter table public.companies enable row level security;
alter table public.company_users enable row level security;
revoke all on public.companies, public.company_users from anon, authenticated;
grant select on public.companies, public.company_users to authenticated;
create policy own_membership on public.company_users for select to authenticated
 using (user_id = (select auth.uid()));
create policy own_company on public.companies for select to authenticated
 using (id in (select company_id from public.company_users where user_id = (select auth.uid())));
