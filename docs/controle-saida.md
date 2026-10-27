# Controle de saída por checklist

## Entrega — 26/10/2026

Objetivo: concluir o envio de materiais da remessa com respostas de conferência ou texto livre, quantidades efetivas separadas, anotações e PDF imprimível. Implementado como incremento das remessas e da tela do entregador, sem cadastrar município como entidade distinta do modelo.

O responsável autorizou continuar após a recomendação de aplicar a migração de tipos e concluir este fluxo. Aplicadas somente no projeto BagSync `ppgeveafuhgoymtvvrya`:

- `20261026191246_checklist_response_types.sql`: tipo checkbox/text no modelo e no snapshot da remessa. Arquivo anteriormente preparado com versão local 20261026181154 foi renomeado para corresponder ao histórico remoto; conteúdo preservado.
- `20261026191312_shipment_checklist_submissions.sql`: preenchimentos, respostas e RPC transacional. Arquivo local inicialmente gerado pela CLI com versão 20261026191022 foi alinhado ao registro remoto.

Não houve alteração de migrações anteriormente aplicadas, credenciais, usuário real ou projeto antigo.

## Uso

1. Gerente configura o checklist do modelo e prepara a remessa com a facção cadastrada, quantidade de bolsas, previsões manuais e anotações.
2. Em **Entregador → Modelo → Facção**, identifica o pedido (quando houver vários) e escolhe uma remessa preparada para **Preencher saída / complemento**. Quando o gerente prepara uma nova remessa por essa tela, pedido e facção são preservados no formulário.
3. Caixa de marcação: ✓ confirma o saldo restante; **Informar envio parcial** permite quantidade manual. Texto livre: resposta escrita e seleção separada entre não enviado ou quantidade efetiva.
4. Registra anotações desta saída e conclui. O sistema mostra resultado, avisos de estoque e botão **Abrir PDF / imprimir**.
5. O PDF abre no visualizador do navegador. O usuário escolhe Imprimir para selecionar a impressora. Não há impressão silenciosa nem seleção automática de dispositivo.

Alternativamente, abrir a remessa e selecionar **Preencher controle de saída**. O histórico mostra cinco preenchimentos recentes e oferece consulta paginada de todos os registros e seus PDFs.

Na tela do entregador, recebimento de bolsas prontas continua pelo formulário transacional existente. O envio de materiais passa a orientar o uso de remessas/checklists. A operação genérica de entrega permanece disponível em telas antigas, sem vincular retroativamente seus lançamentos a kits.

## Regras e integridade

- Respostas pertencem ao snapshot da remessa; mudanças no template não reescrevem o histórico.
- Quantidades são adicionais desta saída, preservadas como strings decimais no cliente/servidor. Texto livre nunca é interpretado como quantidade.
- ✓ calcula o saldo no servidor sob bloqueio transacional da empresa. Quantidade manipulada no navegador não altera esse cálculo.
- Não enviado registra quantidade zero, preserva a resposta escrita e não cria baixa. Um preenchimento só com pendências é salvo e gera PDF, sem operação de estoque.
- Cada preenchimento responde todos os itens uma única vez. Kit alheio, itens repetidos, modos inválidos e quantidades não finitas são rejeitados.
- Quando há envio, a RPC reaproveita `record_kit_delivery` e `register_inventory_operation`; movimento, vínculo da remessa e respostas são gravados na mesma transação. Materiais comuns a vários itens são agregados antes da baixa.
- Repetir chave e corpo retorna o resultado original, mesmo após o saldo mudar. Alterar o corpo com a mesma chave é rejeitado. Formulário congela payload/chave em resultado incerto; não sobrevive ao reload nem promete funcionamento offline.
- Estorno mantém original e respostas, registra movimento oposto e reabre pendências. PDF de envio estornado é identificado como tal.
- Quantidade efetiva não é truncada ao previsto. Saldo negativo continua permitido com aviso; excedente de materiais permanece consultável no progresso do kit.
- Quantidade de bolsas da remessa não vira recebimento de bolsas prontas nem é multiplicada pela composição. A criação da previsão não representa material entregue.
- Remessas legadas sem tipo de resposta não têm seus snapshots preenchidos por suposição. O novo formulário orienta preparar remessa com checklist configurado; a consulta do histórico é preservada.

## Modelo relacional e permissões

`kit_checklist_submissions`: ID, empresa, kit, chave idempotente, operação opcional, anotações, solicitação/resultado JSON, autor e data. Chaves únicas por empresa/chave e empresa/operação. FKs compostas restringem kit e operação à mesma empresa.

`kit_checklist_answers`: empresa, kit, preenchimento, item do kit, modo, resposta escrita e quantidade efetivamente enviada. PK empresa/preenchimento/item. FKs compostas preservam a correspondência entre kit, preenchimento e item. Quantidade finita e não negativa. Índices de apoio às FKs.

| Ação | Gerente Logístico | Motorista | Gestor |
| --- | --- | --- | --- |
| Consultar respostas e PDF da própria empresa | Sim | Sim | Sim |
| Preparar remessa/configurar modelo | Sim | Não | Não |
| Concluir saída/complemento | Sim | Sim | Não |
| Estornar envio | Sim | Não | Não |
| Alterar/excluir respostas diretamente | Não | Não | Não |

RLS habilitado nas duas tabelas; apenas SELECT para autenticados. Escrita exclusiva por `submit_shipment_checklist(request_key, kit_id, answers, note)`, com autorização derivada do vínculo real da sessão, sem empresa/autor recebidos do cliente. Função SECURITY DEFINER com search_path vazio e EXECUTE revogado de PUBLIC/anon. A permissão dos três perfis para observações independentes do acompanhamento, implementada posteriormente, não concede ao Gestor o registro de saídas.

## PDF

Cabeçalho com nome do destinatário e quantidade à esquerda, data e modelo à direita. Itens mostram rótulo do snapshot, tipo/resposta, previsto e enviado nesta saída, com anotações da saída e da remessa. Marca de conferência desenhada em vetor; textos usam fonte local Noto Sans. Rodapés numerados em A4.

O documento representa um preenchimento, não o saldo cumulativo atual. Quantidades e respostas são históricas; nomes da empresa, modelo, pedido e facção são consultados nos cadastros atuais. Não foi criada cópia histórica desses nomes.

Endpoint `/painel/remessas/[id]/preenchimentos/[submission]/pdf`: autenticação, vínculo e RLS; IDs validados, inexistente/alheio retorna 404. Respostas privadas/no-store, Vary Cookie, nosniff. PDF inline; máximo 5.000 itens e 20 MiB, com erro explícito, sem truncamento de itens. Não aceita caminhos de arquivos do cliente.

## Validação executada

- Migrações e `supabase/tests/shipment_checklist_submissions.sql` primeiro executados em transação revertida; depois aplicados e testes executados novamente com rollback das fixtures. Também repetida a suíte de remessas existente.
- Testes SQL cobrem texto independente de quantidade, pendências sem baixa, parcial/✓/complemento, resposta completa do kit, atomicidade, repetição segura, quantidade manipulada, NaN, estorno, motorista, bloqueio de gestor/anônimo/identidade ausente, isolamento multiempresa e escrita direta negada.
- Verificado RLS nas duas tabelas. Após rollback: uma empresa, um vínculo, zero remessas, preenchimentos e operações; nenhum dado fictício persistente ou usuário Auth de teste.
- `node --test tests/*.test.mjs`: 39 aprovados. Após ajuste visual do PDF, os dois testes de PDF foram repetidos e passaram.
- `npm run lint` e `npm run build`: aprovados após corrigir tipagem de valores iniciais do formulário.
- `node tests/http-access.mjs`: login 200, 21 páginas protegidas e três arquivos negados sem sessão. Executado fora do sandbox devido ao bloqueio conhecido de loopback.
- PDFs de QA em tmp/pdfs (ignorados): uma página e 11 páginas, extração com pypdf verificou textos, precisão e rodapés; renderizados com Poppler e inspecionados visualmente na versão final. Sem dados reais.
- `git diff --check`: sem erros. Sem novas dependências, commit ou push.

Advisors: nenhuma FK sem índice ou tabela exposta sem RLS detectada. Permanecem [cinco avisos de RPCs SECURITY DEFINER acessíveis a autenticados](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), usados intencionalmente com autorização interna, [proteção contra senhas vazadas desativada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) já existente e informações de índices ainda não utilizados. Nenhuma configuração de Auth foi alterada.

## Pendências

Validar com sessão real o fluxo no celular e a impressão na impressora do cliente; não foi realizado teste autenticado de navegador, concorrência com duas sessões, carga ou impressão física. Tabela consolidada e observações específicas pelos três perfis foram implementadas posteriormente em [acompanhamento](tela-acompanhamento.md). Rotas atribuídas continuam posteriores.
