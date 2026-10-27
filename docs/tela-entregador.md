# Tela do entregador

## Atualização — Expedição e entregas (27/10/2026)

Materiais a entregar vêm somente de romaneios emitidos, sem estorno, e são confirmados sem nova baixa. Recolhimento permanece independente. Contato/endereço da facção exibidos no contexto. Contrato vigente em [Expedição e entregas](expedicao-entregas.md), que substitui descrições históricas divergentes abaixo.

## Regra corrigida em 26/10/2026

Município é o nome do modelo de bolsa neste projeto. Usar apenas **Modelo** como referência operacional; não adicionar entidade, campo ou etapa de município atendido. O endereço geográfico da facção permanece um dado separado, ainda não estruturado. Não renomear registros reais automaticamente.

Navegação confirmada: **Modelo → Facção → Entrega ou recebimento**. Mostrar todos os modelos cadastrados, inclusive sem produção. A implementação anterior que separava município/modelo existia na documentação; não havia coluna ou tabela de município no banco para remover. Requisitos, regras, instruções do projeto e documentos relacionados foram corrigidos.

## Implementação deste incremento

- `/painel/entregador`: cards de modelos da empresa, paginados em 25 registros. Acesso também no início e navegação principal.
- `/painel/entregador/[bag]`: escolha de facção cadastrada, também paginada. Não existe regra confirmada de compatibilidade facção/modelo; não criar restrição ou vínculo fictício.
- `/painel/entregador/[bag]/[workshop]`: histórico de materiais enviados e bolsas recebidas, romaneios existentes em PDF e formulário para entrega de materiais/recolhimento de bolsas.
- Quando há somente um pedido do modelo, o contexto é definido automaticamente. Se houver vários, selecionar o pedido dentro da tela; somente pedidos do modelo são oferecidos. Modelo sem pedido continua visível, com orientação de cadastro pelo gerente.
- Facção vem pré-selecionada; o seletor contém apenas a facção escolhida. Cada operação continua vinculada a pedido e facção pelas RPCs existentes.
- Histórico filtra empresa, pedido e facção. Paginação mantém o pedido selecionado.
- Total líquido de bolsas recolhidas vem de movimentações assinadas desse modelo/pedido/facção, incluindo os estornos. Soma com BigInt, sem conversão para Number, com materiais excluídos dessa contagem.
- Gerente e Motorista registram operações; Gestor consulta. Nenhuma permissão de escrita foi ampliada. Todos os acessos verificam identidade/empresa e continuam sujeitos a RLS. Identificadores de outro contexto ou inexistentes levam a página não encontrada.

Este incremento reutiliza o registro transacional e idempotente existente. A cópia de payload/chave em resultado incerto e os avisos de estoque negativo/excesso foram preservados. Não há funcionamento offline. Interfaces em uma coluna no celular e controles de pelo menos 44 px.

## Limites explícitos

Atualização: o envio na tela do entregador agora seleciona uma remessa preparada e conclui o checklist, com quantidade separada, baixa transacional e novo PDF. O formulário operacional ao lado fica dedicado ao recolhimento de bolsas prontas. [Contrato e validações do controle de saída](controle-saida.md). Entregas genéricas feitas nas telas antigas continuam no histórico, sem atribuição automática a kits.

Tabela consolidada e observações pelos três perfis implementadas em [acompanhamento da produção](tela-acompanhamento.md), acessível também pela escolha de modelo do entregador. Rotas atribuídas continuam pendentes. Não apresentar previsão de kit não enviado como material efetivamente entregue. Migrações de tipos e respostas do checklist aplicadas no BagSync; a implementação de saída está documentada separadamente.

## Arquivos e validação

Criados `src/app/painel/entregador/**`, `src/lib/production/driver-progress.ts` e `tests/driver-progress.test.mjs`. Ajustados formulário operacional (facção pré-selecionada), histórico (filtro por facção), paginação (preserva pedido), navegação, início, teste HTTP e documentação.

- `node --test tests/*.test.mjs`: 33 aprovados. Novos testes cobrem estornos, soma de parciais, inteiros grandes e rejeição de frações/NaN.
- `npm run lint`: aprovado.
- `npm run build`: aprovado; três novas rotas compiladas.
- `node tests/http-access.mjs`: login 200, 19 páginas exigindo sessão e dois downloads negados sem sessão. Executado fora do sandbox devido ao bloqueio de loopback.
- `git diff --check`: sem erros; Git avisa normalização LF/CRLF em alguns documentos.
- Consulta somente leitura confirmou FK composta das movimentações para operações, usada na leitura do total recebido.

Sem teste autenticado/visual no navegador ou novo teste de escrita no banco neste incremento. Não foram alteradas tabelas, RLS, credenciais ou dados reais. Sem dependências instaladas, migração aplicada, commit ou push. Alterações locais já existentes e o índice de staging do usuário foram preservados; revisar também `git diff --cached` antes de versionar.
