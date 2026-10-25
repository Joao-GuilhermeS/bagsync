# Composição de bolsas — incremento 5

## Diagnóstico

Base Git limpa no commit 051fc54. bag_materials, FKs compostas, PK e políticas RLS já existentes foram inspecionadas; nenhuma migração, política ou credencial alterada. Responsável relatou interface crua e lentidão e orientou adiar o refinamento visual/navegação. Esse relato foi registrado, sem alegação de medição ou otimização de desempenho.

## Implementação e aceite

A lista de modelos agora oferece Consultar composição para os três perfis. Rota: /painel/cadastros/bolsas/[id]/composicao. Exibe materiais, unidades e quantidades por uma bolsa, com paginação e decimal em texto. Modelo de outra empresa/inexistente não é exposto. Consulta ocorre sob sessão e RLS, com filtro explícito de empresa.

Gerente Logístico adiciona material, altera somente quantidade e remove vínculo com confirmação. Motorista e Gestor consultam. Server Action valida identidade/vínculo/perfil, IDs e quantidade antes de gravar. Empresa vem do contexto autenticado, não do formulário. Edição/remoção filtram chave completa (empresa, bolsa, material). Não há upsert silencioso: duplicação retorna mensagem para editar o item já existente. Referência inexistente/sem acesso não retorna sucesso.

Composição continua opcional. Quantidade deve ser positiva e finita; vírgula/ponto decimal aceitos sem separador de milhares. Conversão no SELECT para texto e formatação sem Number preservam precisão. Não há reserva, baixa de estoque, geração automática de entrega, conversão de unidades ou mudança do histórico dos pedidos. Composição descreve o modelo atual, sem versionamento histórico ou vínculo congelado no pedido.

Formulários mantêm campos controlados, estado de envio, confirmação, mensagens e revalidação da página. Falha de conexão orienta conferir composição antes de repetir; PK impede vínculo duplicado, mas não existe chave de idempotência nova para edição/exclusão de catálogo. Visual segue funcional e básico, sem etapa de design neste incremento.

## Arquivos

- src/lib/operations/validation.ts: parser de composição reutiliza validação decimal exata.
- src/app/painel/cadastros/bolsas/composition-actions.ts: escrita autorizada.
- src/app/painel/cadastros/bolsas/composition-form.tsx: formulários de adicionar/editar/remover.
- src/app/painel/cadastros/bolsas/[id]/composicao/page.tsx: consulta integrada.
- src/app/painel/cadastros/[catalog]/page.tsx: link por modelo.
- tests/composition-validation.test.mjs e supabase/tests/composicao.sql: validação e integração.
- tests/http-access.mjs: nova rota na regressão HTTP.
- README e documentação atualizados; exportações aprovadas documentadas separadamente.

## Validação real

- node --test tests/*.test.mjs: 20 testes passaram, incluindo precisão, campos extras ignorados, ações/IDs inválidos e confirmação da remoção.
- npm run lint e tsc --noEmit: sem erros.
- npm run build: aprovado, com rota de composição reconhecida.
- node tests/http-access.mjs: login 200 e onze rotas protegidas sem sessão. Servidor temporário encerrado.
- supabase/tests/composicao.sql executado exclusivamente no BagSync: CRUD do gerente, decimal exato, duplicação bloqueada, material de outra empresa rejeitado, quantidade negativa rejeitada, consulta para motorista/gestor com escrita negada, acesso anônimo/sem identidade negado e nenhuma nova movimentação de estoque. Fixtures e alterações temporárias de perfil revertidas por rollback.
- git diff --check: sem erros.

Não executados: teste visual, CRUD autenticado no navegador, testes de carga ou avaliação de latência. Autenticação havia sido validada pelo responsável; não se confunde com teste dos novos formulários. Nenhuma senha coletada. Não afirmamos ausência dos alertas Supabase já documentados.

## Próximo incremento e checkpoint

Exportações aprovadas pelo responsável: romaneio PDF por operação e extratos CSV por período/pedido/facção, descritos em exportacoes.md. Design/navegação e investigação de lentidão ficam para a etapa solicitada pelo responsável.

Momento de versionar após revisão deste incremento. Nenhum commit/push executado.

```powershell
git status --short
git diff --check
git diff
git ls-files --others --exclude-standard
# Ler também os arquivos novos.
git add src/app/painel/cadastros/ src/lib/operations/validation.ts tests/composition-validation.test.mjs tests/http-access.mjs supabase/tests/composicao.sql docs/composicao-bolsas.md docs/exportacoes.md docs/desenvolvimento.md docs/requisitos.md docs/arquitetura.md README.md AGENTS.md
git diff --cached
git commit -m "feat: integrar composicao de materiais por modelo de bolsa"
git push origin main
```
