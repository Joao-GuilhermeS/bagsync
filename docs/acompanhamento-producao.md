# Acompanhamento da produção — levantamento

## Solicitação confirmada em 26/10/2026

Criar uma aba para acompanhar o fluxo de produção das bolsas, organizada por modelo. Neste projeto, o município é o nome do modelo de bolsa; não são duas entidades ou filtros independentes. Essa correção explícita do responsável substitui a interpretação anterior em 26/10/2026. Exibir:

Apresentar cards de todos os modelos cadastrados, inclusive sem produção. Navegação confirmada: escolher modelo → escolher facção cadastrada → registrar entrega ou recebimento. Não criar etapa/cadastro separado de município atendido. Endereço real da facção continua sendo um dado distinto para futura logística.

- Nome da facção/costureiro cadastrado.
- Quantidade de bolsas recebida para produzir.
- Data de distribuição.
- Quantidade recolhida.
- Data dos recolhimentos.
- Observações.

Pedidos simultâneos continuam independentes e usam estoque compartilhado. Recebimentos parciais e estornos devem ser respeitados; não duplicar o total recolhido ao relacionar várias entregas a vários recebimentos. Não criar entidade independente de lotes.

## Questionário enviado

1. Corrigido: município é o nome do modelo. Padronizar interface e relacionamentos por modelo, sem dupla seleção município/modelo.
2. Resolvido: quantidade distribuída corresponde à quantidade de bolsas da saída/remessa para a facção.
   Refinamento confirmado nesta implementação: conta na primeira saída de material, uma única vez por remessa, sem somar novamente nos complementos. Preparação sem envio não é distribuição.
3. Resolvido: mostrar total recolhido com histórico expansível das quantidades e datas de cada recolhimento parcial.
4. Resolvido: Gerente Logístico, Motorista e Gestor podem registrar observações no acompanhamento. Exceção específica, sem ampliar permissões sobre cadastros ou estoque.

Respostas acima confirmadas pelo responsável em 26/10/2026. Se a linha agregar várias distribuições, o histórico precisará preservar todas as datas; não escolher arbitrariamente a primeira ou a última como única data. A quantidade prevista de um kit não deve ser somada novamente a cada complemento de material do mesmo kit.

## Diagnóstico da base existente

## Refinamento: tela do entregador como base do ciclo

O responsável definiu que a tela do entregador será a entrada operacional central do ciclo: consultar materiais efetivamente entregues por romaneio, identificar facções com bolsas para entregar e registrar/consultar bolsas recolhidas. A entrada possui cards clicáveis de todos os modelos cadastrados, chegando à escolha da facção e às operações.

Prioridade: integrar as telas de remessas, romaneios e recebimentos nesse fluxo, em vez de manter o usuário alternando entre formulários sem contexto. Preservar identificação de pedido em todos os lançamentos, pois um modelo pode estar em vários pedidos simultâneos.

Questionário complementar resolvido: modelo → facção → entrega/recebimento; exibir todos os modelos. Quando houver vários pedidos do modelo, identificar o pedido dentro da tela da facção antes do lançamento. Não presumir encerramento automático de pedido, acesso da facção ou restrição a rotas atribuídas: essas regras não foram acrescentadas pelo refinamento.

Dados a exibir por facção: bolsas atribuídas para fabricação, bolsas recolhidas, saldo a recolher, materiais efetivamente enviados, datas e observações, com acesso ao histórico. Materiais previstos em kit ainda não enviado não podem aparecer como entregues. Somar entregas e recebimentos separadamente antes de combinar os totais evita multiplicação de valores por relacionamentos 1:N.

O saldo e o histórico devem respeitar estornos e pedidos distintos. Quantidades de materiais permanecem em suas respectivas unidades; não produzir um total misturando metros, kg e unidades. A consulta por modelo pode resumir pedidos, mas cada entrega/recolhimento exige selecionar ou identificar o pedido correspondente.

### Estrutura atual inspecionada

- Pedidos identificam um modelo e admitem várias facções.
- Kits identificam pedido, facção e quantidade de bolsas informada.
- Operações de entrega/recebimento possuem pedido, facção, data de registro e observação; estornos preservam histórico.
- workshops ainda não possui endereço estruturado. Não adicionar campo de município atendido a production_orders: a referência operacional já é bags, cujo nome identifica o modelo/município conforme correção do responsável. Não alterar nomes existentes nem duplicar cadastros automaticamente.
- Recebimentos estão vinculados a pedido/facção; não estão atribuídos individualmente a cada kit. Não apresentar uma conciliação por remessa que o banco ainda não registra.
- Data de registro é conhecida; data operacional retroativa ainda não foi definida. Não tratá-las como equivalentes sem deixar explícito.

## Estado

Navegação operacional, controle de saída e PDF implementados. Tabela consolidada em /painel/producao e observações pelos três perfis implementadas com migração aplicada no BagSync. [Regras de contagem, permissões, uso e testes](tela-acompanhamento.md). Rotas/endereço e validação autenticada/mobile continuam pendentes.
