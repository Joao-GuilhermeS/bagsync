# Expedição, entregas e cadastros — 27/10/2026

## Requisitos confirmados e aceite

- Unidades predefinidas, selecionáveis no cadastro de materiais; remover o cadastro editável de medidas.
- Cada item do checklist do modelo permite escolher conferência por caixa ✓ OK ou texto livre. Escolha persistida por modelo; quantidade numérica e anotações continuam independentes do texto.
- Separar a Expedição na fábrica da confirmação de entrega na facção.
- **Confirmação explícita do responsável:** emitir o romaneio na Expedição baixa o estoque e deixa os materiais “A entregar”; confirmar na facção não gera outra baixa.
- Facções/costureiros passam a ter documento, telefone e endereço.
- Preservar cadastros, histórico, vínculo/autenticação e isolamento entre empresas; nenhum dado operacional fictício deve permanecer no banco.

## Como usar

1. Cadastros → Materiais: escolher uma unidade predefinida.
2. Cadastros → Modelos → Checklist: adicionar materiais e escolher caixa de conferência ou texto livre por item. A unidade acompanha o material; não existe conversão implícita para outra unidade no checklist.
3. Fábrica → Expedição: preparar remessa para pedido/facção e informar previstos manualmente. Essa preparação não movimenta estoque.
4. Preencher a saída: marcar OK para todo o saldo restante ou informar parcial; texto livre tem quantidade enviada separada. Não enviado permanece pendente. Anotações gerais são preservadas.
5. Concluir a Expedição: registrar a saída, baixar os materiais e emitir o romaneio. Abrir o PDF para visualizar/imprimir. A emissão é o registro concluído, não um evento de download ou impressão física; falha de impressão não deve repetir baixa.
6. Operação → Entregas de materiais: consultar “A entregar” e confirmar o recebimento na facção. Também disponível no fluxo do entregador por modelo → facção → pedido. Somente romaneios com materiais efetivamente expedidos e não estornados ficam disponíveis.
7. Recolher bolsas continua sendo um lançamento separado no pedido/facção, com parciais e aviso de excedente.

Um complemento emite outro romaneio com suas próprias quantidades e confirmação. A quantidade de bolsas distribuída continua contando uma vez por remessa na primeira saída válida, conforme regra anterior. A confirmação da entrega não duplica produção ou estoque.

## Unidades

Unidade (un), peça (pç), par (par), dúzia (dz), metro (m), centímetro (cm), milímetro (mm), metro quadrado (m²), quilograma (kg), grama (g), litro (L), mililitro (mL), rolo, bobina (bob), cone, pacote (pct) e caixa (cx).

Sem fatores de conversão automáticos: rolos, caixas e pacotes não têm conteúdo fixo presumido. A migração preserva IDs, nomes e símbolos antigos e insere apenas símbolos ausentes. Novas empresas recebem o conjunto automaticamente. Usuários autenticados têm somente SELECT nas unidades; rota/ação de cadastro de unidades removida. Unidades legadas permanecem disponíveis para preservar vínculos.

## Facções

Campos novos: `document_number`, `phone`, `street`, `address_number`, `address_complement`, `neighborhood`, `city`, `state`, `postal_code`. Nome continua obrigatório; campos novos opcionais para compatibilidade e ausência de definição de obrigatoriedade.

Documento genérico, sem presumir CPF/CNPJ ou unicidade. Limites no servidor e no banco; UF de duas letras e CEP de oito dígitos com hífen opcional. Endereço e telefone aparecem na consulta da facção e no contexto do entregador. Município físico da facção não substitui o modelo de bolsa.

Esses dados podem identificar pessoas. Permanecem sob a RLS da empresa, sem acesso público; não são publicados em logs ou na prévia de testes. Retenção e política de exclusão específicas ainda dependem de definição do responsável.

## Banco e permissões

`shipment_delivery_confirmations`: confirmação imutável, com empresa, FK composta para o preenchimento/romaneio, chave idempotente, autor, data e anotação de até 2.000 caracteres. Unicidade por empresa/romaneio e por empresa/chave. Sem INSERT/UPDATE/DELETE direto pelo cliente.

`confirm_shipment_delivery`: valida sessão, empresa, perfil, romaneio com operação e ausência de estorno. Usa o mesmo lock transacional por empresa das movimentações; replay idêntico retorna o resultado original; chave divergente ou segunda confirmação é rejeitada. Não cria operação nem movimento de estoque.

`shipment_dispatches`: view SECURITY INVOKER com os estados `a_entregar`, `entregue`, `estornado`. Estorno posterior mantém a confirmação histórica e apresenta o romaneio como estornado. Checklist sem envio pode ter PDF, mas não entra na fila de entregas.

| Ação | Gerente Logístico | Motorista | Gestor |
| --- | --- | --- | --- |
| Editar facções/materiais/checklists e preparar/emitir saída | Sim | Não | Não |
| Consultar dados da própria empresa | Sim | Sim | Sim |
| Confirmar entrega e registrar recolhimento | Sim | Sim | Não |
| Gerenciar unidades | Não | Não | Não |
| Registrar observações de produção | Sim | Sim | Sim |

As APIs legadas de movimentação/kit preservam histórico e transações, mas a baixa de materiais passa a exigir gerente também no banco. A interface emite pela conclusão do checklist; motorista usa a nova confirmação. As permissões não dependem de ocultar botões.

## Rotas e arquivos

- `/painel/expedicao`: caminho canônico; páginas e PDF reutilizam a implementação de remessas.
- `/painel/remessas`: aliases compatíveis para links antigos.
- `/painel/entregas`: fila e consulta de estados, com filtros por pedido/facção e paginação.
- `src/app/painel/entregas/`: consulta e confirmação; `src/lib/shipments/`: validação.
- `src/app/painel/cadastros/` e `src/lib/catalogs/`: campos e remoção do cadastro de medidas.
- `src/lib/navigation.ts` e componentes do painel/entregador: novos atalhos e orientações.

## Migrações e verificação

Aplicadas exclusivamente no BagSync `ppgeveafuhgoymtvvrya`:

- `20261027184848_expedicao_unidades_faccoes.sql`: unidades, contatos, confirmação, view e ajuste de permissões.
- `20261027185253_expedition_receipt_permission_fix.sql`: corrige restrição excessiva encontrada no teste; preserva `bag_receipt` pelo motorista. A migração já aplicada não foi editada.
- `20261027190254_remove_redundant_submission_index.sql`: remove o índice duplicado de submissão identificado pelos advisors, preservando a restrição original usada pelas FKs.

Arquivos inicialmente gerados pela CLI tiveram somente o timestamp do nome alinhado à versão registrada pela aplicação via MCP. SQL aplicado e migrações anteriores preservados.

Testes SQL em `supabase/tests/expedicao_entregas.sql` e regressões de catálogos, composição, pedidos, kits, respostas, produção e exportações usam BEGIN/ROLLBACK. Testes de unidades, campos, validação de confirmação e negação de baixa pelo motorista em `tests/`. Nenhuma fixture ou troca de perfil deve persistir.

Resultados finais e limitações de validação visual/técnica são registrados no checkpoint de entrega. Consultada a [documentação oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security); nenhuma dependência foi instalada ou atualizada.

### Resultados executados

- `node --test tests/*.test.mjs`: 49 aprovados.
- Oito suítes SQL aprovadas, todas com rollback: catálogos, composição, pedidos/movimentos, kits, respostas de checklist, produção, exportações e Expedição/entregas. A suíte nova foi repetida após a remoção do índice duplicado.
- `npm run lint` e `npx next build --webpack`: aprovados, incluindo TypeScript e geração de páginas. Não houve nova tentativa do build Turbopack neste bloco; sua falha anterior permanece documentada.
- `node tests/http-access.mjs`: login 200, 28 páginas protegidas; quatro arquivos e histórico negados sem sessão.
- `git diff --check`: sem erros.
- Edge em 375 px: formulário real de facção em painel sem transbordamento horizontal, seletor de unidade e alternância entre os dois tipos de resposta do checklist. Prévia isolada com ações inertes; opções representativas de unidades na prévia, conjunto completo de 17 conferido no banco. Sem gravações de produção.
- Após rollback: uma empresa, um vínculo (Gerente Logístico), uma remessa preexistente, zero operações, zero preenchimentos e zero confirmações; nenhuma fixture permaneceu.
- Advisors: sem aviso de índice duplicado ou FK sem índice após a correção. Onze índices sem uso como INFO. Segurança mantém sete RPCs SECURITY DEFINER autenticadas intencionais (com verificações de identidade/empresa/perfil) e o aviso preexistente de proteção contra senhas vazadas desativada.

Validação manual dos formulários com sessão real e impressão física continuam pendentes. Não foram executados commit/push nem alterações no projeto antigo.
