# Acompanhamento da produção — levantamento

## Solicitação confirmada em 26/10/2026

Criar uma aba para acompanhar o fluxo de produção das bolsas, com tabela dinâmica organizada por município. Exibir:

Antes da tabela, apresentar cards de seleção dos municípios atendidos pelos pedidos. O usuário escolhe o município para consultar a produção correspondente. Essa referência foi confirmada explicitamente pelo responsável: não é a cidade do endereço da facção. Facções de outras cidades podem participar da produção destinada ao município selecionado.

- Nome da facção/costureiro cadastrado.
- Quantidade de bolsas recebida para produzir.
- Data de distribuição.
- Quantidade recolhida.
- Data dos recolhimentos.
- Observações.

Pedidos simultâneos continuam independentes e usam estoque compartilhado. Recebimentos parciais e estornos devem ser respeitados; não duplicar o total recolhido ao relacionar várias entregas a vários recebimentos. Não criar entidade independente de lotes.

## Questionário enviado

1. Resolvido: município atendido pelo pedido; seleção por cards antes da tabela.
2. A quantidade distribuída corresponde à quantidade de bolsas informada na saída/remessa ou será definida separadamente?
3. Recolhimentos parciais aparecem como total com histórico expansível ou uma linha por recolhimento?
4. Quais perfis podem registrar observações: gerente/motorista, apenas gerente ou também gestor?

Enquanto essas respostas estiverem pendentes, não definir agrupamento, vínculos adicionais ou novas permissões. Se a linha agregar várias distribuições, o histórico precisará preservar todas as datas; não escolher arbitrariamente a primeira ou a última como única data.

## Diagnóstico da base existente

- Pedidos identificam um modelo e admitem várias facções.
- Kits identificam pedido, facção e quantidade de bolsas informada.
- Operações de entrega/recebimento possuem pedido, facção, data de registro e observação; estornos preservam histórico.
- workshops ainda não possui município/endereço. O acompanhamento usa município do pedido, separado do endereço da facção. production_orders ainda não possui campo estruturado de município; não extrair município do nome do pedido nem preencher registros anteriores por suposição.
- Recebimentos estão vinculados a pedido/facção; não estão atribuídos individualmente a cada kit. Não apresentar uma conciliação por remessa que o banco ainda não registra.
- Data de registro é conhecida; data operacional retroativa ainda não foi definida. Não tratá-las como equivalentes sem deixar explícito.

## Estado

Somente requisito documentado; aba, consulta agregada e edição de observações ainda não implementadas. Alterações locais anteriores preservadas. A migração de tipos do checklist continua separada e pendente de aplicação permanente; este requisito não substitui as tarefas de saída/PDF já confirmadas.
