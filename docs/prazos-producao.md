# Gestão de prazos de fabricação e recolhimento

## Requisitos aprovados em 29/10/2026

- Prazo obrigatório nas novas remessas; registros antigos sem data permanecem “Sem prazo”.
- Dias corridos, incluindo finais de semana, em horário de Brasília.
- Somente Gerente Logístico define/prorroga; prorrogação exige justificativa e histórico.
- Novos recolhimentos escolhem a remessa do pedido/facção. Parciais abatem somente essa remessa; estornos reabrem sua pendência. Excedentes continuam permitidos com aviso.
- Página `/painel/prazos` com resumo, busca por facção/modelo, filtros e ordenação por urgência.

## Expedição e acompanhamento

O checklist mantém seus previstos manuais e seus tipos de resposta. Na etapa de conferência, preencher data personalizada ou atalhos de 5, 7, 10 e 15 dias. Atalhos usam a data de criação em Brasília; não são dias úteis nem um contador reiniciado na entrega física. Data passada é negada para uma nova criação. Previsões salvas também recebem prazo, mas só entram em produção após a primeira saída válida de material.

Complementos não repetem a quantidade de bolsas nem alteram automaticamente o prazo. A página mostra a primeira saída válida, a quantidade prevista da remessa, os recolhimentos vinculados e o saldo. Remessas com saldo maior que zero aparecem enquanto existir saída válida; quando o saldo chega a zero, deixam a lista de pendentes. Estorno de recolhimento restaura pendência. Se todos os envios forem estornados, a remessa deixa a lista de produção.

Classificação por data civil, sem antecipar o atraso pela hora:

| Situação | Regra |
| --- | --- |
| No Prazo | faltam mais de dois dias |
| A Vencer | vence hoje, amanhã ou em dois dias |
| Atrasado | data limite anterior a hoje; contador de dias |
| Sem prazo | legado sem data, sem atraso presumido |

Os quatro cards contam remessas, não bolsas. “Em Produção” inclui legados sem prazo; os outros três não. Busca atualiza os cards e a lista; filtro de status seleciona a lista. Datas mais antigas vencidas aparecem primeiro, datas nulas por último. Consulta é atualizada ao navegar/recarregar: não foi adicionado push, cron ou notificação externa.

## Recolhimento e legado

“Ir para Recolhimento” abre o modelo/facção com pedido, remessa e ação de recolher selecionados. O seletor mostra remessas com saída válida, incluindo as já atendidas para permitir excedente com aviso. Não há entrada duplicada: vínculo e operação são gravados na mesma transação, sob lock da empresa e chave de idempotência.

Os recolhimentos anteriores continuam nos totais do pedido/facção e estoque de bolsas. Não foram rateados entre remessas nem atribuídos à mais antiga por inferência. A tela informa essa limitação: o saldo individual usa somente recolhimentos explicitamente vinculados. Definir prazo em um legado exige justificativa, sem reconstruir datas anteriores.

## Modelo relacional e segurança

- `shipment_kits.due_on`: date atual, nula apenas em legado. Modelo, pedido, facção, quantidade e criação continuam nas referências existentes.
- `shipment_deadline_events`: evento inicial e prorrogações com data anterior/nova, motivo, autor, instante e chave única por empresa. Leitura por RLS; cliente sem INSERT/UPDATE/DELETE.
- `shipment_receipts`: vínculo único de operação de recolhimento à remessa; FKs compostas com empresa. Operação e movimentos originais permanecem imutáveis para o cliente.
- `shipment_receipt_progress`: view SECURITY INVOKER, saldo da remessa calculado com estornos.
- `production_deadlines`: view SECURITY INVOKER, remessas com saída válida e saldo pendente, contatos e classificação temporal.
- `create_shipment_kit`: novo parâmetro `p_due_on`, obrigatório para criação; repetição confere a data inicial, mesmo após prorrogação. Repetição antiga sem data só consulta a criação antiga correspondente.
- `register_inventory_operation`: novo parâmetro `p_kit_id`, obrigatório para novo bag_receipt. Confere empresa, pedido, facção e saída válida. Operações antigas repetidas sem vínculo só reproduzem o resultado antigo, sem criar recolhimento.
- `extend_shipment_deadline`: Gerente, motivo, data maior que atual e não passada, expectativa da data anterior para impedir sobrescrita concorrente e replay da mesma chave.

Corpos anteriores de criação/movimentação foram preservados no schema privado com sufixo `_v1` e execução pública revogada. Wrappers públicos validam os novos contratos. Entrada de material, emissão, confirmação de entrega e estorno continuam usando as operações existentes. Chaves e payload são preservados em memória na repetição incerta; isso não oferece funcionamento offline nem persistência após recarga.

## Migration e implantação

`supabase/migrations/20261029140127_production_deadlines.sql`, aplicada com autorização explícita apenas no BagSync (`ppgeveafuhgoymtvvrya`). Nome local alinhado ao timestamp registrado pelo Supabase; inicialmente preparada pelo CLI como 20261029134017. Conteúdo preservado após aplicação. Projeto antigo não alterado. Não reexecutar migrations aplicadas.

Entrega de frontend/backend deve acompanhar o banco: chamadas antigas para criar remessa sem prazo ou novo recolhimento sem remessa passam a ser rejeitadas. Consumidores externos precisam enviar os novos parâmetros. Nenhuma dependência de execução do aplicativo foi adicionada.

## Código

Componentes em `components/deadlines/`: DeadlineField, DeadlineList e ExtensionForm. Página/action em `app/painel/prazos/`. Datas e parsing em `lib/deadlines/`. Expedição reutiliza o novo campo; entregador reutiliza TransactionForm com escolha de remessa e FieldActionPanels abrindo Recolhimento pelos parâmetros.

## Verificação

69 testes Node aprovados, lint e build Webpack/TypeScript aprovados (35 páginas). HTTP aprovado: login 200, 32 rotas protegidas, quatro arquivos e histórico negados sem sessão. `git diff --check` sem erros, somente avisos LF/CRLF. As 13 migrations e nove suítes SQL foram executadas em PostgreSQL local via PGlite; as nove suítes também passaram no Supabase com BEGIN/ROLLBACK, sem fixtures persistentes. Cenários cobrem parciais, remessas simultâneas, fechamento/reabertura por estorno, excesso com aviso, replay divergente, prorrogação concorrente, campos obrigatórios, papéis, leitura anônima e isolamento.

Conferência final remota: quatro remessas e onze operações preservadas, zero eventos/vínculos de teste, datas antigas nulas e perfil original Gerente Logístico. Prévia isolada com três remessas reais em produção: desktop 1440 px e mobile 375 px sem overflow horizontal. Capturas em `output/playwright/prazos-*.png`, ignoradas pelo Git. Controles de gravação da prévia são inertes; não equivale a aceite ponta a ponta autenticado.

Na prévia, o atalho de sete dias a partir de 29/10 selecionou 05/11/2026; campo de data obrigatório. Diálogo de definição/prorrogação abriu com data e justificativa obrigatórias; Escape fechou sem gravar. Filtro Atrasados mostrou o estado vazio correto para os três legados sem data. Uma nova prorrogação após sucesso é uma nova intenção com chave nova, sem reutilizar o envio anterior.

Docker local não iniciou; teste alternativo reproduzível, sem conexão de produção:

```powershell
npm install --prefix tmp/deadline-db --no-audit --no-fund --save-exact @electric-sql/pglite@0.5.13
node tests/sql-local.mjs
node --test tests/*.test.mjs
npm run lint
npx next build --webpack
node tests/http-access.mjs
git diff --check
```

PGlite é somente ferramenta local em diretório ignorado; bootstrap Auth mínimo, não substitui o serviço Supabase Auth nem teste concorrente com conexões reais. Os testes remotos validam as RPCs no destino real. Aceite ponta a ponta com sessão real e publicação do frontend devem ser distinguidos dos testes técnicos; nenhum commit/push/publicação executado pelo agente.
