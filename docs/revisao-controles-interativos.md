# Revisão dos controles interativos — 29/10/2026

## Escopo e diagnóstico

Solicitação: investigar botões e filtros, começando pela Visão geral. Git limpo no início. Revisados o seletor compartilhado, dashboard, menus, estoque, Expedição e seus componentes de formulário. Não houve mudanças de banco, dependências ou permissões.

O clique com mouse e o toque no seletor de modelo funcionaram na reprodução isolada com os componentes reais e dados já existentes. Não foi reproduzida a falha relatada de clique no ambiente de uso do responsável; foi solicitado URL/navegador e se o problema ocorre ao abrir ou escolher uma opção.

Falha reproduzida: com o botão de modelos focado, ArrowDown não abria a lista (`aria-expanded=false`). Corrigida em `src/components/ui/search-select.tsx`, também utilizado na seleção de pedido e facção da Expedição.

## Correção

- ArrowDown/ArrowUp abrem e transferem foco à busca; Enter e Espaço continuam funcionando como botões nativos.
- Setas navegam entre opções; Home/End alcançam os extremos; Enter seleciona; Escape fecha e retorna ao botão.
- Rolagem automática restrita ao contêiner da lista. Removido `scrollIntoView`, que pode deslocar também os ancestrais/página. Overscroll fica contido na lista.
- Preservados busca sem acentos, filtro por ID, clique/toque, fechamento externo, modo compacto e integração com formulários.

## Testes de interface realizados

Playwright/Edge, prévia local isolada, componentes reais com snapshots de dados existentes. Ações de servidor substituídas por respostas inertes; nenhum formulário de negócio foi enviado.

- Dashboard: selecionar modelo com mouse e toque; abrir por teclado, buscar e selecionar com Enter; KPI aplica etapa do gráfico; Limpar; busca sem resultado; recolher/expandir menu.
- Estoque: ordenar saldo crescente (primeiro saldo -712); buscar fita e filtrar negativos (duas linhas); abrir entrada rápida e fechar sem enviar.
- Expedição: selecionar pedido e facção; Continuar/Voltar preservando seleção; prazo de sete dias a partir de 29/10 resulta em 05/11/2026; marcar OK, alternar parcial e voltar à conferência; filtro Em Trânsito.

Os testes não constituem validação autenticada de todos os botões do SaaS. Emissão, baixa de estoque, confirmação de entrega, estorno, exclusão e envio de observações não foram executados em produção. A reprodução do problema de clique no ambiente do responsável permanece pendente de identificação desse ambiente.

## Validação técnica final

- `npm run lint`: aprovado.
- `node --test tests/*.test.mjs`: 70 aprovados, zero falhas.
- `npx next build --webpack`: aprovado, incluindo TypeScript e geração de 36 páginas.
- `node tests/http-access.mjs`: login 200; 33 rotas protegidas, quatro arquivos e histórico negados sem sessão.
- `git diff --check`: sem erros.
- Versão final no Edge: ArrowUp, Home/End, Enter, Escape, seleção por toque em 375×812 e abertura/fechamento do menu móvel aprovados.

Nenhum commit/push executado. Checkpoint sugerido: `Corrige navegação por teclado dos seletores e documenta revisão dos controles`.

## Diagnóstico após a captura do Brave

A captura posterior mostrou fonte interna 403 e falhas de WebSocket no endereço `http://26.24.177.139:3000`. O Next.js 16.4.3 instalado bloqueia recursos internos de desenvolvimento com Origin não autorizado. O IP não estava configurado. Isso explica o bloqueio observado de recursos; o dashboard autenticado completo no Brave ainda precisa ser conferido após atualizar.

Adicionado somente `26.24.177.139` em `allowedDevOrigins` no next.config.ts. A opção é específica do servidor de desenvolvimento, sem alterar Auth/RLS ou permitir curingas. Referência: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins

Teste no servidor real já em execução, com GET de `/__nextjs_font/geist-latin.woff2` e header Origin:
- `http://26.24.177.139:3000`: 200, font/woff2.
- Origem externa não autorizada: 403.

Novo teste `tests/dev-origins.test.mjs` reproduz bloqueio sem configuração e valida permissão para chunks, fonte e endpoints HMR com o IP configurado; mantém rejeição de origens desconhecidas e opacas. Suíte final: 71 testes aprovados. Build Webpack e TypeScript aprovados após a alteração. Lint aprovado. Nenhum servidor do responsável foi encerrado; tentativa de servidor temporário foi recusada pelo Next por existir outro dev server, sem remover o lock.

No Brave, atualizar com Ctrl+Shift+R. Se o processo não recarregar a configuração automaticamente, reiniciar `npm run dev -- --hostname 0.0.0.0` no terminal em que ele já é executado. Não é necessário desativar as proteções do navegador. O aceite visual autenticado permanece pendente do responsável.
