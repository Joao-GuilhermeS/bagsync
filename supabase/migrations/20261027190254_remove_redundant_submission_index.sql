-- A FK das confirmações usa kit_checklist_submissions_company_id_id_key,
-- restrição original já suficiente. Remover apenas a duplicata criada neste bloco.
alter table public.kit_checklist_submissions drop constraint kit_checklist_submissions_company_id_key;
