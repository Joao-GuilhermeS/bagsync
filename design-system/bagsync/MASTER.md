# Design system — BagSync

Direção atualizada pelo responsável em 28/10/2026: visual clean com verde esmeralda, mantendo BagSync e as regras existentes. Substitui a paleta de 27/10.

## Base visual

| Uso | Valor |
| --- | --- |
| Ação principal / ícones ativos | #00875A |
| Verde de texto, hover e foco | #00734D |
| Seleção e apoio | #E6F4EA |
| Fundo | #F8FAFC |
| Superfície | #FFFFFF |
| Texto principal | #0F172A |
| Texto secundário | #64748B |
| Bordas | #E2E8F0 |

Fonte Inter via next/font; Geist Mono mantida para uso monoespaçado. Números tabulares, hierarquia clara, cartões brancos com raio de 16 px e shadow-sm. Sidebar branca, rota ativa com fundo suave e ícone esmeralda. Tema claro consistente, sem inversão automática pelo sistema operacional. Tailwind v4 com tokens `@theme`. Ícones SVG reutilizáveis, sem nova dependência de ícones. O token legado forest agora representa grafite para títulos; ações usam primary.

## Interação

- Controles principais com área mínima de 44 px; rótulos visíveis e foco destacado.
- Formulários em diálogo nativo, com título acessível, fechamento explícito/Escape e retorno de foco.
- Navegação lateral no desktop; barra inferior e menu completo no mobile, respeitando área segura.
- Skeletons estruturais para métricas, gráficos, cards, tabelas e formulários; estado anunciado por aria-busy/status. Sem atraso artificial para demonstrar carregamento.
- Entrada do conteúdo em 240 ms, deslocamento de 12 px. Shell estável entre rotas. Movimento reduzido elimina repetição das animações e reduz sua duração.
- Botões com feedback de espera preservam o rótulo no layout, ficam desabilitados e mantêm as chaves de idempotência do formulário.
- Pendência em âmbar; andamento em índigo; estado regular em oliva; divergência/estorno em rosa/vermelho. Sempre acompanhar cor com texto.
- Mensagem de sucesso anunciada; erros e avisos de estoque permanecem no formulário.
- Redução de movimento respeitada; sem depender de hover para ações essenciais.

## Origem e limites

Aplicadas as skills UI/UX Pro Max e Playwright. A busca inicial de design system retornou padrão de marketing e paleta azul inadequados ao escopo; a busca por produto operacional não encontrou correspondência validada. Não foram adotados esses resultados como padrão aprovado. A base é a paleta explícita do usuário e as orientações gerais de legibilidade/foco, verificadas na prévia local.

Não criar regras operacionais, entidades ou permissões para preencher elementos do layout. Usar dados reais no aplicativo e estados vazios honestos. Não prometer desempenho ou acessibilidade integral sem medição específica.

## Visão geral — refatoração em 28/10/2026

Cabeçalho sucinto, filtros em uma barra, três KPIs clicáveis e barras agrupadas Recharts. Grid inferior de três blocos no desktop, duas colunas no tablet e uma no celular. Cartões brancos com bordas finas, raios de 16 px e shadow-sm. Séries em tokens --chart-ordered, --chart-production e --chart-ready. Evitar banner extra e repetição dos números em painéis laterais. Contrato em docs/dashboard-visao-geral.md.
