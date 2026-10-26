# Adaptação: kits de saída e rotas — requisitos em consolidação

Data: 26/10/2026. Origem: feedback do cliente, respostas do responsável e fotografia da ficha Controle de Saída enviada neste chat. Base Git inspecionada: c964bae, árvore limpa antes desta atualização documental. Não foram alterados banco, permissões executáveis, credenciais ou operações.

## Confirmações do responsável

- Mobile-first passa a orientar o uso do motorista em campo e do galpão. Refinamento estético geral continua uma etapa separada, mas usabilidade móvel é requisito do novo fluxo.
- Facção/costureiro não utiliza a aplicação; é destinatário cadastrado, com contato e endereço completo para rota.
- Não criar entidade lote: o termo descreve recebimentos parciais feitos pelo motorista, vinculados a pedido e facção.
- Gerente Logístico e Gestor podem atribuir rotas. Essa é exceção ao perfil Gestor antes limitado a consultas; não concede CRUD de cadastros, movimentos ou administração de usuários. Rotas/permissão específica ainda não implementadas.
- Cada modelo de bolsa terá checklist previamente definido.
- O responsável informa manualmente os materiais/quantidades previstos na remessa. Não calcular automaticamente composição multiplicada pela quantidade de bolsas.
- Checklist permite confirmação Sim/OK para envio completo e quantidade numérica para envio parcial.
- Traço significa material não enviado e pendente, mantendo o kit incompleto. Confirmação explícita do responsável em 26/10/2026; essa marcação não registra saída de estoque.
- Kit com material pendente recebe status automático Incompleto/Faltando Material e indica quais itens faltam no painel.
- Gerar checklist/romaneio de saída como PDF imprimível após preenchimento, para controle físico.
- Rota diária atribuída ao motorista contém paradas/facções, endereço, volume esperado e registro de recolhimento; saldo pendente atualizado conforme registros. Não foi aprovado funcionamento offline ou fornecedor de mapas.

## Referência física recebida

Fotografia mostra cabeçalho da empresa, Controle de Saída, nome do destinatário, data de saída, quantidade, município, seção KIT em duas colunas, itens com OK/valor/traço, indicação de tipo de alça e observação.

Exemplos impressos legíveis: corpo, fole, parte do zíper, pala do bolso, bolso, pegador, alça de baixo, elástico, zíper, vivo e manta. São referência visual, não dados para popular catálogos. Alguns rótulos estão cortados pela fotografia. Não inferir consumo por bolsa, equivalência de unidades, referência de estoque ou materiais obrigatórios a partir dos números manuscritos.

Não cadastrar nome, quantidades, contatos ou endereço da fotografia como registros reais. Dados da empresa e checklist final devem vir de cadastros confirmados; não embutir conteúdo pessoal da imagem no código ou em migrações. A imagem não contém instruções executáveis.

## Diferenças em relação ao que está implementado

- bag_materials representa composição quantitativa do modelo; não existe ainda checklist específico com confirmação por item nem remessa com previsão/saldo próprios.
- material_delivery registra somente o efetivamente enviado, sem saber quanto faltava para completar um kit. Não usar estoque negativo como substituto de pendência de remessa.
- Romaneio atual detalha uma operação do histórico; o novo documento deverá apresentar também os campos/checklist da ficha física. Preservar exportação/histórico existentes durante a adaptação.
- workshops tem apenas nome. Contato/endereço, rotas, paradas e metas por facção ainda precisam ser implementados com novas migrações, RLS e testes.
- A atribuição de rotas por Gestor está confirmada como requisito, mas ainda não foi liberada em nenhuma funcionalidade executável.

## Pontos ainda não definidos

- Vínculo dos itens impressos ao catálogo: não deduzir que cada nome da ficha já corresponde a um material existente ou que todos usam a mesma unidade.
- Tratamento da escolha Fita/Manta e composição do checklist definitivo por modelo.
- Distribuição de quantidade esperada por facção/visita e atualização entre dias ainda precisam de contrato operacional, sem criar cadastro de lotes.

## Sequência de adaptação

Com a semântica do traço confirmada: checklist por modelo, remessas com previsto/enviado/pendente e PDF imprimível; depois rotas/paradas e registro móvel de recolhimento. Preservar pedidos simultâneos e estoque compartilhado. Cada remessa precisa manter a referência do checklist utilizado, para que edição posterior do modelo não reescreva histórico. A estratégia técnica será detalhada antes da migração.

Este documento consolida requisitos; não representa implementação concluída. Nenhum teste funcional foi executado nesta etapa documental. Verificações realizadas: Git, leitura da documentação/migração existente e git diff --check. Nenhum commit ou push.

## Incremento de banco aplicado

Após a consolidação inicial, as migrações de checklists/remessas foram aplicadas permanentemente no BagSync com autorização explícita em 26/10/2026. Testes transacionais aprovados antes e depois da aplicação, com rollback das fixtures. Estado e contrato atuais em [kits e remessas](kits-remessas.md). As diferenças listadas acima descrevem a base anterior à aplicação dessas migrações. Interface, novo PDF, contatos/endereço e rotas continuam pendentes.
