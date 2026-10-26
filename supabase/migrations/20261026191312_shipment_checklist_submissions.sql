-- Respostas imutáveis por preenchimento. Quantidade efetiva independente do texto livre.
create table public.kit_checklist_submissions (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 kit_id uuid not null,
 request_key uuid not null,
 operation_id uuid,
 note text,
 payload jsonb not null,
 result jsonb not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(company_id,id),
 unique(company_id,kit_id,id),
 unique(company_id,request_key),
 unique(company_id,operation_id),
 foreign key(company_id,kit_id) references public.shipment_kits(company_id,id),
 foreign key(company_id,operation_id) references public.inventory_operations(company_id,id)
);
create index kit_checklist_submissions_kit_idx on public.kit_checklist_submissions(company_id,kit_id);
create index kit_checklist_submissions_author_idx on public.kit_checklist_submissions(created_by);

create table public.kit_checklist_answers (
 company_id uuid not null references public.companies(id),
 kit_id uuid not null,
 submission_id uuid not null,
 kit_item_id uuid not null,
 mode text not null check(mode in ('pending','complete','partial')),
 response_text text,
 quantity numeric not null check(quantity>=0 and quantity<'Infinity'::numeric),
 primary key(company_id,submission_id,kit_item_id),
 foreign key(company_id,kit_id,submission_id) references public.kit_checklist_submissions(company_id,kit_id,id),
 foreign key(company_id,kit_id,kit_item_id) references public.shipment_kit_items(company_id,kit_id,id)
);
create index kit_checklist_answers_submission_idx on public.kit_checklist_answers(company_id,kit_id,submission_id);
create index kit_checklist_answers_item_idx on public.kit_checklist_answers(company_id,kit_id,kit_item_id);

alter table public.kit_checklist_submissions enable row level security;
alter table public.kit_checklist_answers enable row level security;
revoke all on public.kit_checklist_submissions,public.kit_checklist_answers from public,anon,authenticated;
grant select on public.kit_checklist_submissions,public.kit_checklist_answers to authenticated;
create policy kit_checklist_submissions_read on public.kit_checklist_submissions for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));
create policy kit_checklist_answers_read on public.kit_checklist_answers for select to authenticated
 using(company_id in(select company_id from public.company_users where user_id=(select auth.uid())));

create function public.submit_shipment_checklist(p_request_key uuid,p_kit_id uuid,p_answers jsonb,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 cid uuid; existing public.kit_checklist_submissions; requested jsonb; sid uuid:=gen_random_uuid();
 answer jsonb; item record; q numeric; mode_value text; free_text text;
 answers_data jsonb:='[]'::jsonb; delivery_data jsonb:='[]'::jsonb;
 result_data jsonb; opid uuid;
begin
 cid:=bagsync_private.lock_company(array['gerente_logistico','motorista']);
 if p_request_key is null or p_answers is null or jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)=0 then
  raise exception using errcode='22023',message='Informe a chave e as respostas do checklist.';
 end if;
 requested:=jsonb_build_object('kit',p_kit_id,'answers',p_answers,'note',p_note);
 select * into existing from public.kit_checklist_submissions where company_id=cid and request_key=p_request_key;
 if found then
  if existing.payload is distinct from requested then raise exception using errcode='22023',message='Chave já usada com outros dados.';end if;
  return existing.result;
 end if;
 if not exists(select 1 from public.shipment_kits where company_id=cid and id=p_kit_id) then
  raise exception using errcode='22023',message='Remessa inválida.';
 end if;
 if exists(select 1 from public.inventory_operations where company_id=cid and request_key=p_request_key)
 or exists(select 1 from public.kit_deliveries where company_id=cid and request_key=p_request_key) then
  raise exception using errcode='22023',message='Chave já utilizada em outro lançamento.';
 end if;
 if (select count(*) from public.shipment_kit_items where company_id=cid and kit_id=p_kit_id)<>jsonb_array_length(p_answers)
 or (select count(distinct (x->>'kit_item_id')::uuid) from jsonb_array_elements(p_answers) x)<>jsonb_array_length(p_answers) then
  raise exception using errcode='22023',message='Responda todos os itens uma única vez.';
 end if;
 for answer in select value from jsonb_array_elements(p_answers) loop
  select i.id,i.input_type,p.remaining_quantity into item
  from public.shipment_kit_items i join public.shipment_kit_item_progress p
   on p.company_id=i.company_id and p.kit_item_id=i.id and p.kit_id=i.kit_id
  where i.company_id=cid and i.kit_id=p_kit_id and i.id=(answer->>'kit_item_id')::uuid;
  if not found or item.input_type is null then raise exception using errcode='22023',message='Item inválido ou remessa anterior sem tipo configurado.';end if;
  mode_value:=answer->>'mode';
  if answer ? 'text' and jsonb_typeof(answer->'text') not in ('string','null') then
   raise exception using errcode='22023',message='A resposta livre deve ser texto.';
  end if;
  free_text:=answer->>'text';
  if item.input_type='checkbox' and coalesce(free_text,'')<>'' then
   raise exception using errcode='22023',message='Este item usa caixa de marcação, não texto livre.';
  end if;
  if mode_value='complete' and item.input_type='checkbox' then q:=item.remaining_quantity;
  elsif mode_value='partial' then
   q:=(answer->>'quantity')::numeric;
   if q is null or q<=0 or q>='Infinity'::numeric then raise exception using errcode='22023',message='Quantidade enviada inválida.';end if;
  elsif mode_value='pending' then
   q:=0;
   if coalesce((answer->>'quantity')::numeric,0)<>0 then raise exception using errcode='22023',message='Item pendente não pode informar envio.';end if;
  else raise exception using errcode='22023',message='Tipo de resposta inválido.';end if;
  answers_data:=answers_data||jsonb_build_array(jsonb_build_object('kit_item_id',item.id,'mode',mode_value,'text',free_text,'quantity',q::text));
  if q>0 then delivery_data:=delivery_data||jsonb_build_array(jsonb_build_object('kit_item_id',item.id,'mode','partial','quantity',q::text));end if;
 end loop;
 if jsonb_array_length(delivery_data)>0 then
  result_data:=public.record_kit_delivery(p_request_key,p_kit_id,delivery_data,p_note);
  opid:=(result_data->>'operation_id')::uuid;
 else result_data:=jsonb_build_object('kit_id',p_kit_id,'warnings','[]'::jsonb);end if;
 result_data:=result_data||jsonb_build_object('submission_id',sid,'operation_id',opid,'kit_id',p_kit_id);
 insert into public.kit_checklist_submissions(id,company_id,kit_id,request_key,operation_id,note,payload,result,created_by)
 values(sid,cid,p_kit_id,p_request_key,opid,p_note,requested,result_data,auth.uid());
 insert into public.kit_checklist_answers(company_id,kit_id,submission_id,kit_item_id,mode,response_text,quantity)
 select cid,p_kit_id,sid,(x->>'kit_item_id')::uuid,x->>'mode',x->>'text',(x->>'quantity')::numeric
 from jsonb_array_elements(answers_data) x;
 return result_data;
end $$;
revoke all on function public.submit_shipment_checklist(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_shipment_checklist(uuid,uuid,jsonb,text) to authenticated;
comment on table public.kit_checklist_submissions is 'Preenchimento imutável do controle de saída, com ou sem envio de materiais. Correções financeiras/estoque por estorno e novo lançamento.';
comment on table public.kit_checklist_answers is 'Respostas livres, conferências e quantidades efetivas, sem interpretar texto como número.';
