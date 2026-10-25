# Sequência de desenvolvimento

Sem backlog ou sprints, conforme orientação do responsável.

1. Banco: empresas e vínculo único de usuário com perfil; RLS e testes reais entre empresas. Depois facções, materiais, bolsas e movimentos conforme regras de quantidades/retornos.
2. Backend: Supabase Auth, contexto de empresa obtido da sessão/vínculo, autorização no servidor e validação. Gravações de movimentos/estoque em transações, com proteção contra concorrência e repetição de requisições; regras exatas dependem do fluxo confirmado.
3. Frontend integrado: login e navegação por perfil; facções; páginas separadas de materiais e bolsas; entrega/recolhimento para uso móvel. Estados de carregamento, vazio, erro e acesso negado usando dados reais.
4. Exportações: romaneios/extratos após definir conteúdo e formato. Validar responsividade e fluxo completo com o desenvolvedor.

## Incremento iniciado

Matriz de autorização tipada em src/lib/auth/authorization.ts, com testes de perfis, ausência de sessão e isolamento de contexto. É uma função auxiliar; não constitui autenticação nem RLS e ainda não protege rotas. Integração ao contexto autenticado é a próxima etapa.

Aceite deste incremento: consultas para os três perfis, escrita operacional só para gerente, registro de entrega/recebimento para gerente e motorista, negação para outra empresa e sessão ausente. Verificação por node --test tests/authorization.test.mjs.

## Dependências para integração

Identificar projeto/ambiente Supabase e configurar URL/chave publicável em variáveis de ambiente. Disponibilizar CLI para gerar migração. Avaliar versões e instalar somente @supabase/ssr e @supabase/supabase-js para sessão; não usar service_role nas operações normais. Não publicar ou migrar banco remoto sem revisar destino/impacto.

## Referência técnica

RLS e grants: https://supabase.com/docs/guides/database/postgres/row-level-security. Consultada documentação oficial via conector. Leitura do changelog Markdown pela ferramenta web falhou por tipo de conteúdo; conferir antes de implementar integração/migrações.

## Resultado deste incremento — 25/10/2026

Executados: node --test tests/authorization.test.mjs (4 testes passaram), npm run lint (sem erros), node_modules/.bin/tsc.cmd --noEmit (sem erros) e git diff --check (sem erros). Node emitiu aviso de detecção de ESM no teste, sem falha; package.json preservado.
Build e testes reais de RLS/Supabase não executados. Nenhuma dependência instalada ou banco alterado.
Conector Supabase consultado apenas para listar projetos: encontrado Management-System-Project; aguardando confirmação de destino antes de conectar aplicação ou gerar/aplicar schema.
Arquivos: AGENTS.md, README.md e documentos de requisitos/regras/modelo/arquitetura/desenvolvimento atualizados; backlog descontinuado; src/lib/auth/authorization.ts e tests/authorization.test.mjs criados.

Checkpoint local, após revisar alterações: git status --short; git diff; git ls-files --others --exclude-standard. Ler novos arquivos antes de staging. Agrupar documentação, autorização e testes em um commit coerente; nenhum commit/push realizado.

## Continuidade — pedidos e projeto dedicado

Criada função de cálculo de progresso por pedido, somando recebimentos parciais sem persistência ou mudança automática de estado. Excedentes permanecem visíveis no cálculo; sua aceitação no fluxo depende de regra futura.
Supabase: organização disponível Management System. Confirmação de organização solicitada pelo conector antes da criação de BagSync; região proposta São Paulo. Nenhuma alteração no projeto existente.

Validação deste complemento: 8 testes passaram (autorização e progresso de pedido); TypeScript, lint e git diff --check concluídos sem erros. Sem testes de banco, build ou integração; projeto Supabase ainda não criado. Nenhuma dependência instalada, commit ou push realizado.

## Provisionamento confirmado

BagSync criado em 25/10/2026, referência ppgeveafuhgoymtvvrya, região sa-east-1, retorno ACTIVE_HEALTHY. Nenhuma migração aplicada ou conexão da aplicação configurada. Próxima etapa: preparar e validar migração de empresas/vínculos/RLS e integrar autenticação. Detalhes em implantacao.md.

## Incremento: identidade persistida e login

Arquivos principais: supabase/migrations/20261025200948_company_identity.sql; src/lib/supabase/{config,server}.ts; src/lib/auth/context.ts; src/proxy.ts; src/app/login/{page,actions,submit}; src/app/painel/page.tsx. Atualizados raiz/layout, .gitignore, package.json e lockfile; exemplo de ambiente criado. Dependências fixadas: @supabase/ssr 0.12.7, @supabase/supabase-js 2.118.0 e CLI supabase 2.122.0. Registro npm consultado; instalação reportou zero vulnerabilidades e aviso de script unrs-resolver pendente (não liberado indiscriminadamente).

Validação real: 8 testes passaram; lint e tsc --noEmit sem erros; .env.local confirmado como ignorado pelo Git. Banco: duas tabelas com RLS, SELECT anônimo negado e UPDATE autenticado negado; consulta sob authenticated sem identidade retornou zero empresas. Supabase security advisors retornou lista vazia. Isolamento entre duas empresas reais e login com credenciais ainda não testados; dependem de provisionamento real.

Build: primeira execução falhou ao baixar fontes Google no sandbox; execução com permissão fora do sandbox falhou no Turbopack ao iniciar processo do loader CSS (processo Node terminou antes da conexão). Build de produção não validado. Configuração Tailwind/Turbopack preexistente preservada; não afirmar que aplicação está pronta para publicar.

O pedido de prosseguir foi tratado como autorização para aplicar a migração aditiva revisada exclusivamente no BagSync; nenhuma alteração destrutiva ou no outro projeto. Sem commit/push. Próximo: provisionar empresa/usuário reais, validar login e RLS entre empresas, resolver build e então iniciar facções/pedidos.

Checkpoint para revisão deste conjunto (não executado):

```powershell
git diff --check
git status --short
git diff
git ls-files --others --exclude-standard
# Ler os novos arquivos antes de selecionar para staging.
git add .gitignore .env.example AGENTS.md README.md package.json package-lock.json src/ tests/ docs/ supabase/migrations/
git diff --cached
git commit -m "feat: integrar autenticacao e isolamento inicial de empresas"
git push origin main
```

## Provisionamento real — RL Bolsas

Responsável informou a empresa RL Bolsas e confirmou perfil Gerente Logístico para o usuário real já existente no Auth. Empresa e vínculo provisionados exclusivamente no BagSync; nenhuma senha consultada/alterada e nenhum dado fictício criado. E-mail e UUID pessoal omitidos desta documentação versionável.

Verificação SQL sob papel authenticated e identidade real retornou vínculo gerente_logistico e empresa RL Bolsas. Consulta sem identidade retornou zero empresas e zero vínculos; UPDATE em company_users permaneceu negado. Isso valida políticas no banco, mas não substitui teste de login no navegador com senha nem isolamento entre duas empresas reais. Build continua com o impedimento Turbopack registrado anteriormente. Sem commit/push.

## Correção do build — 25/10/2026

Confirmado no Supabase: somente companies/company_users existem no schema public, cada uma com um registro e RLS. Tabelas operacionais ainda não criadas.
Substituído @tailwindcss/turbopack por @tailwindcss/postcss 4.3.3 e postcss 8.5.31; criado postcss.config.mjs e removida regra customizada de CSS de next.config.ts. Segue https://tailwindcss.com/docs/installation/framework-guides/nextjs. Zero vulnerabilidades reportadas na instalação. Sem alterações no banco nesta etapa.

Validação: npm run build passou, incluindo TypeScript; 8 testes passaram; npm run lint e git diff --check sem erros. Teste HTTP com servidor temporário em 127.0.0.1:3101 confirmou /login 200 com formulário e /painel sem sessão redirecionando a /login sem exibir perfil. Testes iniciais separados falharam com restrição de rede EACCES; repetido com servidor e cliente no mesmo ambiente autorizado, com sucesso. Servidor temporário encerrado. Login real com senha e validação visual/responsiva ainda não realizados.

Checkpoint: revisar next.config.ts, postcss.config.mjs, package.json, package-lock.json e documentação; usar comandos de revisão/commit já registrados, incluindo postcss.config.mjs no staging. Nenhum commit/push.

## Banco: facções, materiais e bolsas

Concluído incremento de banco solicitado, incluindo composição opcional e unidades por empresa. Migração nova 20261025202641_catalogos_producao; suíte transacional supabase/tests/catalogos.sql. Resultado e checkpoint detalhados em [catálogos de produção](catalogos-producao.md). Testes SQL antes/depois passaram, oito testes Node passaram, lint/build aprovados. Sem frontend adicional, sem pedidos/estoque implementados e sem commit/push.

## Incremento 2 — pedidos e movimentos

Base Git limpa no commit f28a677. Regras complementares confirmadas pelo responsável; banco implementado e migração 20261025204641 aplicada no BagSync. Suíte SQL antes/depois passou; 8 testes Node, lint e build aprovados. Contrato e checkpoint em [pedidos e estoque](pedidos-estoque.md). Não foram implementados endpoints Next.js ou telas de catálogos neste turno; priorizado o fluxo de banco após as respostas. Nenhum commit/push.

## Incremento 3 — telas de cadastros

Commit 335b1e5 confirmado; autenticação validada pelo responsável. Implementadas telas/Server Action de facções, unidades, materiais e modelos, com autorização no servidor. 12 testes, lint, TypeScript, build e bloqueio HTTP sem sessão aprovados. Sem banco/dependências alterados. [Arquivos, limites de validação e checkpoint](telas-cadastros.md).

## Incremento 4 — pedidos e movimentos na interface

Commit cb380b8 verificado e árvore inicialmente limpa. Implementadas telas/Server Action de pedidos, estoque de materiais/bolsas, entregas, recebimentos, histórico e estorno. 17 testes, lint, TypeScript, build, teste HTTP de dez rotas e regressão SQL com rollback aprovados. Sem alteração estrutural no banco. [Contrato, limites de teste e checkpoint](telas-operacoes.md). Nenhum commit/push.
