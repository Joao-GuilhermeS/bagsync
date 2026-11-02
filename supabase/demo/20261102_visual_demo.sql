-- Dados fictícios solicitados expressamente pelo responsável em 02/11/2026.
-- Somente RL Bolsas no projeto BagSync ppgeveafuhgoymtvvrya.
-- Operação administrativa pelo conector; contexto SQL do usuário autorizado.
-- Não cria sessão Auth, não modifica credenciais, esquema, RLS ou permissões.
-- Por padrão simula e desfaz. A aplicação autorizada troca apenas o ROLLBACK final por COMMIT.
begin;
set local lock_timeout='10s';
set local statement_timeout='90s';
do $$ begin
 if not exists(select 1 from auth.users a join public.company_users m on m.user_id=a.id
 where a.id='aeaa0519-cad6-453f-ae6a-0787dd527120' and lower(a.email)='rlbolsas@gmail.com'
 and m.company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f' and m.role='gerente_logistico') then
 raise exception 'Identidade ou empresa divergente. Interromper.';end if;
end $$;
select set_config('demo.auth_count',(select count(*)::text from auth.users),true);
select set_config('demo.memberships',(select md5(string_agg(user_id::text||company_id::text||role,',' order by user_id)) from public.company_users),true);
select set_config('demo.original_orders',(select md5(string_agg(id::text||name||bag_id::text||expected_quantity::text,',' order by id)) from public.production_orders where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f' and name not like 'TESTE - DEMO 02/11%'),true);
select set_config('request.jwt.claims','{"sub":"aeaa0519-cad6-453f-ae6a-0787dd527120","role":"authenticated"}',true);
set local role authenticated;
do $demo$
declare
 cid uuid:='abd23955-cf67-4354-8d67-ae0b7dbec40f';
 batch text:='bagsync-demo-20261102:';
 base date:='2026-11-02';
 r record; bag uuid; wid uuid; oid uuid; kid uuid; sid uuid;
 items jsonb; answers jsonb; result_data jsonb; partial_item uuid; part numeric;
 o_pac uuid; o_maraca uuid; o_marang uuid; o_itarema uuid;
 scenario integer:=0;
begin
 if not public.has_permission('expedicao') or not public.has_permission('estoque') then raise exception 'Permissões insuficientes';end if;
 -- Prefixo de teste nas facções existentes. Contatos originais e IDs preservados.
 update public.workshops set name='TESTE - '||initcap(name)
 where company_id=cid and name not like 'TESTE - %';
 for r in select * from(values
  (1,'Costura Aurora','Quixadá'),(2,'Ateliê Horizonte','Quixeramobim'),
  (3,'Costura Lagoa','Choró'),(4,'Oficina Girassol','Maranguape'),(5,'Costura Sertão','Pacatuba')
 ) v(n,name,city) loop
  insert into public.workshops(id,company_id,name,document_number,street,address_number,address_complement,neighborhood,city,state)
  values(md5(batch||'workshop:'||r.n)::uuid,cid,'TESTE - '||r.name,'DEMO-'||r.n,
   'Rua de Demonstração '||r.n,(100+r.n)::text,'Endereço fictício para demonstração','Bairro de Teste',r.city,'CE')
  on conflict(id) do nothing;
 end loop;
 -- Entradas fictícias com quantidade exata na unidade de cada material.
 -- Malha e material de medida ficam sem entrada para manter exemplos de saldo negativo.
 select jsonb_agg(jsonb_build_object('material_id',m.id,'quantity',case u.symbol when 'kg' then '10000' when 'un' then '100000' else '100000' end) order by m.id)
 into items from public.materials m join public.measurement_units u on u.id=m.unit_id and u.company_id=m.company_id
 where m.company_id=cid and m.id not in('37e6ba82-65f5-4658-8ace-4ff9b1b1e587','cdc701a1-d347-45d4-84de-f688e0877266');
 perform public.register_inventory_operation(md5(batch||'stock-entry')::uuid,'material_entry',p_items=>items,
 p_note=>'TESTE - DEMO 02/11: abastecimento fictício para apresentação; sem compra real.');
 -- Novos pedidos mantêm os modelos existentes. Quantidades de demonstração.
 select id into strict bag from public.bags where company_id=cid and name='Pacatuba';
 o_pac:=(public.create_production_order(md5(batch||'order:pacatuba')::uuid,'TESTE - DEMO 02/11 - Pacatuba',bag,3000)->>'order_id')::uuid;
 select id into strict bag from public.bags where company_id=cid and name='Maracanaú';
 o_maraca:=(public.create_production_order(md5(batch||'order:maracanau')::uuid,'TESTE - DEMO 02/11 - Maracanaú',bag,4500)->>'order_id')::uuid;
 select id into strict bag from public.bags where company_id=cid and name='Maranguape';
 o_marang:=(public.create_production_order(md5(batch||'order:maranguape')::uuid,'TESTE - DEMO 02/11 - Maranguape',bag,2500)->>'order_id')::uuid;
 select id into strict bag from public.bags where company_id=cid and name='Itarema';
 o_itarema:=(public.create_production_order(md5(batch||'order:itarema')::uuid,'TESTE - DEMO 02/11 - Itarema',bag,1800)->>'order_id')::uuid;
 for r in select * from(values
  ('9977782d-a729-487e-8c60-d4e2ac3e688f'::uuid,1,20000,12000,true,'complete',1,false),
  ('9977782d-a729-487e-8c60-d4e2ac3e688f'::uuid,2,15000,9000,true,'complete',7,false),
  ('79c0d50a-f828-4654-90f7-54da9b6a16e6'::uuid,3,6000,4500,true,'partial',2,true),
  ('421758ab-4a06-432d-a81f-76fdfcb65dd7'::uuid,4,8000,5000,true,'complete',5,false),
  (o_pac,5,1500,1500,true,'complete',7,false),
  (o_pac,1,1500,600,true,'complete',1,false),
  (o_maraca,3,2000,0,false,'complete',7,false),
  (o_maraca,2,1500,500,true,'partial',2,true),
  (o_marang,4,2500,1000,true,'complete',10,true),
  (o_itarema,5,900,0,false,'pending',7,false),
  (o_itarema,2,900,0,false,'complete',2,false),
  ('421758ab-4a06-432d-a81f-76fdfcb65dd7'::uuid,5,1000,400,true,'partial',0,true)
 ) v(order_id,workshop,quantity,received,delivered,mode,days,review) loop
  scenario:=scenario+1;oid:=r.order_id;wid:=md5(batch||'workshop:'||r.workshop)::uuid;
  select bag_id into strict bag from public.production_orders where id=oid and company_id=cid;
  -- Estes valores são fictícios definidos por este roteiro, não uma regra automática do aplicativo.
  select jsonb_agg(jsonb_build_object('template_item_id',t.id,'expected_quantity',
   (r.quantity*case u.symbol when 'kg' then 0.035 when 'un' then 1.1 else 0.65 end)::text) order by t.position,t.id)
  into items from public.bag_checklist_items t join public.materials m on m.id=t.material_id and m.company_id=t.company_id
  join public.measurement_units u on u.id=m.unit_id and u.company_id=m.company_id
  where t.company_id=cid and t.bag_id=bag and t.active;
  if items is null then raise exception 'Modelo sem checklist';end if;
  kid:=(public.create_shipment_kit(md5(batch||'kit:'||scenario)::uuid,oid,wid,r.quantity,items,
   'TESTE - DEMO 02/11: cenário '||scenario||'; materiais e produção fictícios.',base+r.days)->>'kit_id')::uuid;
  if r.mode<>'pending' then
   select id into partial_item from public.shipment_kit_items where kit_id=kid and company_id=cid order by position,id limit 1;
   select jsonb_agg(jsonb_build_object('kit_item_id',i.id,
    'mode',case when r.mode='partial' and i.id=partial_item then 'partial' when i.input_type='text' then 'partial' else 'complete' end,
    'quantity',case when r.mode='partial' and i.id=partial_item then (i.expected_quantity/2)::text when i.input_type='text' then i.expected_quantity::text else null end,
    'text',case when i.input_type='text' then 'TESTE - conferência visual; sem operação real.' else null end) order by i.position,i.id)
   into answers from public.shipment_kit_items i where i.company_id=cid and i.kit_id=kid;
   result_data:=public.submit_shipment_checklist_review(md5(batch||'dispatch:'||scenario)::uuid,kid,answers,
    'TESTE - DEMO 02/11: saída fictícia '||scenario||case when r.mode='partial' then '; aguardando complemento de material.' else '; conferência de demonstração.' end,r.review);
   sid:=(result_data->>'submission_id')::uuid;
   if r.delivered then perform public.confirm_shipment_delivery(md5(batch||'confirmation:'||scenario)::uuid,sid,'TESTE - confirmação fictícia de recebimento na facção.');end if;
   if r.received>0 then
    part:=floor(r.received*0.6);
    perform public.register_inventory_operation(md5(batch||'receipt-a:'||scenario)::uuid,'bag_receipt',oid,wid,
     jsonb_build_array(jsonb_build_object('quantity',part::text)),p_note=>'TESTE - DEMO 02/11: primeiro recolhimento parcial.',p_kit_id=>kid);
    perform public.register_inventory_operation(md5(batch||'receipt-b:'||scenario)::uuid,'bag_receipt',oid,wid,
     jsonb_build_array(jsonb_build_object('quantity',(r.received-part)::text)),p_note=>'TESTE - DEMO 02/11: segundo recolhimento parcial.',p_kit_id=>kid);
   end if;
  end if;
  perform public.add_production_note(md5(batch||'note:'||scenario)::uuid,oid,wid,
   'TESTE - DEMO 02/11: '||case when r.mode='pending' then 'remessa preparada, aguardando emissão de materiais.'
    when not r.delivered then 'romaneio emitido; aguardando confirmação de entrega.'
    when r.received=r.quantity then 'quantidade prevista recolhida integralmente.'
    when r.mode='partial' then 'produção parcial com complemento de material pendente.'
    when r.review then 'materiais enviados; revisão manual do kit solicitada.'
    else 'produção em andamento; recolhimentos parciais registrados.' end);
 end loop;
 -- Complementa uma remessa já existente, sem editar ou apagar a saída anterior.
 kid:='10e71e2d-e022-4f2d-b74f-08535b337a72';
 if not exists(select 1 from public.kit_checklist_submissions where company_id=cid and request_key=md5(batch||'legacy-complement')::uuid) then
  select jsonb_agg(jsonb_build_object('kit_item_id',i.id,'mode',case when p.remaining_quantity=0 then 'pending' when i.input_type='text' then 'partial' else 'complete' end,
   'quantity',case when i.input_type='text' and p.remaining_quantity>0 then p.remaining_quantity::text else null end,
   'text',case when i.input_type='text' then 'TESTE - complemento de demonstração.' else null end) order by i.position,i.id)
  into answers from public.shipment_kit_items i join public.shipment_kit_item_progress p on p.kit_item_id=i.id and p.company_id=i.company_id where i.kit_id=kid and i.company_id=cid;
  result_data:=public.submit_shipment_checklist_review(md5(batch||'legacy-complement')::uuid,kid,answers,'TESTE - DEMO 02/11: complemento do kit de teste existente.',false);
  perform public.confirm_shipment_delivery(md5(batch||'legacy-confirmation')::uuid,(result_data->>'submission_id')::uuid,'TESTE - complemento recebido pela facção.');
 end if;
 perform public.register_inventory_operation(md5(batch||'legacy-receipt')::uuid,'bag_receipt',
  '421758ab-4a06-432d-a81f-76fdfcb65dd7','fcbc67f4-3f98-4dc4-97c3-a4a62fe99bf3','[{"quantity":"300"}]',
  p_note=>'TESTE - DEMO 02/11: recolhimento vinculado à remessa existente.',p_kit_id=>kid);
 -- Define prazo em três legados, com motivo e histórico, sem alterar datas passadas.
 for r in select * from(values
  ('10e71e2d-e022-4f2d-b74f-08535b337a72'::uuid,3),
  ('4f9e0a62-41ea-4a56-8ad0-0d0a8b94865f'::uuid,5),
  ('3b582378-cec1-4e44-886e-9eab2288a256'::uuid,2)
 ) v(id,days) loop
  if not exists(select 1 from public.shipment_deadline_events where company_id=cid and request_key=md5(batch||'legacy-due:'||r.id)::uuid) then
   perform public.extend_shipment_deadline(md5(batch||'legacy-due:'||r.id)::uuid,r.id,base+r.days,null,'TESTE - definição fictícia de prazo para apresentação do sistema.');
  end if;
 end loop;
 if (select count(*) from public.production_orders where company_id=cid and request_key in(
  md5(batch||'order:pacatuba')::uuid,md5(batch||'order:maracanau')::uuid,md5(batch||'order:maranguape')::uuid,md5(batch||'order:itarema')::uuid))<>4 then raise exception 'Pedidos não conciliados';end if;
 if (select count(*) from public.shipment_kits where company_id=cid and note like 'TESTE - DEMO 02/11: cenário %')<>12 then raise exception 'Remessas não conciliadas';end if;
end $demo$;
reset role;
do $$ begin
 if not exists(select 1 from public.shipment_kit_status where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f' and status='completo') or not exists(select 1 from public.shipment_kit_status where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f' and status='incompleto') then raise exception 'Faltam estados visuais';end if;
 if (select count(*)::text from auth.users)<>current_setting('demo.auth_count') then raise exception 'Identidades modificadas';end if;
 if (select md5(string_agg(user_id::text||company_id::text||role,',' order by user_id)) from public.company_users)<>current_setting('demo.memberships') then raise exception 'Vínculos modificados';end if;
 if (select md5(string_agg(id::text||name||bag_id::text||expected_quantity::text,',' order by id)) from public.production_orders where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f' and name not like 'TESTE - DEMO 02/11%')<>current_setting('demo.original_orders') then raise exception 'Previsões originais modificadas';end if;
end $$;
select jsonb_build_object(
 'orders',(select count(*) from public.production_orders where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f'),
 'workshops',(select count(*) from public.workshops where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f'),
 'kits',(select count(*) from public.shipment_kits where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f'),
 'operations',(select count(*) from public.inventory_operations where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f'),
 'notes',(select count(*) from public.production_notes where company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f'),
 'production',(select jsonb_agg(x) from(select b.name,sum(p.expected_quantity)::text ordered,sum(p.received_quantity)::text received from public.production_order_progress p join public.bags b on b.id=p.bag_id and b.company_id=p.company_id where p.company_id='abd23955-cf67-4354-8d67-ae0b7dbec40f' group by b.name)x)
) as demo_result;
rollback;
