# Controle de estoque — Data Table

Atualização: 29/10/2026. Refatoração visual e de consulta, sem alterar regras de estoque.

## Funcionamento

- `/painel/estoque` encaminha para `/painel/estoque/materiais`. Abas mantêm os caminhos de materiais e bolsas prontas.
- Tabela substitui cards nas duas abas. A–Z em português por padrão; clique no nome inverte Z–A. Quantidade ordena por saldo exato crescente/decrescente, com nome/ID como desempate.
- Pesquisa local por nome, ignorando acentos; status Todos, Saldo Positivo (> 0) e Saldo Negativo (< 0). Zero é neutro, visível em Todos.
- Unidade individual por material; bolsas em unidades. Não há soma nem conversão entre unidades. Valores numéricos permanecem strings; comparação usa BigInt e escala decimal comum.
- Paginação local de 10 itens após busca, filtro e ordenação. Consultas carregam todos os registros da empresa em lotes estáveis de 500 para evitar ordenar apenas uma página por ID. Não é paginação de busca no servidor nem um snapshot transacional entre lotes; não foi comprovado desempenho em grande volume.
- Coluna do nome fixa no celular; rolagem horizontal limitada ao contêiner da tabela, acessível por teclado.
- Gerente mantém Registrar entrada e Novo pedido. Ação + Entrada abre o formulário existente com o material selecionado; não grava por abrir. Perfil de consulta não recebe escrita. Bolsas prontas continuam entrando por recolhimento, sem entrada manual nova.
- Atalho ⋮ leva diretamente ao histórico filtrado pelo item. Filtro usa operações que possuem movimentos daquele material/bolsa, incluindo estornos; histórico de cada operação continua íntegro, inclusive quando contém outros materiais. Paginação preserva o filtro.

## Estrutura

- `components/ui/table.tsx`: primitivas semânticas Table/Header/Body/Row/Head/Cell no padrão local shadcn/ui.
- `components/stock/data-table-features.ts`: recursos de ordenação e paginação TanStack.
- `components/stock/stock-table.tsx`: colunas tipadas, controles, badges, ações e rodapé.
- `lib/stock/data.ts`: leitura autenticada dos saldos, nomes e unidades; todas as consultas restritas à empresa e RLS.
- `lib/stock/table.ts`: comparação exata, status e ordenação em pt-BR.
- Página de estoque integra dados e formulários existentes. `materialId` apenas preenche o formulário; autorização, validação, idempotência e RPC permanecem no servidor.
- Chaves de entrada rápida são geradas no servidor e passadas por item; não gerar chaves aleatórias diferentes na hidratação.

Usada a [estrutura Data Table do shadcn/ui](https://ui.shadcn.com/docs/components/base/data-table) com TanStack React Table **9.3.1**, versão estável verificada no npm. Primitivas adaptadas manualmente ao projeto, sem executar inicialização que sobrescrevesse componentes existentes. Dependência direta nova: `@tanstack/react-table`, fixada com lockfile; suas dependências transitivas são gerenciadas pelo npm. Sem Radix/Lucide adicionais e sem migrations. Verde #1B3B2B e fundo #F8F9FA limitados à área do estoque; tema global preservado.

## Validação

65 testes Node aprovados, incluindo três novos para precisão decimal, saldo zero/negativo e ordenação em português. Lint, TypeScript e build Webpack aprovados (34 páginas). Teste HTTP: login 200, 31 rotas protegidas, quatro arquivos e histórico negados sem sessão. `git diff --check` sem erros, com avisos LF/CRLF das alterações locais existentes.

No BagSync, leitura transacional com papel authenticated confirmou oito materiais da empresa e zero saldos de outras empresas; rollback sem gravações. Esquema real e views existentes conferidos. Nenhuma alteração no projeto Supabase antigo.

Prévia isolada com os oito materiais reais, sem gravação: A–Z/Z–A, ordenação de saldo, filtro negativo (quatro linhas) e busca sem resultados verificados. Em mobile: viewport/documento de 375 px, tabela de 820 px; após scroll de 300 px, nome permaneceu na posição horizontal de 17 px. Capturas em `output/playwright/estoque-tabela-*.png`, ignoradas pelo Git. Há apenas uma página de materiais atuais; navegação entre múltiplas páginas com volume real permanece pendente. Entrada efetiva e histórico autenticado ponta a ponta permanecem pendentes de aceite. A prévia usa actions inertes.

Checkpoint deve incluir também as alterações locais do incremento visual anterior, que não foram descartadas. Não houve commit/push pelo agente.

Entrada rápida revisada na prévia: ao abrir Entrada de Castelinho, o diálogo exibiu o título correto e selecionou seu UUID no formulário; Escape fechou sem envio.
