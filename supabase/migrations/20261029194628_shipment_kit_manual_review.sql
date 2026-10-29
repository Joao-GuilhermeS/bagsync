-- Alerta manual independente do saldo de materiais; histórico imutável por empresa.
create table public.shipment_kit_review_events (
 id uuid primary key default gen_random_uuid(),
 sequence bigint generated always as identity unique,
 company_id uuid not null references public.companies(id),
 kit_id uuid not null,
 request_key uuid not null,
 incomplete boolean not null,
 note text check(length(note)<=2000),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(company_id,request_key),
 foreign key(company_id,kit_id) references public.shipment_kits(company_id,id)
);
create index shipment_kit_review_events_kit_idx on public.shipment_kit_review_events(company_id,kit_id,sequence desc);
create index shipment_kit_review_events_author_idx on public.shipment_kit_review_events(created_by);
alter table public.shipment_kit_review_events enable row level security;
revoke all on public.shipment_kit_review_events from public,anon,authenticated;
grant select on public.shipment_kit_review_events to authenticated;
create policy shipment_kit_review_read on public.shipment_kit_review_events for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));
comment on table public.shipment_kit_review_events is 'Histórico de alerta manual de kit incompleto e correção; não movimenta estoque nem elimina faltas quantitativas.';

create function public.set_shipment_kit_review(p_request_key uuid,p_kit_id uuid,p_incomplete boolean,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; existing public.shipment_kit_review_events; event_id uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico']);
 if p_request_key is null or p_incomplete is null or length(p_note)>2000 then
  raise exception using errcode='22023',message='Revise a chave, a marcação e as observações.';
 end if;
 select * into existing from public.shipment_kit_review_events where company_id=cid and request_key=p_request_key;
 if found then
  if existing.kit_id is distinct from p_kit_id or existing.incomplete is distinct from p_incomplete or existing.note is distinct from p_note then
   raise exception using errcode='22023',message='Chave já utilizada com outros dados.';
  end if;
  return jsonb_build_object('review_event_id',existing.id,'kit_id',existing.kit_id);
 end if;
 if not exists(select 1 from public.shipment_kits where company_id=cid and id=p_kit_id) then
  raise exception using errcode='22023',message='Remessa inválida.';
 end if;
 insert into public.shipment_kit_review_events(company_id,kit_id,request_key,incomplete,note,created_by)
 values(cid,p_kit_id,p_request_key,p_incomplete,p_note,auth.uid()) returning id into event_id;
 return jsonb_build_object('review_event_id',event_id,'kit_id',p_kit_id);
end $$;
revoke all on function public.set_shipment_kit_review(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.set_shipment_kit_review(uuid,uuid,boolean,text) to authenticated;

-- Conferência e alerta na mesma transação. APIs anteriores preservadas para compatibilidade.
create function public.submit_shipment_checklist_review(p_request_key uuid,p_kit_id uuid,p_answers jsonb,p_note text default null,p_incomplete boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result_data jsonb;
begin
 perform bagsync_private.lock_company(array['gerente_logistico']);
 result_data:=public.submit_shipment_checklist(p_request_key,p_kit_id,p_answers,p_note);
 perform public.set_shipment_kit_review(p_request_key,p_kit_id,p_incomplete,p_note);
 return result_data||jsonb_build_object('kit_status',(select status from public.shipment_kit_status where company_id=(select company_id from public.company_users where user_id=auth.uid()) and kit_id=p_kit_id));
end $$;
revoke all on function public.submit_shipment_checklist_review(uuid,uuid,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.submit_shipment_checklist_review(uuid,uuid,jsonb,text,boolean) to authenticated;

create or replace view public.shipment_kit_status with(security_invoker=true) as
 select k.company_id,k.id as kit_id,count(p.kit_item_id) as item_count,
 count(p.kit_item_id) filter(where p.remaining_quantity>0) as pending_items,
 case when count(p.kit_item_id)=0 or count(p.kit_item_id) filter(where p.remaining_quantity>0)>0
 or coalesce((select e.incomplete from public.shipment_kit_review_events e where e.company_id=k.company_id and e.kit_id=k.id order by e.sequence desc limit 1),false)
 then 'incompleto' else 'completo' end as status
 from public.shipment_kits k left join public.shipment_kit_item_progress p on p.company_id=k.company_id and p.kit_id=k.id
 group by k.company_id,k.id;
comment on view public.shipment_kit_status is 'Kit completo exige ausência de material pendente e de alerta manual. Status logístico permanece independente.';
