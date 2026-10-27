# Acompanhamento consolidado da produção

## Entrega — 26/10/2026

Objetivo: consultar, por modelo/pedido/facção, as bolsas distribuídas, recolhidas e pendentes, datas e histórico expansível, com observações pelos três perfis.

Entrada **Produção** na navegação principal, ou **Acompanhar produção deste modelo** na tela do entregador. `/painel/producao` exibe todos os modelos cadastrados em cards, inclusive sem produção. Município permanece o nome do modelo; não foi criado cadastro ou filtro independente de município.

`/painel/producao/[bag]` apresenta tabela com filtros por pedido, facção e bolsas pendentes. No celular, os registros usam disposição em blocos com rótulos; no desktop, tabela. Paginação de 25 combinações por página, preservando os filtros. Sem total geral calculado apenas sobre a página atual.

## Quantidades e datas

Regra confirmada pelo responsável nesta etapa: a quantidade de bolsas da remessa entra como distribuída na **primeira saída de material para a facção**. Preparar a remessa ou preencher checklist sem envio não distribui bolsas.

- Uma remessa é contada uma única vez, mesmo que receba vários complementos de materiais.
- Cada pedido/facção tem uma linha própria; dois pedidos do mesmo modelo não misturam os saldos.
- Distribuição considera remessa com pelo menos uma entrega vinculada e não estornada. Se restar outro envio válido após um estorno, a remessa continua contada; se todos forem estornados, fica fora do total.
- Recolhidos são as quantidades de bolsas dos recebimentos não estornados. Originais estornados permanecem no histórico, identificados e fora do total.
- Pendente = máximo(distribuído − recolhido, 0); excedente = máximo(recolhido − distribuído, 0). Excedente aparece com aviso, sem bloquear ou esconder recebimentos.
- Remessas preparadas/sem envio válido são indicadas separadamente. Recolhimento sem distribuição vinculada também aparece, com aviso: não atribuir quantidade inventada a uma entrega genérica sem kit.
- Datas da tabela são as últimas distribuições e os últimos recolhimentos válidos. O histórico apresenta todas as datas; a distribuição de cada remessa usa a primeira saída válida e informa o último complemento separadamente.
- Datas representam registros no sistema, em Brasília. Não foi implementada data operacional retroativa ou encerramento automático do pedido.

As agregações de remessas, recebimentos e observações são feitas separadamente antes da junção. Isso evita multiplicar quantidades quando há várias saídas, recolhimentos ou notas. Quantidades numéricas são devolvidas em texto pelo banco e formatadas sem Number/parseFloat.

## Histórico expansível

Cada linha oferece **Histórico e observações**, com abas:

- **Distribuições:** remessas, quantidade de bolsas, preparação, primeira saída válida, último complemento e acesso aos materiais.
- **Recolhimentos:** quantidade e data de cada recebimento parcial, observação, indicação de estorno e romaneio PDF existente.
- **Observações:** textos, datas e perfil do autor no momento da gravação, com formulário para acrescentar novo registro.

Conteúdo carregado ao expandir/trocar a aba, por `/painel/producao/historico`. Cada consulta pagina 25 registros e usa snapshot único da função SQL de leitura. Não carrega antecipadamente todos os históricos. Requisições anteriores são canceladas para impedir que respostas atrasadas troquem os dados da aba atual.

Histórico e tabela consultam os registros atuais; não foi implementado push/realtime em segundo plano. Após registrar uma nota, o histórico é consultado novamente e o painel é revalidado. Para acompanhar mudanças de outros usuários, reabrir o histórico, filtrar ou atualizar a página.

## Observações e permissões

Gerente Logístico, Motorista e Gestor podem **acrescentar** observações na produção da própria empresa. Não existe edição ou exclusão de notas pela aplicação; correções são novos registros, preservando o histórico.

Permissão específica `registrar_observacao_producao`. Não concede ao Gestor escrita de estoque, pedidos, cadastros ou saídas. Empresa, autor e perfil vêm da sessão/vínculo real; campos forjados no formulário não são usados.

Chave idempotente por empresa; repetição da mesma nota/contexto retorna o registro original, corpo divergente é rejeitado. Formulário congela chave e payload em resultado incerto e orienta consultar o histórico antes de recarregar. Não há funcionamento offline.

## Banco e segurança

Migração aditiva `20261026194930_production_tracking_notes.sql`, aplicada somente no BagSync. Arquivo gerado pela CLI como 20261026193914 e renomeado para alinhar à versão registrada remotamente. Nenhuma migração aplicada anteriormente foi alterada.

- `production_notes`: ID, empresa, pedido, facção, chave, texto, autor, perfil no momento do registro e data; FKs compostas restringem pedido/facção à mesma empresa. Índices para contexto/facção/autor. RLS habilitado, SELECT apenas da própria empresa, sem escrita direta para clientes.
- `add_production_note`: RPC de escrita com autorização pelos três perfis, bloqueio transacional da empresa, idempotência, search_path vazio e EXECUTE somente para autenticados. SECURITY DEFINER para preservar histórico sem abrir escrita direta.
- `production_kit_distribution`: view SECURITY INVOKER, uma linha por remessa, com datas/contagem dos envios válidos.
- `production_tracking`: view SECURITY INVOKER, uma linha por pedido/facção com totais calculados e dados de consulta.
- `production_tracking_history`: função STABLE/SECURITY INVOKER; tipos de consulta permitidos, contexto validado por RLS, ordenação estável e paginação limitada. Não escreve nem eleva privilégios.
- Endpoint exige usuário e vínculo, valida filtros/tipos/IDs/página e rejeita parâmetros repetidos ou arbitrários. Contexto alheio/inexistente retorna 404; sem sessão, 401. Respostas privadas/no-store, Vary Cookie e nosniff.

## Validação real

- Migração + `supabase/tests/production_tracking.sql` executados juntos em BEGIN/ROLLBACK antes da aplicação. Após aplicação permanente, suíte repetida com rollback das fixtures.
- SQL: preparação sem distribuição; primeira saída; complemento sem dupla contagem; dois kits × dois recolhimentos; pedidos simultâneos; estornos parciais/totais de envios e recebimentos; excedente; histórico original; 28 observações em duas páginas; repetição idempotente; nota vazia/contexto alheio; RLS e isolamento; Motorista/Gestor escrevendo notas sem liberar estoque; escrita direta/anônimo/identidade ausente bloqueados.
- `node --test tests/*.test.mjs`: **42 aprovados**. Novos testes de permissão específica, campos forjados, texto, contexto e paginação/filtros inválidos.
- `npm run lint` e `npm run build`: aprovados; duas novas páginas e endpoint de histórico compilados.
- `node tests/http-access.mjs`: login 200, **23 páginas exigindo sessão**, três arquivos e histórico negados sem sessão. Execução fora do sandbox devido a bloqueio de loopback.
- RLS e security_invoker verificados no esquema real. Após rollback: uma empresa, um vínculo, zero notas, remessas e operações, sem dados fictícios persistentes.
- `git diff --check`: sem erros; avisos de normalização LF/CRLF do Git. Sem dependências instaladas, commit ou push.

Advisors: nenhuma FK sem índice ou RLS ausente reportada. Permanecem [seis avisos de RPCs SECURITY DEFINER autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), autorizadas internamente e testadas, [proteção contra senhas vazadas desativada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) já existente e informações de índices ainda não utilizados. Auth não foi alterado.

## Arquivos e pendências

Criados `src/app/painel/producao/**`, `src/lib/production/tracking-{types,validation}.ts`, migração, teste SQL e `tests/production-tracking.test.mjs`. Ajustados navegação, acesso pelo entregador, permissão específica e teste HTTP; documentação atualizada.

Falta validar com sessão real a navegação móvel, expansão, filtros e inclusão de observações pelos perfis. Não houve teste visual/autenticado de navegador, concorrência em duas sessões, carga ou medição de latência. Próxima frente funcional: dados de contato/endereço das facções e rotas, conforme requisitos confirmados e esclarecimentos necessários.
