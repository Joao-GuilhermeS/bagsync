# Telas integradas de cadastros — 25/10/2026

## Diagnóstico e objetivo

Base verificada: commit 335b1e5, árvore limpa. Autenticação com senha validada pelo responsável neste chat; não foi repetida pelo agente. Catálogos e histórico de estoque existentes preservados.
Incremento: consultar, criar, editar e excluir facções, unidades, materiais e modelos de bolsas com sessão real Supabase SSR. Sem novas migrações, dependências, alterações de credenciais ou no projeto antigo.

## Fluxo implementado

- /painel: entrada nos quatro cadastros.
- /painel/cadastros/faccoes: nome da facção/costureira.
- /painel/cadastros/unidades: nome e símbolo.
- /painel/cadastros/materiais: nome e unidade pertencente à empresa. Sem unidade cadastrada, formulário informa pré-requisito e desabilita gravação.
- /painel/cadastros/bolsas: nome do modelo.
- Consulta em páginas de 25 registros, ordenação estável por criação/id; seletor de unidades carrega lotes para não truncar silenciosamente opções.
- Cadastro e edição com confirmação de resultado/erro; exclusão exige marcar confirmação. Banco impede apagar registros referenciados, preservando histórico.
- Estados de carregamento, vazio, falha de consulta, envio em andamento, erro de vínculo e sucesso. Layout adapta navegação, formulário e lista a telas estreitas; controles com alvo de toque e rótulos associados.
- Interface atual usa React/Tailwind com elementos HTML acessíveis e sem novas dependências; shadcn/ui continua não instalado. Não foi introduzido um sistema paralelo de componentes.

## Autorização e validação

Layout exige sessão e vínculo. Cada consulta de catálogo também exige acesso no servidor, pois layout sozinho não protege execução de componentes descendentes. Motorista e Gestor consultam; somente Gerente Logístico vê formulários. A Server Action repete verificação do perfil e usa a função canAccess, além da RLS no banco.

Empresa deriva exclusivamente do vínculo. Não há campo de empresa/perfil no formulário, nem confiança em ID arbitrário: edição/exclusão filtram ID e company_id. A lista de catálogos é fechada e rejeita nomes de tabelas arbitrários/propriedades herdadas. Payload é construído por lista permitida de campos, ignorando campos extras. Nome/símbolo são obrigatórios após trim; unidade precisa de UUID válido; sua propriedade é reforçada por FK composta. Não foram adicionadas restrições de tamanho ou regras de negócio novas ao banco.

Operações retornam erro quando nenhum registro foi afetado; não afirmam sucesso sobre linha inexistente/sem acesso. Erros SQL são traduzidos por código sem expor detalhes internos. Falha de conexão orienta conferir lista antes de repetir cadastro, pois nomes iguais são permitidos e inclusão de catálogo não possui chave de idempotência. Formulários bloqueiam envios enquanto pendentes.

## Arquivos

- src/lib/catalogs/validation.ts: lista de catálogos, validação, paginação e mensagens.
- src/app/painel/layout.tsx: sessão, navegação e perfil.
- src/app/painel/page.tsx: início com links reais.
- src/app/painel/cadastros/[catalog]/page.tsx: consultas e páginas dos cadastros.
- src/app/painel/cadastros/actions.ts: gravações autorizadas no servidor.
- src/app/painel/cadastros/catalog-form.tsx: formulários, confirmação e feedback.
- src/app/painel/error.tsx: falhas de carregamento com tentativa novamente.
- tests/catalog-validation.test.mjs: validação de payload/rota e erros.

## Aceite e resultados reais

Executados: node --test tests/*.test.mjs (12 testes passaram, incluindo os 8 anteriores); npm run lint; tsc --noEmit; npm run build (inclui checagem TypeScript); git diff --check. Sem erros. Mantido aviso Node sobre detecção de ESM, sem mudar configuração do pacote para ocultá-lo.

Teste HTTP do build em servidor temporário: /login retornou 200; as quatro rotas de cadastro sem sessão redirecionaram a /login. Servidor temporário encerrado.

Não executados: CRUD autenticado de ponta a ponta, testes visuais em desktop/celular e testes dos novos formulários nos três perfis em navegador. Não havia sessão disponível no navegador conectado; não foi solicitada/coletada senha. RLS dos catálogos e suas restrições já possuem suíte SQL registrada no incremento anterior, não reexecutada aqui porque não houve alteração de esquema/políticas.

O relato de autenticação aprovada é do responsável; não equivale a teste das novas telas. Recomenda-se conferir cadastro de unidade, material e facção reais e tentativa de exclusão de registro referenciado, sem usar dados fictícios persistentes.

## Pendências

Interface de composição de modelos, pedidos, entrada de material, entrega, recebimento, saldos/avisos e estorno são próximos incrementos. RPCs desses movimentos permanecem intactas e não são chamadas por estes formulários. Login continua o mesmo já validado pelo responsável. Alertas Supabase documentados anteriormente não foram alterados.

## Checkpoint Git

Momento de versionar após revisar o resultado e considerar a limitação de validação visual/autenticada acima. Nenhum commit/push executado.

```powershell
git status --short
git diff --check
git diff
git ls-files --others --exclude-standard
# Ler os arquivos novos antes de selecionar para staging.
git add src/app/painel/ src/lib/catalogs/ tests/catalog-validation.test.mjs docs/telas-cadastros.md docs/desenvolvimento.md docs/arquitetura.md README.md AGENTS.md
git diff --cached
git commit -m "feat: integrar telas de cadastros com autorizacao no servidor"
git push origin main
```
