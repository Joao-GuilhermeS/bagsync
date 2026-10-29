# Visão geral — dashboard BagSync

## Arquitetura vigente — 28/10/2026

A tela foi refatorada conforme a arquitetura solicitada: cabeçalho sucinto, filtros unificados, três KPIs clicáveis, gráfico Recharts e três blocos inferiores no mesmo grid responsivo.

| Componente | Responsabilidade |
| --- | --- |
| `overview.tsx` | Título, dashboard e grid Por Onde Começar / Acesso Rápido / Recolhimentos Recentes |
| `production-dashboard.tsx` | Estado compartilhado de pesquisa, modelo selecionado e etapa; KPIs e legenda como filtros |
| `model-select.tsx` | Seletor com busca interna, opções por ID, teclado, foco e fechamento por Escape/clique externo |
| `production-chart.tsx` | Barras agrupadas por modelo, tooltip, animação, escala e tabela acessível |
| `dashboard-config.ts` | Rótulos, ícones, cores e chaves das três métricas |
| `dashboard-skeleton.tsx` | Carregamento da estrutura completa da página |
| `src/lib/dashboard.ts` | Consultas autenticadas da empresa e últimos cinco recolhimentos |
| `src/lib/production/dashboard-metrics.ts` | Agregação exata, pesquisa, percentual e projeção visual |

Os componentes ficam em `src/components/dashboard/`; entrada em `src/app/painel/page.tsx`.

## Comportamento

- Busca textual e seleção de modelo atualizam todos os KPIs e o gráfico no cliente, sem reload.
- O seletor oferece busca interna independente, com escolha por ID. Nomes iguais não misturam registros.
- Clicar em um KPI ou na legenda mostra apenas aquela etapa no gráfico; clicar novamente ou escolher Todas as etapas restaura a comparação.
- Limpar filtros redefine pesquisa, modelo e etapa.
- O tooltip informa nome do modelo, quantidade exata e percentual relativo ao previsto daquele modelo. Funciona também pela navegação de teclado do Recharts.
- Prontas mostra o percentual referente ao total em pedido do filtro atual; sem denominador exibe traço e explicação. Excedentes podem superar 100%.
- Até seis modelos por página do gráfico; escala comum aos modelos filtrados. Gráfico com rolagem interna em telas estreitas e tabela expansível com valores exatos.
- Filtros não alteram as seções inferiores, que permanecem no contexto da empresa.
- Recolhimentos recentes: últimos cinco, com data/hora de Brasília, modelo, quantidade e status Recolhido/Estornado. A consulta resolve o modelo pelo pedido, sob a RLS existente.

Reatividade dos filtros não significa assinatura de dados em tempo real: novas operações aparecem quando a consulta é carregada/revalidada.

## Métricas preservadas

| Métrica | Fonte/regra |
| --- | --- |
| Em Pedido Geral | Previsto nos pedidos selecionados, contado uma vez por pedido |
| Em Produção | `production_tracking.remaining_quantity`: distribuído e ainda não recolhido em cada pedido/facção |
| Prontas | `production_tracking.received_quantity`: recolhimentos válidos, considerando estornos |

Prontas não estima peças que ainda estejam na facção sem recolhimento. Complementos não duplicam a distribuição. O excedente de uma facção não abate o saldo de outra.

O total pedido se sobrepõe às outras métricas, portanto não somar as três séries nem usar rosca como se fossem partes de um todo. Foram escolhidas barras agrupadas para comparar valores independentes.

As quantidades permanecem strings/BigInt. Recharts recebe somente uma projeção de geometria limitada a 1.000.000; eixos e tooltips usam as strings exatas, sem converter os quantitativos de negócio para Number. Percentuais são calculados com inteiros e exibidos com dois decimais, sem limitar excedentes. Valores projetados não retornam ao banco.

## Design e dependências

Fundo `#F8F9FA`, verde institucional `#1E3A2B`, neutros, bordas finas, cantos arredondados e `shadow-sm`. Séries usam tokens CSS. Sem banner de destaque ou painel lateral repetindo os números.

Recharts `3.10.1` e `react-is` `19.3.0` foram adicionados com versões fixas após verificar compatibilidade com React 19.3. O gráfico é carregado sob demanda apenas no cliente. A animação de 350 ms respeita prefers-reduced-motion. Fontes e componentes existentes foram mantidos.

Referências oficiais consultadas: [instalação do Recharts](https://recharts.github.io/en-US/guide/) e [acessibilidade do Recharts](https://github.com/recharts/recharts/blob/main/storybook/stories/API/Accessibility.mdx). Skill UI/UX Pro Max orientou a comparação por barras, valores textuais e interação por teclado.

## Aceite e validação

Critérios: filtros e KPIs funcionais; gráfico/tooltip com valores corretos; três blocos inferiores presentes; estados de carregamento/sem resultados; uso no celular e teclado; regras, autenticação e isolamento preservados.

Sem migrações, alterações de permissões ou gravações de dados operacionais. A coluna de modelo adicionada à consulta de recolhimentos foi conferida em leitura no projeto BagSync; havia zero recolhimentos no momento da validação, portanto nenhum registro foi criado para preencher a tabela.

Os resultados finais são registrados no checkpoint. Prévia isolada revisa os componentes sem autenticação ou gravação e não substitui a validação de ponta a ponta com sessão real.

### Resultados executados nesta refatoração

- `npm view recharts ...` e `npm view react-is@19.3.0 version`: compatibilidade conferida; `npm install --save-exact recharts@3.10.1 react-is@19.3.0` executado. Auditoria automática da instalação: zero vulnerabilidades reportadas.
- `npm run lint`: aprovado.
- `node --test tests/*.test.mjs`: 57 aprovados. Oito cenários do dashboard cobrem agregação, excedentes, filtros, homônimos, percentuais, denominador zero e projeção gráfica sem perda do valor original.
- `npx next build --webpack`: aprovado com TypeScript e geração das páginas. Não foi reavaliada a falha anterior do Turbopack; o script padrão foi preservado.
- `node tests/http-access.mjs`: login 200; 28 páginas protegidas, quatro arquivos e histórico negados sem sessão.
- Edge: prévia desktop 1440 px e celular 375 px; página sem rolagem horizontal indevida. KPI restringiu o gráfico a uma série; tooltip exibiu modelo, quantidade exata e percentual. Busca interna selecionou por Enter; filtro sem resultados e limpeza foram exercitados. Os três blocos inferiores foram revisados no mesmo grid.
- Teclado do Recharts apresentou o tooltip com ArrowRight. A tabela expansível foi aberta e conferida com os valores exatos; Escape fechou o seletor e devolveu foco ao botão.
- `git diff --check`: sem erros; apenas avisos de conversão LF/CRLF.

Capturas locais em `output/playwright/dashboard-recharts-desktop.png`, `dashboard-recharts-tooltip.png` e `dashboard-recharts-mobile.png`, ignoradas pelo Git. A prévia não cria registros nem autentica usuários. A tabela inferior preenchida e o fluxo completo com sessão real permanecem como validação manual pendente, pois não havia recolhimentos reais.
## Apresentação vigente — 29/10/2026

O responsável solicitou nova organização compacta em duas colunas, com os filtros no cabeçalho e métricas laterais. Acesso Rápido, Alertas & Pendências e Recolhimentos Recentes substituem o grid anterior com onboarding. As descrições anteriores de apresentação são históricas; os cálculos são preservados. Contrato atual: [Visão geral compacta](dashboard-compacto.md).
