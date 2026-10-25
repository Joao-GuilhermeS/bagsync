# Migrações

20261025200948_company_identity.sql aplicada no BagSync. Versão alinhada ao registro remoto; sem dados fictícios. Detalhes e validação em docs/implantacao.md e docs/desenvolvimento.md.

20261025202641_catalogos_producao.sql: facções, unidades, materiais, bolsas e composição; aplicada apenas no BagSync. Testes transacionais em ../tests/catalogos.sql. Não alterar migrações já aplicadas.

20261025204641_pedidos_movimentacoes.sql: pedidos, operações, movimentos, RPCs transacionais/idempotentes e views de saldo/progresso. Aplicada no BagSync; testes em ../tests/pedidos_movimentacoes.sql; contrato em docs/pedidos-estoque.md.
