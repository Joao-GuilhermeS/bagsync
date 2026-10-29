# Expedição compacta e revisão de kits

## Objetivo e critérios de aceite

Listar remessas em tabela compacta com busca, filtros contados e 12 registros por página; conferir materiais por quantidade direta e botão OK; sinalizar e corrigir alertas manuais sem ocultar faltas reais ou baixar estoque duas vezes. Padronizar a lista técnica do modelo e preservar os tipos checkbox/texto, unidades predefinidas, snapshots, permissões e histórico.

## Interface

- `/painel/expedicao`: colunas modelo/facção, status de logística e kit, quantidade/data, progresso quantitativo e ações Checklist, Romaneio e Histórico. PDF somente após emissão; ausência é informada, sem botão inoperante.
- Pills Todas, Pendentes, Em Trânsito, Kits Incompletos e Entregues. Contadores respeitam busca e escopo pedido/facção. Incompleto pode coexistir com entregue/em trânsito. Busca e status precedem paginação local de 12, sem truncar as consultas existentes por empresa.
- Checklist compartilhado em criação e complemento: linhas com material/unidade, previsto manual na criação, quantidade a enviar agora e OK. Sem botão separado de parcial. Digitar quantidade seleciona envio parcial; limpar/zero deixa pendente. OK de checkbox usa saldo calculado no servidor. Texto livre mantém quantidade independente; seu OK preenche a quantidade com o previsto/saldo, ainda validada no servidor.
- Complemento não edita lançamentos passados: envia novas quantidades; correções de movimentos existentes continuam por estorno. Previsões históricas não são reescritas.
- Cadastro técnico do modelo usa tabela compacta com material/unidade, tipo, posição, ativo e edição em gaveta. `/painel/modelos` redireciona ao cadastro existente preservando parâmetros; `/painel/modelos/[id]/checklist` é alias autenticado do checklist. Rotas anteriores permanecem.

## Alerta manual — regra confirmada

O responsável confirmou que o alerta manual pode existir mesmo com todas as quantidades enviadas. Kit Completo exige simultaneamente itens existentes, nenhuma falta quantitativa e nenhum alerta manual ativo. Marcar como Corrigido remove o alerta, mas não elimina faltas, não confirma entrega e não movimenta estoque por si só.

Gerente Logístico marca/desmarca no formulário. Uma remessa com falta quantitativa já aparece em Kits Incompletos sem depender do toggle. Progresso mede itens atendidos quantitativamente: pode mostrar 100% e ainda exigir revisão manual, identificada na linha.

## Banco e segurança

Migration nova `20261029194628_shipment_kit_manual_review.sql`:

- `shipment_kit_review_events`: eventos imutáveis com empresa, remessa, chave única por empresa, flag, observações, autor, data e sequência de ordenação. FK composta garante empresa/remessa coerentes. RLS permite leitura somente na empresa da sessão; sem escrita direta dos perfis.
- `set_shipment_kit_review`: somente Gerente Logístico, empresa/autor da sessão, bloqueio transacional existente da empresa e replay validando o mesmo payload. Nenhum movimento de estoque.
- `submit_shipment_checklist_review`: wrapper transacional de conferência/baixa e evento de revisão. Falha no evento reverte a conferência; replay não duplica movimento nem evento. APIs anteriores preservadas, sem sobrescrever o alerta manual.
- `shipment_kit_status`: mantém mesmas colunas e SECURITY INVOKER; estado quantitativo combinado com último alerta. Eventos antigos não são inventados. Dashboard e consultas que já usam a view passam a enxergar o alerta.
- Histórico da remessa apresenta últimas 25 revisões, com total explícito, notas e datas. Autor permanece auditável no banco.

Nova remessa continua usando duas transações distintas (criação e emissão). Salvar previsão e sua marcação também são chamadas distintas: a previsão pode persistir se a marcação falhar. Repetir usa as chaves e corpo originais; retenção apenas em memória, sem promessa offline.

## Implantação

A migration precisa estar aplicada antes de usar os novos formulários/RPCs. Não reexecutar ou alterar migrations anteriores. Aplicação remota depende de autorização específica; estado e resultados finais são registrados no checkpoint. Sem dependências novas, credenciais alteradas ou acesso ao projeto antigo.

## Validação e aplicação — 29/10/2026

- `npm run lint`, TypeScript e build Webpack final aprovados (38 páginas). Uma checagem isolada de tipos executada junto do build encontrou arquivos temporários `.next/types` ausentes; repetida sequencialmente após o build, passou.
- `node --test tests/*.test.mjs`: 73 testes aprovados.
- `node tmp/deadline-db/run.mjs`: todas as migrations e dez suítes SQL locais aprovadas.
- Suíte `shipment_kit_manual_review.sql` aprovada também no BagSync remoto em BEGIN/ROLLBACK: permissões de gerente/motorista/gestor/anônimo, isolamento entre empresas, replay, payload divergente, atomicidade e nenhuma baixa ao apenas corrigir o alerta.
- Migration aplicada com autorização explícita no projeto ppgeveafuhgoymtvvrya. Nome local alinhado à versão registrada pelo Supabase: 20261029194628_shipment_kit_manual_review.sql (arquivo proposto originalmente com horário 192344). Nenhuma migration anterior foi reescrita.
- Verificação posterior: RLS ativa, view SECURITY INVOKER, nenhum evento/material/empresa de teste restante e perfil gerente preservado.
- `node tests/http-access.mjs`: login 200, 35 rotas protegidas, quatro arquivos e histórico negados sem sessão.
- Playwright/Edge em prévia isolada: filtros e busca, vazio, parcial direto, OK, zero pendente, alerta/corrigido, edição do tipo em gaveta, Escape, etapas de criação e ausência de overflow horizontal em 375×812. Desktop inspecionado em 1366×768. Preview usa snapshots existentes e não grava; a marcação manual ativa foi simulada apenas como estado de UI para testar o botão Corrigido.
- Inspeção visual encontrou herança indevida de alinhamento à direita na gaveta da tabela; corrigida explicitamente para esquerda no FormDrawer compartilhado.
- `git diff --check` sem erros. Sem dependências novas, commit, push ou publicação de frontend.

Limites: não foi feita emissão ou marcação manual persistente pela interface autenticada. O PDF usa a emissão existente e os testes de PDF da suíte Node; não foi gerado romaneio de negócio novo. A tabela comporta 12 registros por página; quantidade visível sem rolar depende da altura da tela e conteúdo, sem altura forçada ou corte de dados.

Verificação final adicional: OK sem saldo fica desabilitado; com saldo positivo é habilitado. Gaveta alinhada à esquerda e Escape validados no navegador. Consulta autenticada remota retornou cinco kits visíveis da RL Bolsas e zero de outras empresas.
