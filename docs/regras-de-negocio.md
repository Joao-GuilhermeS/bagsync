# Regras confirmadas — 25/10/2026

Origem/aprovação: responsável pelo projeto, respostas no chat; aceite pelo desenvolvedor.

- RN-01: empresas independentes sem filiais; usuário vinculado a uma única empresa.
- RN-02: gerente logístico gerencia operações; motorista consulta e registra entregas/recebimentos em facções; gestor apenas consulta.
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
