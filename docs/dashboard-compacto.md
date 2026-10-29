# Visão geral compacta — 29/10/2026

## Escopo confirmado

Substituir a apresentação anterior pelo cabeçalho integrado, gráfico e detalhamento em duas colunas e widgets compactos de Acesso Rápido, Alertas & Pendências e Recolhimentos Recentes. A nova solicitação substitui o bloco anterior Por Onde Começar. Não alterar cálculos, permissões, estados de produção ou o significado de modelos/municípios.

Rotas `/painel` e `/painel/visao-geral` renderizam a mesma página autenticada; os links existentes continuam funcionando. O CTA de novo pedido fica no cabeçalho do dashboard, sem duplicação no topo do shell nessas duas rotas. Outros perfis recebem apenas suas ações permitidas.

## Layout e interação

- Cabeçalho flexível, sem card próprio: título, escopo, busca, seletor pesquisável, Limpar e novo pedido para gerente.
- Grid principal `lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]`, aproximadamente 65/35, com colunas empilhadas abaixo de 1024 px.
- Gráfico Recharts existente em modo compacto, pills de etapas, tooltip com números exatos/percentuais e tabela acessível expansível.
- Detalhamento lateral reativo: pedido, produção, facções distintas com saldo pendente e recolhidas. Percentual de conclusão textual preserva excedentes; barra visual limitada a 100%. Sem previsão, mostrar estado explícito.
- Widgets em três colunas no desktop, mesma altura por linha do grid; empilhados em tablet/celular. Três recolhimentos recentes da empresa, explicitamente globais, sem dar a impressão de buscar apenas entre três registros por modelo.
- Sem altura fixa que corte dados, bloqueio de zoom ou overflow da página. Quantidade de rolagem depende do viewport, nomes e dados; não prometer ausência total em qualquer notebook.
- Busca e seleção filtram gráfico, métricas, facções e alertas. Pills selecionam séries sem alterar os totais laterais.

## Dados reais e contratos

`dashboardData` preserva agregação exata de pedidos e production_tracking. Facções ativas são IDs distintos nos contextos dos modelos filtrados com `remaining_quantity > 0`; pedidos simultâneos não duplicam a contagem.

Alertas usam `production_deadlines` para atrasados/a vencer/sem prazo e `shipment_kit_status` para kits incompletos, associados ao modelo pela remessa. Categorias podem se sobrepor; não somar como total de remessas distintas. Nenhum prazo ou pendência é simulado. São leituras existentes, autenticadas, filtradas por empresa e RLS. Paginação estável de 500 registros evita truncamento na agregação; não é medição de desempenho em alto volume.

Arquivos centrais: `components/dashboard/production-dashboard.tsx`, `widgets.tsx`, `production-chart.tsx`, `dashboard-skeleton.tsx`, `lib/dashboard.ts` e `lib/production/dashboard-scope.ts`. SearchSelect ganha apenas opção de label compacta; seus outros usos mantêm o padrão anterior.

Sem dependências ou migrations novas. Tema verde escuro aplicado ao dashboard; identidade global preservada. Skeleton acompanha a nova estrutura; movimento reduzido do gráfico e CSS continua respeitado.

## Verificação

70 testes Node aprovados, incluindo contagem distinta de facções entre pedidos/modelos. Lint, TypeScript e build Webpack aprovados (36 páginas). HTTP: login 200, 33 rotas protegidas, quatro arquivos e histórico negados sem sessão. `git diff --check` sem erros, somente avisos LF/CRLF.

Prévia isolada sem gravação, com três modelos reais: em notebook 1366×768, largura do documento de 1366 px. A primeira versão desta reorganização tinha 940 px de altura; a versão refinada ficou com 790 px (22 px de rolagem além da janela), sem cortar widgets/dados. Não é comparação com a versão anterior à tarefa, nem garantia para outros dados ou níveis de zoom. Capturas em `output/playwright/dashboard-compact-*.png`, ignoradas pelo Git. Gráfico compacto mostra três modelos por página, com tooltip e tabela exata preservados.

Não equivale a aceite autenticado completo ou comprovação de ganho de latência/CLS. Nenhum commit/push/publicação executado pelo agente.

Busca sem acentos por Maracanau retornou pedido de 15.000, produção/recolhidas zero, zero facções ativas e um kit incompleto. Busca inexistente mostrou estado vazio mantendo os três recentes globais identificados. Mobile 375 px: largura do documento de 375 px, sem overflow horizontal. Leitura real sob authenticated/RLS confirmou três contextos de produção, três remessas com prazo a acompanhar e quatro kits acessíveis da empresa; zero registros de outras empresas na consulta de prazos. Nenhuma escrita de negócio foi executada.

Seleção via teclado no dropdown escolheu Itarema e atualizou o detalhamento para 159 em pedido e zero produção/recolhidas. Revisão final mobile: controles empilhados sem truncar os campos, gráfico com 309 px dentro do viewport de 375 px. Tablet 768 px: documento de 768 px e grid principal em uma coluna de 704 px.
