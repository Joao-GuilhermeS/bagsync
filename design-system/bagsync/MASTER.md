# Design system — BagSync

Direção fornecida pelo responsável em 27/10/2026 e adaptada às funções existentes.

## Base visual

| Uso | Valor |
| --- | --- |
| Verde floresta / navegação / ação principal | #1E3A2B |
| Oliva / destaque / foco | #4D6B32 |
| Menta / seleção e apoio | #E8F0E6 |
| Fundo | #F6F7F5 |
| Superfície | #FFFFFF |
| Texto principal | #17251D |
| Bordas | #E1E7DF |

Fonte Geist já existente; números tabulares, hierarquia clara e cartões com bordas suaves. Tema claro consistente, sem inversão automática pelo sistema operacional. Tailwind v4 com tokens `@theme`. Ícones SVG reutilizáveis, sem emojis como controles.

## Interação

- Controles principais com área mínima de 44 px; rótulos visíveis e foco destacado.
- Formulários em diálogo nativo, com título acessível, fechamento explícito/Escape e retorno de foco.
- Navegação lateral no desktop; barra inferior e menu completo no mobile, respeitando área segura.
- Pendência em âmbar; andamento em índigo; estado regular em oliva; divergência/estorno em rosa/vermelho. Sempre acompanhar cor com texto.
- Mensagem de sucesso anunciada; erros e avisos de estoque permanecem no formulário.
- Redução de movimento respeitada; sem depender de hover para ações essenciais.

## Origem e limites

Aplicadas as skills UI/UX Pro Max e Playwright. A busca inicial de design system retornou padrão de marketing e paleta azul inadequados ao escopo; a busca por produto operacional não encontrou correspondência validada. Não foram adotados esses resultados como padrão aprovado. A base é a paleta explícita do usuário e as orientações gerais de legibilidade/foco, verificadas na prévia local.

Não criar regras operacionais, entidades ou permissões para preencher elementos do layout. Usar dados reais no aplicativo e estados vazios honestos. Não prometer desempenho ou acessibilidade integral sem medição específica.
