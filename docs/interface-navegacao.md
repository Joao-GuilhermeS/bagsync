# Interface e navegação — BagSync

## Layout vigente — atualização em 28/10/2026

Paleta esmeralda, Inter, sidebar clara, grupos por função e skeletons reutilizáveis. A organização e identidade atuais estão em [Layout e carregamento](ux-layout-carregamento.md), que substitui os agrupamentos e a paleta históricos descritos abaixo. BagSync, perfis, métricas e regras operacionais foram preservados.

## Dashboard — atualização em 28/10/2026

Refatoração vigente: filtros unificados com seletor pesquisável, KPIs que filtram séries, gráfico Recharts e três blocos inferiores no mesmo grid. Skeleton e tabela compacta dos últimos recolhimentos incluídos. Detalhes atuais em [dashboard-visao-geral.md](dashboard-visao-geral.md).

Os cards superiores de bolsas pendentes, remessas do dia, kits e saldo negativo foram substituídos por filtro e gráfico dos quantitativos de bolsas por modelo. As seções inferiores foram mantidas. Contrato atual em [dashboard-visao-geral.md](dashboard-visao-geral.md), que substitui a descrição histórica desses indicadores abaixo.

## Atualização — Expedição e entregas (27/10/2026)

Fábrica contém Expedição; Operação contém Entregas de materiais e o fluxo por modelo/recolhimentos. Removida a aba de medidas; unidades predefinidas no seletor de materiais. Contrato vigente em [Expedição e entregas](expedicao-entregas.md), que substitui descrições históricas divergentes abaixo.

## Objetivo e escopo

Reorganização autorizada em 27/10/2026 para facilitar a localização das funções existentes, com prioridade ao uso em celular. Sem alterações de banco, autenticação ou permissões. O texto de referência do responsável orienta a apresentação; funcionalidades ainda não aprovadas não foram adicionadas.

## Organização das páginas

| Grupo | Funções |
| --- | --- |
| Painel | Indicadores reais, orientação do fluxo, atalhos e recolhimentos recentes |
| Operação | Entregas/recolhimentos e acompanhamento da produção |
| Fábrica | Pedidos de produção e remessas/checklists |
| Estoque | Abas de materiais e bolsas prontas |
| Cadastros | Facções, modelos, materiais e unidades; composição/checklist dentro do modelo |
| Consultas | Histórico de movimentos e exportações |

Menu lateral retrátil no computador; navegação inferior e menu completo no celular. Página atual destacada. Empresa e perfil vêm do vínculo autenticado. O motorista recebe atalhos de operação e cadastros de consulta pertinentes; autorização continua no servidor e no banco.

O entregador segue modelo → facção → operação. Na facção, escolhe entrega de materiais ou recolhimento de bolsas, preservando o pedido específico. Todos os modelos cadastrados continuam disponíveis. Município não é uma etapa separada.

Criação/edição de cadastros, composição, checklist, pedido e entrada de materiais usam painéis acionados por botão. Estornos exigem abertura do painel de confirmação e mantêm a confirmação explícita existente. Erros continuam junto aos formulários; sucessos têm aviso acessível.

## Indicadores e regras preservadas

- Bolsas pendentes: soma do saldo remanescente por pedido/facção no acompanhamento existente.
- Remessas de hoje: preparadas na data de Brasília; não representa entrega efetiva.
- Kits incompletos: estado calculado pelo banco.
- Saldos negativos: quantidade de materiais com saldo negativo; não é um limite mínimo inventado.
- Recolhimentos recentes: últimos cinco registros, identificando estornos.
- Quantidades continuam precisas, sem conversão de valores de negócio para ponto flutuante.

Não foram adicionados seletor de empresa (usuário pertence a uma), prazo de atraso, estoque mínimo, foto, novos dados de endereço/documento ou roteirização. Não há fechamento automático de pedido quando a quantidade é atendida.

## Componentes e identidade

Tema em `src/app/globals.css`; componentes em `src/components/ui`, `layout`, `dashboard` e `driver`. Navegação em `src/lib/navigation.ts`; consultas do painel em `src/lib/dashboard.ts`.

Ver [design system](../design-system/bagsync/MASTER.md). A dependência shadcn/ui permanece planejada, não instalada: os componentes deste incremento usam React, Tailwind e diálogo nativo, sem novas dependências do projeto.

## Aceite e validação

Critérios: localizar funções por grupo, navegar no celular sem rolagem horizontal nas telas verificadas, abrir/fechar painéis por teclado, preservar ações e permissões existentes e obter build/lint/testes aprovados.

Prévia isolada dos componentes reais revisada no Edge: painel desktop (1440 px), entregador mobile (375 px), painel de cadastro, paisagem (812 px) e catálogo com fonte raiz ampliada a 200%. Larguras medidas sem transbordamento horizontal no catálogo; Escape fecha o diálogo e devolve foco ao botão. Capturas locais em `output/playwright/`, ignoradas pelo Git. A prévia usa estado vazio, não grava e não autentica.

Validação completa dos formulários com sessão real, demais estados preenchidos, impressão física e medições de latência/carga continuam pendentes. Reorganização visual não constitui comprovação de ganho de desempenho.

Resultados técnicos deste incremento são registrados no checkpoint de entrega; os comandos reproduzíveis são `node --test tests/*.test.mjs`, `npm run lint`, `npm run build`, `node tests/http-access.mjs` e `git diff --check`.

Execução final: 45 testes Node e lint aprovados. `npm run build` falhou internamente ao iniciar subprocesso do Turbopack, também fora do sandbox. A alternativa `npx next build --webpack` compilou, validou TypeScript e gerou as 26 páginas com sucesso. O script padrão e as dependências foram preservados; a falha específica do Turbopack permanece pendente de diagnóstico.

Nesse build, `node tests/http-access.mjs` passou: login 200, 23 páginas protegidas, três arquivos e histórico negados sem sessão. `git diff --check` sem erros (somente avisos de conversão LF/CRLF). Nenhuma migração ou teste SQL novo foi necessário neste incremento de apresentação.
