# Checklists e remessas

## Estado em 26/10/2026

Implementação aplicada permanentemente no projeto BagSync após autorização explícita do responsável, em 26/10/2026: `20261026074225_checklists_remessas.sql`. Migração adicional `20261026074334_kit_delivery_reference_index.sql` cria índice de apoio à FK dos itens de entrega. Arquivos locais alinhados às versões do histórico remoto; nenhuma migração anterior foi alterada. Nenhuma alteração no projeto antigo, nas credenciais ou no vínculo real.

Objetivo deste incremento: base de dados para checklist por modelo, previsão manual por remessa, envios parciais e pendências rastreáveis. Aceite técnico: isolamento por empresa, controle por perfil, estoque sem baixa duplicada, snapshot histórico e estorno reabrindo pendências. Interface móvel, painel de alertas, novo PDF e rotas ainda não estão implementados.

## Tabelas e relacionamentos

| Tabela | Conteúdo e relações |
| --- | --- |
| bag_checklist_items | Item predefinido do modelo: empresa, bolsa, material, rótulo, posição e ativo. Sem consumo calculado. |
| shipment_kits | Remessa de um pedido para uma facção: modelo do pedido, quantidade de bolsas informada, observação, autor, data e chave idempotente. |
| shipment_kit_items | Itens congelados da remessa: material/unidade, rótulo, símbolo, posição e quantidade prevista manual. |
| kit_deliveries | Liga uma operação efetiva de entrega ao kit, com chave, solicitação e resultado para repetição segura. |
| kit_delivery_items | Quantidade de cada item do kit atendida naquela entrega. |

Todas as tabelas possuem `company_id`. Chaves estrangeiras compostas impedem relacionamentos entre empresas. Pedido e modelo da remessa precisam corresponder. A quantidade de bolsas no cabeçalho não registra recebimento nem abate o pedido.

Checklist e composição quantitativa (`bag_materials`) são separados: cadastrar composição não cria checklist, remessa ou baixa. O checklist deve ser configurado com materiais reais antes de criar a remessa. Rótulos diferentes podem utilizar o mesmo material do estoque; a entrega agrega essas quantidades em uma única linha de movimentação.

Cada remessa captura todos os itens ativos do modelo e exige suas quantidades previstas positivas e finitas. Não multiplica composição por bolsas. Alterar/desativar/excluir o item do modelo não altera o rótulo, a previsão ou a unidade capturados. A exclusão apenas remove a referência opcional ao template.

## Contrato de gravação

- `create_shipment_kit(request_key, order_id, workshop_id, bag_quantity, items, note)`: Gerente Logístico; `items` contém `template_item_id` e `expected_quantity` de cada item ativo.
- `record_kit_delivery(request_key, kit_id, items, note)`: Gerente Logístico ou Motorista. Cada item contém `kit_item_id` e `mode`: `complete` envia o saldo pendente atual; `partial` exige `quantity` numérica positiva.
- Material não enviado é omitido da entrega e permanece pendente. O traço da ficha representa essa condição e não cria saída de estoque.
- Quantidades devem ser enviadas como strings decimais para preservar precisão. `complete` não confia em quantidade enviada pelo cliente.
- Empresa e autor vêm da identidade autenticada, nunca de parâmetros do navegador. Escritas são serializadas por empresa, como nas operações existentes.
- Repetir a mesma chave e corpo retorna o resultado anterior; corpo divergente é rejeitado. A interface futura precisa preservar ambos em tentativas de resultado incerto.
- A entrega usa `register_inventory_operation` para gravar estoque e vínculo com o kit na mesma transação. Chaves de operações preexistentes fora do kit não podem ser reaproveitadas para vinculá-las retroativamente.
- Estornos continuam pela RPC existente, permitidos ao gerente; original e estorno permanecem no histórico.

## Saldos e permissões

`shipment_kit_item_progress` calcula previsto, enviado, pendente e excedente. Envios estornados não contam como atendimento. Pendente = máximo(previsto − enviado, 0). A quantidade efetivamente informada não é truncada à previsão; excedente fica disponível separadamente na consulta. O aviso visual desse caso ainda depende da interface.

`shipment_kit_status` retorna `incompleto` enquanto algum item estiver pendente; após atendimento total retorna `completo`. Estorno pode reabrir o kit. Quantidade de material e saldo negativo do estoque são conceitos distintos; o aviso de estoque negativo da RPC existente é preservado.

As duas views usam `security_invoker`. Todas as novas tabelas têm RLS; os três perfis consultam somente a própria empresa. Somente gerente gerencia templates. Histórico e remessas não têm escrita direta para clientes. Motorista pode registrar envio, mas não criar kit/template. Gestor consulta. Anônimo não tem acesso. A exceção de atribuição de rotas pelo Gestor permanece um requisito futuro.

As duas RPCs são `SECURITY DEFINER` com `search_path` vazio, execução restrita a `authenticated` e validação explícita de identidade/empresa/perfil antes da consulta ou gravação. Essa escolha preserva o contrato de histórico sem escrita direta; deve ser considerada na leitura dos advisors.

## Validação realizada

`supabase/tests/checklists_remessas.sql` usa BEGIN/ROLLBACK. Executado com a migração na mesma transação, antes de qualquer aplicação persistente:

- Criação sem baixa, previsão manual, exigência de checklist completo e facção da mesma empresa.
- Pendências iniciais, parcial de 50 de 100, confirmação do restante e agregação de dois itens do mesmo material.
- Repetição idempotente; rejeição de chave com corpo diferente, item repetido, quantidade negativa, NaN e item alheio ao kit.
- Falha atômica sem operação parcial; confirmação sem saldo não gera nova baixa.
- Estorno reabre pendência; edição/exclusão do template preserva snapshot.
- Histórico sem exclusão direta, motorista limitado, gestor somente consulta, isolamento das cinco tabelas e duas views, anônimo e identidade ausente bloqueados.

Após ROLLBACK: `shipment_kits` inexistente; preservadas uma empresa, um vínculo e um material; pedidos e operações continuam zerados. Não foram criados usuários Auth de teste. Não houve teste concorrente com duas sessões; a serialização usa o bloqueio transacional já existente. Não houve teste visual do novo fluxo ou PDF, pois ainda não existem.

Regressão executada: `node --test tests/*.test.mjs` (24 aprovados), `npm run lint` (saída 0), `npm run build` (compilação e TypeScript concluídos) e `git diff --check` (sem erros). Node emitiu avisos de detecção de módulos TypeScript sem `type` no package.json; os testes concluíram sem falhas. Nenhuma dependência instalada, commit ou push executado.

## Aplicação e continuidade

Aplicação persistente concluída e histórico remoto conferido. Os testes SQL foram executados novamente após a aplicação e passaram, com rollback dos dados temporários. Permaneceram uma empresa, um vínculo, zero kits e zero operações. RLS habilitado nas cinco novas tabelas.

Advisors: corrigido o único aviso de FK sem índice. Restam informações de índices ainda não utilizados, quatro avisos de RPCs SECURITY DEFINER intencionalmente acessíveis a autenticados (duas existentes e duas novas, com autorização interna testada) e proteção contra senhas vazadas desativada, já existente. Referências: [RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) e [índices sem uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). Nenhuma configuração do Auth foi alterada.

Próxima etapa: integrar cadastro de checklist, preenchimento de remessa, pendências e PDF ao aplicativo mobile-first. Rotas/endereço/recolhimentos ficam no incremento seguinte.
