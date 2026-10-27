# BagSync — Requisitos e funcionamento

## Atualização — Expedição e entregas (27/10/2026)

Expedição → emissão/baixa → confirmação de entrega sem nova baixa. Unidades predefinidas; facções com documento, telefone e endereço; recolhimento de bolsas separado. Contrato vigente em [Expedição e entregas](expedicao-entregas.md), que substitui descrições históricas divergentes abaixo.

**Empresa inicial:** RL Bolsas  
**Atualizado em:** 27/10/2026  
**Finalidade:** apresentar, de forma básica, o escopo confirmado, as regras de negócio e o funcionamento do sistema.

## 1. Objetivo

O BagSync é uma aplicação web SaaS para controlar a produção de bolsas e sua movimentação entre a fábrica e as facções de costura. Substitui os registros em papel e permite acompanhar materiais enviados, bolsas recolhidas, estoque e pendências de produção.

O uso deve ser simples em computadores, tablets e celulares, com prioridade ao trabalho do entregador em campo.

## 2. Usuários e responsabilidades

| Perfil | Responsabilidades |
| --- | --- |
| Gerente Logístico | Gerenciar cadastros, pedidos e remessas; registrar entregas e recolhimentos; consultar a produção; registrar observações e estornar operações quando necessário. |
| Motorista / Entregador | Consultar modelos e facções, preencher o controle de saída de remessas preparadas, registrar bolsas recolhidas e acrescentar observações da produção. |
| Gestor | Consultar as informações e acrescentar observações da produção. Não pode movimentar estoque, cadastrar produtos ou registrar saídas. |

As facções e os costureiros são destinatários cadastrados e não acessam o aplicativo. Inicialmente, o desenvolvedor realiza o provisionamento dos usuários no Supabase.

Está aprovado que Gerente Logístico e Gestor também poderão atribuir rotas quando esse módulo for implementado.

## 3. Requisitos principais

### Cadastros e pedidos

- Cadastrar facções/costureiros, unidades de medida, materiais e modelos de bolsas.
- Permitir composição técnica opcional, relacionando materiais e quantidades por modelo.
- Configurar um checklist próprio para cada modelo.
- Cadastrar pedidos de produção com um modelo e uma quantidade prevista de bolsas.
- Permitir vários pedidos simultâneos e várias facções trabalhando no mesmo pedido.

**Padronização:** neste projeto, o município citado no controle de produção é o nome do modelo de bolsa. O sistema utiliza **Modelo**, sem uma seleção separada de município. Isso não substitui o endereço real da facção.

### Estoque e controle de saída

- Registrar entradas de materiais e consultar o estoque.
- Manter consultas separadas para materiais e bolsas prontas.
- Preparar remessas vinculadas ao pedido e à facção cadastrada.
- Informar manualmente a quantidade de bolsas atribuída à remessa e os materiais previstos.
- Registrar o que efetivamente saiu da fábrica e as pendências por item.
- Gerar controle de saída em PDF, com opção de abrir para impressão.

### Recolhimentos e acompanhamento

- Registrar recebimentos parciais de bolsas por pedido e facção.
- Atualizar o estoque de bolsas e o progresso do pedido.
- Consultar, por modelo, uma tabela com facção, pedido, quantidade distribuída, recolhida e pendente, além das datas.
- Expandir o histórico para consultar distribuições, recolhimentos e observações.
- Filtrar a consulta por pedido, facção e bolsas pendentes.
- Disponibilizar romaneios em PDF e extratos CSV filtrados por período, pedido e facção.

## 4. Regras de negócio básicas

1. **Isolamento entre empresas:** cada empresa possui seus próprios dados. Um usuário pertence a uma única empresa; não há filiais no escopo confirmado.
2. **Pedidos:** cada pedido contém um único modelo de bolsa, mas pode ser atendido por várias facções.
3. **Estoque compartilhado:** os pedidos da mesma empresa utilizam os mesmos cadastros e o mesmo estoque. Seus resultados de produção continuam separados.
4. **Unidades:** materiais podem usar unidades diferentes, como metro, unidade e kg. Quantidades de unidades diferentes não devem ser somadas como se fossem equivalentes.
5. **Sem consumo automático pela composição:** cadastrar uma ficha técnica ou preparar uma remessa não reserva nem baixa materiais. As previsões são manuais; o estoque muda quando o envio é registrado.
6. **Checklist por modelo:** cada item utiliza caixa de conferência ou texto livre, conforme escolha feita no cadastro. A remessa preserva a configuração utilizada, mesmo que o modelo seja alterado depois.
7. **Conferência e envio parcial:** marcar ✓ confirma o envio do saldo previsto restante do item. Também é possível informar uma quantidade parcial. Texto livre possui uma quantidade numérica separada para estoque.
8. **Material pendente:** traço ou indicação de não enviado significa material faltante. Não gera baixa e mantém o kit incompleto enquanto houver saldo pendente. Um preenchimento sem envio pode ser salvo sem movimentar estoque.
9. **Distribuição da produção:** a quantidade de bolsas da remessa entra como distribuída na primeira saída válida de material para a facção. Complementos de materiais não somam novamente essas bolsas.
10. **Recolhimentos:** cada quantidade recebida pertence a um pedido e uma facção. Recebimentos parciais abatem progressivamente o previsto no pedido.
11. **Excedentes e saldo negativo:** estoque negativo e recebimento de bolsas acima da previsão são permitidos com aviso. Os valores reais devem ser preservados.
12. **Correções:** entregas e recebimentos são corrigidos por estorno e novo lançamento. O original permanece no histórico; estornos ajustam os totais e podem reabrir pendências.
13. **Sem duplicação:** repetir a mesma tentativa de gravação não deve criar outra movimentação. Complementos e múltiplos recolhimentos também não podem multiplicar os totais na consulta.
14. **Observações:** os três perfis podem acrescentar observações da produção. Correções de texto são feitas por novos registros, preservando o histórico. Essa permissão não libera operações de estoque ao Gestor.
15. **Lotes:** o termo representa recolhimentos parciais; não existe cadastro independente de lotes.
16. **Datas e acompanhamento:** as datas atuais são as dos registros no sistema, em horário de Brasília. Não há encerramento automático de pedidos definido.

## 5. Como o sistema funciona

### Etapa 1 — Preparação

O Gerente Logístico cadastra os materiais, suas unidades, as facções e os modelos. Para cada modelo, configura os itens do checklist e o tipo de resposta. Depois cria o pedido de produção e registra as entradas de materiais no estoque.

### Etapa 2 — Remessa para a facção

O gerente escolhe o pedido e a facção cadastrada, informa a quantidade de bolsas destinada àquela remessa e as quantidades previstas dos materiais. Essa preparação ainda não movimenta o estoque.

### Etapa 3 — Saída da fábrica

Na tela do entregador, a navegação é:

**Modelo de bolsa → Facção → Entrega ou recebimento.**

Todos os modelos cadastrados são apresentados. Quando houver vários pedidos do mesmo modelo, o usuário identifica o pedido dentro da tela da facção.

Para entregar materiais, seleciona a remessa preparada, preenche o checklist, informa as quantidades efetivamente enviadas e acrescenta anotações. Ao concluir, o sistema registra a saída e baixa somente os materiais enviados.

O botão **Abrir PDF / imprimir** apresenta o documento com destinatário e quantidade à esquerda, data e modelo à direita, seguido do checklist e das anotações. A escolha da impressora ocorre no diálogo do navegador ou leitor PDF.

### Etapa 4 — Produção e complementos

A facção produz as bolsas fora do aplicativo. Caso falte algum material, a remessa continua com pendências e pode receber novos envios. Esses complementos atendem os materiais faltantes sem duplicar a quantidade de bolsas distribuída para produção.

### Etapa 5 — Recolhimento

O entregador seleciona o modelo, a facção e o pedido correspondente e registra quantas bolsas prontas recolheu. A quantidade entra no estoque de bolsas e atualiza o progresso do pedido. O procedimento pode ocorrer várias vezes até os recolhimentos serem concluídos.

### Etapa 6 — Consulta da produção

Na aba **Produção**, o usuário escolhe o modelo e acompanha os resultados por pedido e facção. O saldo pendente corresponde à diferença positiva entre distribuídas e recolhidas. Recolhimentos acima do distribuído registrado aparecem com aviso.

O histórico permite consultar as datas de cada evento, registros estornados, remessas, romaneios e observações. Para ver mudanças feitas por outros usuários, é necessário consultar novamente ou atualizar a tela; não há atualização automática contínua em segundo plano.

## 6. Requisitos de qualidade e segurança

- Interface em português brasileiro, responsiva e orientada ao uso em celular.
- Autenticação pelo Supabase Auth.
- Validação de dados e permissões no servidor, com isolamento entre empresas também no banco.
- Proteção de credenciais e segredos por variáveis de ambiente, sem exposição de chaves administrativas no navegador.
- Gravações de saída e seus efeitos no estoque realizadas de forma conjunta e rastreável.
- Valores numéricos preservados sem perda de precisão.
- Documentação e migrações de banco versionadas; desenvolvimento incremental com critérios de aceite e testes.

Stack definida: TypeScript, Next.js, React, Tailwind CSS, PostgreSQL e Supabase, com npm, Git/GitHub e Markdown. shadcn/ui está previsto na stack, mas ainda não foi instalado.

## 7. Estado atual e próximos passos

**Implementados:** autenticação e isolamento por empresa; cadastros; composição opcional; pedidos; remessas; estoque; entregas e recolhimentos; estornos; checklist de saída; PDFs e CSV; tela do entregador; acompanhamento consolidado e observações da produção.

**Previstos, ainda não implementados:** dados completos de contato/endereço das facções, rotas diárias, atribuição de motorista e organização das paradas.

**Validação e melhorias pendentes:** uso completo com sessão real no celular, impressão na impressora do cliente, refinamento visual, investigação da lentidão e testes de carga. Metas numéricas de desempenho, hospedagem, backup e recuperação ainda precisam ser definidas. Não há funcionamento offline implementado.

Este documento resume o escopo confirmado; não substitui a homologação das funcionalidades nem acrescenta novas regras de negócio.
