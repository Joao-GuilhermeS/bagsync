# Modelo relacional — base definida para implementação

## Atualização — Expedição e entregas (27/10/2026)

workshops ganhou contato/endereço. shipment_delivery_confirmations registra recebimento na facção, com FK composta e unicidades; shipment_dispatches expõe os estados sob RLS. measurement_units recebe unidades predefinidas por empresa. Contrato vigente em [Expedição e entregas](expedicao-entregas.md), que substitui descrições históricas divergentes abaixo.

## Identidade e isolamento

- companies: id UUID PK; name texto obrigatório não vazio; created_at timestamptz.
- company_users: user_id UUID PK/FK auth.users; company_id UUID FK companies obrigatório; role restrito a gerente_logistico, motorista ou gestor.
- user_id como PK impõe no máximo uma empresa por usuário. Usuário Auth sem vínculo não acessa operações.
- Provisionamento administrativo pelo desenvolvedor; nenhum usuário da aplicação altera o próprio papel ou empresa.
- RLS: usuário autenticado consulta somente seu próprio vínculo e a empresa desse vínculo; sem INSERT/UPDATE/DELETE dessas tabelas para clientes autenticados. Verificar revogação de grants padrão.
- Índice de company_id para consultas de vínculos. Não armazenar e-mail/senha duplicados; identidade no Auth.

Isso define a base técnica, ainda sem migração aplicada. Supabase CLI não encontrado no PATH neste diagnóstico; geração de migração deve ocorrer via CLI, após disponibilizar a ferramenta e selecionar ambiente.

## Entidades operacionais identificadas, ainda não fechadas

Facções/costureiras, materiais, bolsas, remessas/entregas, itens enviados e recolhimentos/itens recebidos. Todas precisam de empresa proprietária, relacionamentos restritos à mesma empresa e regras de quantidade definidas. Campos e vínculos entre remessas e retornos dependem de respostas; não há SQL operacional aprovado.

## Pedidos e recebimentos — refinamento

- Pedido identifica a operação (exemplo informado pelo responsável: bolsas Maracanaú).
- Recebimentos pertencem a pedido; relação pedido 1:N recebimentos permite retornos parciais.
- Cada quantidade recebida abate o previsto no pedido. Total recebido é agregado dos recebimentos válidos; não duplicar contagem em registros de transporte e estoque.
- Material possui unidade explícita; não agregar quantidades de unidades distintas. Estoque permite saldo negativo e precisa devolvê-lo com indicação de aviso.
- Gravação de recebimento e seu efeito no estoque devem ocorrer na mesma transação, com idempotência e referências da mesma empresa.
- Estrutura de itens/modelos por pedido, tolerância de excesso, cancelamento e precisão das quantidades ainda serão fechados antes do SQL operacional.

## Estado implementado

companies e company_users criadas no BagSync pela migração 20261025200948_company_identity.sql. RLS habilitado e privilégios verificados. SQL operacional ainda não aplicado. As referências anteriores a CLI ausente/migração não aplicada descrevem o estado anterior e estão superadas por esta atualização.

## Catálogos implementados — 25/10/2026

Migração 20261025202641 adiciona workshops, measurement_units, materials, bags e bag_materials, com empresa proprietária, FKs compostas, índices, RLS e permissões. Dicionário, cardinalidades, restrições e evidências em [catálogos de produção](catalogos-producao.md). Pedidos e movimentações permanecem pendentes; trechos anteriores descrevem o histórico.

## Pedidos e estoque implementados

production_orders (um modelo por pedido); inventory_operations (entradas, entregas, recebimentos e estornos); stock_movements (razão assinado). Views de saldos/progresso com security_invoker. Escrita apenas por RPCs com autorização derivada da sessão. Migração 20261025204641; [dicionário, relacionamentos, permissões e testes](pedidos-estoque.md).

## Checklists e remessas — aplicados em 26/10/2026

Migração 20261026074225: bag_checklist_items, shipment_kits, shipment_kit_items, kit_deliveries e kit_delivery_items; duas views de progresso/status e duas RPCs transacionais. Quantidades previstas manuais, vínculo com estoque existente, histórico preservado e RLS. Migração 20261026074334 adiciona índice de apoio à FK da entrega. [Contrato e evidências](kits-remessas.md). Aplicadas somente no BagSync após autorização, com testes transacionais aprovados.

## Respostas e controle de saída — aplicados em 26/10/2026

Migração 20261026191246 acrescenta input_type ao modelo e ao snapshot. Migração 20261026191312 cria kit_checklist_submissions (preenchimento, operação opcional, chave, nota, autor/data) e kit_checklist_answers (item, modo, texto livre, quantidade). FKs compostas da mesma empresa/kit, RLS e histórico sem escrita direta. submit_shipment_checklist grava respostas e baixa na mesma transação, ou somente respostas quando não houver envio. [Dicionário, permissões e testes](controle-saida.md).

## Acompanhamento e observações — aplicado em 26/10/2026

Migração 20261026194930: production_notes (empresa/pedido/facção, texto, chave, autor/perfil/data); FKs compostas, RLS e escrita apenas por add_production_note. Views production_kit_distribution e production_tracking usam security_invoker, com agregações independentes para evitar dupla contagem. Histórico paginado por production_tracking_history, somente leitura/SECURITY INVOKER. [Dicionário e evidências](tela-acompanhamento.md).
