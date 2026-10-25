# Telas de pedidos e movimentações — incremento 4

## Diagnóstico e escopo

Base verificada em 25/10/2026: commit cb380b8, árvore limpa. RPCs create_production_order/register_inventory_operation confirmadas no BagSync; migrações, RLS e contrato anteriores preservados. Autenticação validada pelo responsável no incremento anterior.

Implementação: telas Next.js/React/Tailwind consumindo RPCs existentes com sessão Supabase no servidor. Nenhuma dependência, migração, política, senha, credencial ou vínculo alterado. Projeto antigo intocado.

## Rotas e comportamento

| Rota | Funcionalidade |
| --- | --- |
| /painel/pedidos | Lista paginada e criação pelo Gerente Logístico: nome, modelo e quantidade inteira prevista. |
| /painel/pedidos/[id] | Previsão, recebido, restante, aviso de excedente, histórico e registro de entrega/recebimento pelo gerente ou motorista. |
| /painel/estoque/materiais | Saldo central por material/unidade, destaque de saldo negativo e entrada de vários materiais pelo gerente. |
| /painel/estoque/bolsas | Saldo central por modelo, separado da consulta de materiais. Entradas por recebimento no pedido. |
| /painel/movimentacoes | Histórico paginado de entradas, entregas, recebimentos e estornos; gerente pode estornar mediante confirmação explícita. |

Navegação e início atualizados com links reais. Pedidos são simultâneos e independentes no acompanhamento; todos usam estoque e cadastros compartilhados da empresa. O formulário de entrega permite vários materiais numa única chamada atômica. Recebimento usa o modelo do pedido, sem modelo fornecido pelo cliente. Estorno integral preserva o original e não permite novo estorno do mesmo evento; eventuais correções parciais são feitas por estorno integral seguido do lançamento correto.

Listas paginadas em 25 registros. Opções de catálogos e linhas do histórico carregadas em lotes, evitando truncamento silencioso pelo limite padrão da API. Em grandes volumes, seletores devem evoluir para busca no servidor; não foi realizado teste de carga. Quantidades e referências de movimentos aparecem no histórico, com datas PT-BR/America/Sao_Paulo, vínculo ao pedido, facção e referência do original estornado.

## Gravação e permissões

Server Action submitTransaction valida sessão/vínculo, lista fechada de tarefas/tipos, perfil, UUIDs, nome e quantidades antes de chamar RPC. Gerente cria pedido/entrada/estorno e registra entregas/recebimentos; motorista registra somente entrega/recebimento; gestor consulta. Ocultação visual não é autorização: o servidor verifica novamente e o banco mantém suas regras. Empresa/autor não são recebidos do formulário. Nenhuma escrita direta no histórico.

Formulários têm rótulos, estados pendentes, mensagens de erro/sucesso e avisos visíveis. Material exige quantidade decimal positiva; bolsas/previsão exigem inteiros positivos. Aceitam vírgula ou ponto decimal, sem separador de milhares, expoentes, NaN ou infinito. Material repetido é rejeitado antes da RPC; banco mantém integridade e atomicidade.

## Precisão e idempotência

Quantidades seguem como strings decimais até a RPC. Consultas de campos numeric usam cast ::text no SELECT PostgREST, evitando arredondamento no JSON/JavaScript. Formatação pt-BR opera sobre strings, sem Number/parseFloat. Referência: https://docs.postgrest.org/en/stable/references/api/tables_views.html#casting-columns.

Cada formulário recebe uma chave UUID para a intenção atual. O envio guarda o FormData original em memória. Se a resposta não confirmar o resultado (falha de transporte ou erro não reconhecido), campos ficam bloqueados e a repetição usa exatamente o FormData/chave originais. Erros definitivos conhecidos do banco permitem corrigir dados sem assumir sucesso. A RPC já compara payload e chave, impedindo duplicação.

Após sucesso, a tela mostra referência e avisos; outro pedido/lançamento exige botão explícito que gera nova chave e limpa o formulário. Estorno bem-sucedido não oferece novo estorno; histórico é revalidado. Saldo negativo e excedente não bloqueiam gravação e aparecem imediatamente no resultado e como aviso histórico do momento do lançamento.

Limitação explícita: snapshot fica apenas na memória do componente, não sobrevive a recarregamento, fechamento ou navegação. Se sair após resultado incerto, conferir histórico antes de novo lançamento. Não alegamos retomada persistente/offline. Login expirado durante envio redireciona conforme fluxo existente; não afirmar reenvio automático após novo login.

## Arquivos

- src/lib/operations/validation.ts: parsing, permissões por tipo, decimais e formatação.
- src/lib/operations/types.ts e data.ts: contratos, consultas e mensagens de aviso.
- src/app/painel/operacoes/actions.ts: Server Action para as duas RPCs.
- src/app/painel/operacoes/transaction-form.tsx: formulário controlado, itens, confirmação, chave e retry.
- src/app/painel/operacoes/history.tsx e pagination.tsx: histórico e navegação.
- src/app/painel/pedidos/page.tsx e [id]/page.tsx: pedidos e detalhe.
- src/app/painel/estoque/[type]/page.tsx e movimentacoes/page.tsx: estoque e histórico global.
- src/app/painel/layout.tsx e page.tsx: navegação/início.
- tests/operation-validation.test.mjs e http-access.mjs: validações e proteção HTTP.

## Testes e resultados reais

- node --test tests/*.test.mjs: 17 testes passaram (12 anteriores e 5 novos). Novos cenários: precisão acima de MAX_SAFE_INTEGER, vírgula, zero/negativos/expoentes, formatos inválidos, bolsas fracionadas, massa de dados de empresa/autor ignorada, campos de modelo ignorados no recebimento, material duplicado, confirmação do estorno, tipos arbitrários e permissões.
- npm run lint: aprovado na execução final; um prefer-const encontrado na revisão foi corrigido.
- tsc --noEmit e npm run build: aprovados; build inclui checagem TypeScript.
- node tests/http-access.mjs após build: login 200 e dez rotas redirecionam para login sem sessão. Servidor temporário encerrado.
- Suíte supabase/tests/pedidos_movimentacoes.sql reexecutada no BagSync com BEGIN/ROLLBACK: passou, incluindo transações, RLS, idempotência, saldos, parciais, excedentes, estornos e perfis. Dados de teste revertidos.
- Conferência final: uma empresa, um vínculo, perfil gerente_logistico preservado, zero pedidos e operações persistidos.
- git diff --check: aprovado.

Não executados: fluxo autenticado de ponta a ponta das novas telas, teste visual desktop/celular, repetição por desconexão real no navegador, concorrência simultânea ou carga. Autenticação aprovada anteriormente pelo responsável não substitui esses testes. Não foram coletadas senhas nem criada sessão de teste privilegiada. Os alertas de Auth/SECURITY DEFINER registrados em pedidos-estoque.md permanecem; nenhuma alteração neles neste incremento.

## Próximos passos e checkpoint

Conferir com dados reais: cadastrar unidade/material/modelo/facção; criar pedido; registrar entrada e entrega; receber parcialmente; conferir saldo/progresso e avisos; testar estorno. Não cadastrar dados fictícios persistentes para teste. Interfaces de composição de bolsas e exportação de romaneios/extratos continuam pendentes. Não há encerramento/cancelamento de pedido, saída para clientes ou baixa automática pela composição.

Momento de versionar após revisar o resultado e a limitação de validação autenticada/visual acima. Nenhum commit ou push executado pelo agente.

```powershell
git status --short
git diff --check
git diff
git ls-files --others --exclude-standard
# Ler também os arquivos novos.
git add src/app/painel/ src/lib/operations/ tests/http-access.mjs tests/operation-validation.test.mjs docs/telas-operacoes.md docs/desenvolvimento.md docs/arquitetura.md README.md AGENTS.md
git diff --cached
git commit -m "feat: integrar pedidos e movimentacoes de estoque na interface"
git push origin main
```
