# Checklist por modelo — interface

## Entrega em 26/10/2026

Objetivo: permitir configurar o checklist de saída de cada modelo usando o banco já aplicado. Acesso em **Cadastros → Bolsas → Consultar checklist de saída**, na rota `/painel/cadastros/bolsas/[id]/checklist`.

Escopo e aceite: consultar itens paginados, incluir e editar material/rótulo/posição, ativar e desativar para novas remessas. Gerente Logístico altera; Motorista e Gestor consultam. Empresas isoladas por filtros e RLS. Não movimentar estoque nem reescrever remessas existentes. Não houve migração ou instalação de dependências neste incremento.

O checklist é separado da composição quantitativa. Não exige quantidade por bolsa: previsões serão preenchidas manualmente na futura tela de remessa. Apenas itens ativos entram em novas remessas; inativos permanecem visíveis para consulta e reativação. Empates de posição usam ID como desempate estável.

## Implementação

- Página renderizada no servidor, com 25 itens por página. Opções de materiais/unidades carregadas em blocos para evitar truncamento silencioso.
- Formulários em uma coluna no celular, controles com altura mínima de 44 px, rótulos associados, estado de envio e mensagens de resultado.
- Ação de servidor verifica identidade e perfil antes da gravação. Empresa é obtida da sessão. Alterações restringem empresa, modelo e ID do item; FKs/RLS reforçam integridade no banco.
- Validação aceita somente inclusão/edição, UUIDs, rótulo não vazio, posição inteira não negativa dentro do limite PostgreSQL e ativação explícita. Campos extras de empresa, perfil ou quantidade não são utilizados.
- Cada inclusão recebe ID estável no formulário. Uma repetição não cria segunda linha com o mesmo ID; resultado incerto orienta conferir a lista. Isso não equivale a operação offline ou persistência da intenção após recarregar a página.
- Após incluir, o formulário fica bloqueado até selecionar “Adicionar outro item”, que recarrega a página para iniciar nova inclusão. Não há exclusão física pela interface; a desativação atende à retirada de itens de futuras remessas.

Arquivos principais: `src/lib/checklists/{validation,data}.ts`, `src/app/painel/cadastros/bolsas/checklist-{actions,form}.tsx` (ação em `.ts`), página `[id]/checklist/page.tsx` e link na lista de modelos. Testes em `tests/checklists.test.mjs` e `tests/http-access.mjs`.

## Validação real

- `node --test tests/*.test.mjs`: 27 aprovados, incluindo três novos testes de validação do checklist. Os três foram repetidos após ajuste de compatibilidade TypeScript e passaram.
- `npm run lint`: saída 0.
- `npm run build`: aprovado após substituir literal BigInt por construtor compatível com o alvo TypeScript atual; nenhuma mudança de configuração.
- `node tests/http-access.mjs`: aprovado fora do sandbox após bloqueio EACCES de loopback; login 200, 13 rotas protegidas (incluindo checklist), dois downloads negados sem sessão.
- `git diff --check`: sem erros.

Não houve teste de edição com usuário autenticado nem inspeção visual em navegador neste incremento. O login existente foi validado anteriormente pelo responsável, o que não substitui a validação desta nova tela. Não foram cadastrados dados reais ou fictícios no banco, nem executados commit/push.

## Próximo incremento

### Refinamento solicitado: tipo de preenchimento salvo no modelo

O responsável reforçou que o checklist preestabelecido deve guardar a escolha entre caixa de conferência (✓) e texto livre, com quantidade numérica separada para estoque. Esse refinamento está implementado no cadastro e no controle de saída.

Respostas confirmadas: escolha por item durante a criação do checklist, salva no modelo; conferência confirma toda a quantidade prevista e baixa estoque; envio parcial numérico continua permitido; texto é livre e tem quantidade numérica separada para estoque. A saída deve selecionar facção/costureiro cadastrado e ter anotações gerais. Após concluir, o documento deve apresentar destinatário e quantidade à esquerda, data e modelo à direita (município é o nome do modelo), com opção de PDF/impressão.

Seletor obrigatório de tipo, validação no servidor, gravação do tipo e indicação na lista implementados. Migração `20261026191246_checklist_response_types.sql`, aplicada no BagSync, acrescenta `input_type` ao template e ao snapshot e atualiza `create_shipment_kit` para capturá-lo. Valores: `checkbox` e `text`. Registros anteriores ficam nulos (legado sem tipo definido), sem atribuição fictícia; novas remessas exigem configurar todos os itens ativos. Remessas anteriores permanecem inalteradas.

A migração foi validada com testes transacionais em BEGIN/ROLLBACK, incluindo rejeição de tipo inválido, exigência de configuração e preservação do tipo histórico, e depois aplicada permanentemente. Formulário de saída, respostas em texto, quantidade separada e novo PDF implementados conforme [controle de saída](controle-saida.md).

Validação deste refinamento: 28 testes Node aprovados; lint, build e `git diff --check` aprovados. Testes SQL novamente aprovados com transação revertida, incluindo asserções que rejeitam snapshot de tipo ausente. Sem teste autenticado/visual do seletor e sem dados permanentes de teste. Nenhum commit ou push executado. Preservadas as alterações locais anteriores.

Criação de remessa, previsto manual, envio parcial/✓, pendências por item e PDF integrados. O recolhimento móvel usa o fluxo existente por pedido/facção. Tabela consolidada, endereço e rotas são etapas posteriores. Dúvidas futuras devem ser agrupadas em questionário ao responsável.
