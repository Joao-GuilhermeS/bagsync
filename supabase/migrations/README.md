# Migrações

20261025200948_company_identity.sql aplicada no BagSync. Versão alinhada ao registro remoto; sem dados fictícios. Detalhes e validação em docs/implantacao.md e docs/desenvolvimento.md.

20261025202641_catalogos_producao.sql: facções, unidades, materiais, bolsas e composição; aplicada apenas no BagSync. Testes transacionais em ../tests/catalogos.sql. Não alterar migrações já aplicadas.

20261025204641_pedidos_movimentacoes.sql: pedidos, operações, movimentos, RPCs transacionais/idempotentes e views de saldo/progresso. Aplicada no BagSync; testes em ../tests/pedidos_movimentacoes.sql; contrato em docs/pedidos-estoque.md.

20261026074225_checklists_remessas.sql: aplicada permanentemente no BagSync após autorização. Checklist por modelo, remessa com previsão manual, entregas vinculadas ao estoque e pendências após estorno. Testes ../tests/checklists_remessas.sql aprovados antes e depois da aplicação, com rollback das fixtures. Contrato em docs/kits-remessas.md.

20261026074334_kit_delivery_reference_index.sql: aplicada no BagSync; índice composto de apoio à FK dos itens para a entrega. Aviso de FK sem índice resolvido.

20261026191246_checklist_response_types.sql: aplicada permanentemente no BagSync. Tipo checkbox/text por item do modelo e snapshot imutável nas remessas; legado sem tipo arbitrário. Arquivo antes preparado como 20261026181154 renomeado para alinhar ao histórico remoto, sem mudança do conteúdo.

20261026191312_shipment_checklist_submissions.sql: aplicada permanentemente no BagSync. Respostas/anotações imutáveis, RPC transacional e idempotente para concluir a saída, vínculo com estoque e RLS. Testes em ../tests/shipment_checklist_submissions.sql aprovados antes e depois, com rollback. Contrato em docs/controle-saida.md.

20261026194930_production_tracking_notes.sql: aplicada no BagSync; views SECURITY INVOKER de distribuição/acompanhamento, histórico paginado de leitura e observações imutáveis pelos três perfis via RPC autorizada. Gerada inicialmente como 20261026193914 e alinhada ao histórico remoto. Testes ../tests/production_tracking.sql aprovados antes e depois com rollback. Contrato em docs/tela-acompanhamento.md.
