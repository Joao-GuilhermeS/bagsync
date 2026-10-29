# Regras confirmadas — 25/10/2026

## Atualização — Expedição e entregas (27/10/2026)

Gerente emite a saída na Expedição; motorista confirma a entrega e continua recolhendo bolsas. Unidades são somente leitura. Documento/telefone/endereço novos são opcionais. Contrato vigente em [Expedição e entregas](expedicao-entregas.md), que substitui descrições históricas divergentes abaixo.

Origem/aprovação: responsável pelo projeto, respostas no chat; aceite pelo desenvolvedor.

- RN-01: empresas independentes sem filiais; usuário vinculado a uma única empresa.
- RN-02: gerente logístico gerencia operações; motorista consulta e registra entregas/recebimentos em facções; gestor consulta, com as exceções específicas de atribuição de rotas (RN-16) e observações da produção (RN-23), sem CRUD geral.
- RN-03: materiais de produção e bolsas acabadas/entregues têm consultas em páginas separadas.
- RN-04: registrar materiais enviados por costureira/facção e bolsas recolhidas, conciliando com estoque.
- RN-05: provisionamento de usuários pelo desenvolvedor no Supabase inicialmente. CRUD operacional não concede administração de identidades/perfis.
- RN-06: disponibilizar exportação de romaneio e/ou extratos; formato/conteúdo ainda a definir.

Campos, quantidades, estados, exclusões e correções dos movimentos aguardam detalhamento. Não há conversão automática aprovada de material em bolsas. Mudanças nas regras confirmadas exigem autorização.

## Complemento confirmado pelo responsável — 25/10/2026

- RN-07: materiais podem usar unidades diversas, incluindo metro, unidade e kg. Precisão e conversões ainda não definidas; não somar unidades distintas.
- RN-08: saldo negativo permitido, com aviso obrigatório ao usuário; não bloquear exclusivamente por saldo negativo.
- RN-09: cada recebimento de bolsas é vinculado a um pedido específico e abate sua quantidade; recebimentos parciais são permitidos.
- RN-10: Supabase dedicado com nome BagSync; proibido alterar Management-System-Project.

Ainda não definido: pedido com vários modelos de bolsa, recebimento acima do previsto, correções/cancelamentos e fracionamento das unidades. Não impor bloqueio ou encerrar automaticamente pedidos nessas situações sem confirmar a regra.

## Catálogos — incremento autorizado

Facções, materiais e modelos de bolsas com cadastro mínimo por nome; material exige unidade de medida da mesma empresa. Composição opcional liga modelo a material da mesma empresa com quantidade positiva por bolsa, sem consumo automático. Apenas gerente escreve nos catálogos; demais perfis consultam. Isso implementa o escopo de banco solicitado; campos adicionais e movimentos serão detalhados no próximo incremento. Dicionário e decisões técnicas em catalogos-producao.md.

## Pedidos e correções — confirmação do responsável em 25/10/2026

- RN-11: um modelo de bolsa por pedido, com várias facções.
- RN-12: recebimento acima da previsão permitido com aviso.
- RN-13: corrigir entregas/recebimentos por estorno e novo lançamento, preservando original.

Banco implementado conforme [contrato de pedidos/estoque](pedidos-estoque.md). Não há baixa por composição nem encerramento automático. Papéis e avisos conforme contrato. As pendências anteriores sobre modelos, excesso e correção estão resolvidas; cancelamento/edição da previsão e distribuição prévia por facção ainda não foram implementados.

## Alterações autorizadas — 26/10/2026

- RN-14: facções/costureiros não acessam a aplicação; envios e recebimentos são registrados pelos usuários da empresa.
- RN-15: lote significa recebimento parcial; não haverá entidade de lote independente.
- RN-16: Gerente Logístico e Gestor podem atribuir rotas; Gestor continua sem escrita de estoque/cadastros/saídas. Observações de produção seguem a exceção RN-23. Permissão de rotas ainda não implementada.
- RN-17: checklist predefinido por modelo; previstos informados manualmente por remessa, sem multiplicação automática pela composição.
- RN-18: confirmação OK para envio completo, valor numérico para parcial, pendências explícitas e PDF físico do checklist. Traço significa material não enviado e pendente, mantendo o kit incompleto (confirmado pelo responsável em 26/10/2026).

- RN-19 (26/10/2026): cada item do checklist do modelo possui tipo escolhido pelo usuário: caixa de conferência ou texto livre. A escolha é preservada na remessa; texto não deve ser interpretado como quantidade.
- RN-20: marcação confirma e baixa a quantidade prevista manualmente para aquela remessa; quantidade parcial pode ser informada mesmo em item de conferência. Item de texto livre possui campo numérico separado para o envio/estoque.
- RN-21: emissão da saída seleciona uma facção/costureiro cadastrado e inclui anotações gerais. PDF imprimível após conclusão com nome do destinatário e quantidade à esquerda, data e modelo à direita. O campo denominado município na referência física corresponde ao nome do modelo, conforme correção explícita do responsável. A impressão utiliza o diálogo do navegador/leitor PDF, sem prometer seleção automática de impressora.

- RN-22 (corrigida pelo responsável em 26/10/2026): município é o nome do modelo; padronizar por modelo sem cadastro/filtro independente de município atendido. Exibir todos os modelos em cards, depois facções cadastradas e entrega/recebimento. Quantidade distribuída usa a quantidade de bolsas da saída/remessa; recolhimentos aparecem somados, com histórico expansível de quantidades e datas. Preservar o pedido específico em cada lançamento.
- RN-23: Gerente Logístico, Motorista e Gestor podem acrescentar observações no acompanhamento da produção. Exceção específica ao perfil Gestor, sem autorização geral de escrita. Implementada com histórico imutável e idempotência, sem edição/exclusão pela aplicação.
- RN-24 (confirmada em 26/10/2026): quantidade da remessa conta como produção distribuída na primeira saída de material para a facção, uma única vez. Complementos não duplicam o total. Remessas sem envio válido não contam; estornos preservam os originais e ajustam os totais. Recolhimentos e saldos permanecem separados por pedido/facção.

Estas regras complementam/substituem os trechos históricos correspondentes; não implicam que kits, rotas ou novo PDF já estejam implementados. Referência: adaptacao-kits-rotas.md.

## Prazos — adendo aprovado em 29/10/2026

Novas remessas exigem prazo em dias corridos/Brasília. Gerente Logístico define e prorroga com justificativa e histórico. Atenção: vencimento hoje ou nos próximos dois dias; atraso: data anterior a hoje. Recolhimentos novos escolhem remessa, com parciais, estornos e aviso de excedente. Não atribuir data ou ratear recolhimentos antigos automaticamente. Contrato e exceções em [Prazos de produção](prazos-producao.md).
