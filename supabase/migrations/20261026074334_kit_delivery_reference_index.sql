-- Índice de apoio à FK entre itens e cabeçalho da entrega; sem alterar dados.
create index kit_delivery_items_delivery_idx
 on public.kit_delivery_items(company_id,kit_id,operation_id);
