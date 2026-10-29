-- Testes transacionais da revisão manual, sem dados persistentes.
begin;
select set_config('test.uid',(select user_id::text from public.company_users where role='gerente_logistico' limit 1),true);
select set_config('test.company',(select company_id::text from public.company_users where user_id=current_setting('test.uid')::uuid),true);
insert into public.materials(company_id,name,unit_id) select current_setting('test.company')::uuid,'__review__',id from public.measurement_units where company_id=current_setting('test.company')::uuid limit 1 returning set_config('test.material',id::text,true);
insert into public.bags(company_id,name) values(current_setting('test.company')::uuid,'__review__') returning set_config('test.bag',id::text,true);
insert into public.workshops(company_id,name) values(current_setting('test.company')::uuid,'__review__') returning set_config('test.workshop',id::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $$
declare cid uuid:=current_setting('test.company')::uuid; bid uuid:=current_setting('test.bag')::uuid; wid uuid:=current_setting('test.workshop')::uuid; tid uuid; oid uuid; kid uuid; iid uuid; req uuid:=gen_random_uuid(); answers jsonb; result_data jsonb; n bigint; before_ops bigint;
begin
 insert into public.bag_checklist_items(company_id,bag_id,material_id,label,input_type) values(cid,bid,current_setting('test.material')::uuid,'Material','checkbox') returning id into tid;
 oid:=(public.create_production_order(gen_random_uuid(),'__review__',bid,100)->>'order_id')::uuid;
 kid:=(public.create_shipment_kit(gen_random_uuid(),oid,wid,100,jsonb_build_array(jsonb_build_object('template_item_id',tid,'expected_quantity','1')),null,((now() at time zone 'America/Sao_Paulo')::date+7))->>'kit_id')::uuid;
 perform set_config('test.kit',kid::text,true);
 select id into iid from public.shipment_kit_items where kit_id=kid;
 perform public.set_shipment_kit_review(gen_random_uuid(),kid,true,'Conferir');
 perform public.set_shipment_kit_review(gen_random_uuid(),kid,false,'Corrigir alerta');
 if (select status from public.shipment_kit_status where kit_id=kid)<>'incompleto' then raise exception 'Não pode ocultar falta quantitativa';end if;
 answers:=jsonb_build_array(jsonb_build_object('kit_item_id',iid,'mode','complete','text',null));
 result_data:=public.submit_shipment_checklist_review(req,kid,answers,'Saída',true);
 select count(*) into before_ops from public.inventory_operations where company_id=cid;
 if (select pending_items from public.shipment_kit_status where kit_id=kid)<>0 or (select status from public.shipment_kit_status where kit_id=kid)<>'incompleto' then raise exception 'Alerta manual ignorado';end if;
 perform public.submit_shipment_checklist_review(req,kid,answers,'Saída',true);
 if (select count(*) from public.inventory_operations where company_id=cid)<>before_ops or (select count(*) from public.shipment_kit_review_events where company_id=cid and request_key=req)<>1 then raise exception 'Replay duplicado';end if;
 begin perform public.submit_shipment_checklist_review(req,kid,answers,'Saída',false);raise exception 'Payload divergente aceito';exception when sqlstate '22023' then null;end;
 perform public.set_shipment_kit_review(gen_random_uuid(),kid,false,'Resolvido');
 if (select status from public.shipment_kit_status where kit_id=kid)<>'completo' then raise exception 'Kit não normalizou';end if;
 select count(*) into n from public.kit_checklist_submissions where kit_id=kid;
 begin perform public.submit_shipment_checklist_review(gen_random_uuid(),kid,answers,null,null);raise exception 'Flag nula aceita';exception when sqlstate '22023' then null;end;
 if (select count(*) from public.kit_checklist_submissions where kit_id=kid)<>n then raise exception 'Wrapper não atômico';end if;
 if (select count(*) from public.inventory_operations where company_id=cid)<>before_ops then raise exception 'Correção movimentou estoque';end if;
 begin delete from public.shipment_kit_review_events where kit_id=kid;raise exception 'Exclusão permitida';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.company_users set role='motorista' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $$ begin
 begin perform public.set_shipment_kit_review(gen_random_uuid(),current_setting('test.kit')::uuid,true);raise exception 'Motorista escreveu';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.company_users set role='gestor' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $$ begin
 begin perform public.set_shipment_kit_review(gen_random_uuid(),current_setting('test.kit')::uuid,true);raise exception 'Gestor escreveu';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.companies(name) values('__review_other__') returning set_config('test.other',id::text,true);
update public.company_users set company_id=current_setting('test.other')::uuid,role='gerente_logistico' where user_id=current_setting('test.uid')::uuid;
set local role authenticated;
do $$ begin
 if exists(select 1 from public.shipment_kit_review_events where kit_id=current_setting('test.kit')::uuid) then raise exception 'RLS vazou revisão';end if;
 begin perform public.set_shipment_kit_review(gen_random_uuid(),current_setting('test.kit')::uuid,true);raise exception 'Acesso cruzado permitido';exception when sqlstate '22023' then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.set_shipment_kit_review(gen_random_uuid(),current_setting('test.kit')::uuid,true);raise exception 'Anônimo executou';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
