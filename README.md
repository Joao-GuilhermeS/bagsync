# BagSync

SaaS para gestão de empresa de bolsas, em levantamento de requisitos. Login Supabase e base de empresas/perfis implementados; módulos operacionais ainda não integrados.

## Estado em 25/10/2026

A raiz Git é `Projeto_RL/bagsync`. Remoto: https://github.com/Joao-GuilhermeS/bagsync.
Base Next.js App Router em src/app/, com página de demonstração.
Stack definida: TypeScript, Next.js, React, Tailwind CSS, shadcn/ui, PostgreSQL, Supabase Auth/backend, npm, Git/GitHub e Markdown.
Declarados: Next.js 16.4.3, React/React DOM 19.3.0, Tailwind 4, TypeScript 5 e ESLint 9. Estabilidade e compatibilidade ainda não verificadas. Supabase SSR integrado; shadcn/ui ainda não instalado.

## Ambiente e execução

Observados Node.js 24.19.0 e npm 11.17.0; versões mínimas suportadas pendentes. package-lock.json e node_modules presentes.
Após validar versões e autorizar instalação em novo ambiente, executar `npm ci` na raiz bagsync/. Para desenvolvimento: `npm run dev`, acesso http://localhost:3000.
Scripts existentes: `npm run lint`, `npm run build` e `npm start` (após build). Teste da autorização: `node --test tests/authorization.test.mjs` (Node 24 observado). Fontes Google via next/font podem exigir rede durante build.
Nunca versionar segredos ou expor chaves privilegiadas no navegador.

## Documentação

- [Requisitos e levantamento](docs/requisitos.md)
- [Regras de negócio](docs/regras-de-negocio.md)
- [Arquitetura](docs/arquitetura.md)
- [Modelo relacional](docs/modelo-relacional.md)
- [Sequência de desenvolvimento](docs/desenvolvimento.md)
- [Decisões técnicas](docs/decisoes-tecnicas.md)
- [Implantação](docs/implantacao.md)
- [Diagnóstico e checkpoint](docs/diagnostico-inicial.md)
- [Instruções do Codex](AGENTS.md)

Configuração atual do ambiente e limitações de validação em [implantação](docs/implantacao.md) e [desenvolvimento](docs/desenvolvimento.md). /login permite acesso de usuários provisionados; /painel exige sessão e consulta o vínculo real. Build de produção validado após configuração PostCSS; login com senha e validação visual ainda pendentes.


## Banco de catálogos

Facções/costureiras, unidades de medida, materiais, modelos de bolsa e composição opcional implementados no banco com RLS. [Dicionário, permissões, testes e checkpoint](docs/catalogos-producao.md). Telas de cadastro, pedidos e movimentações de estoque ainda pendentes.

## Pedidos e estoque

Banco implementado com pedidos de um modelo por operação de produção, entregas/recebimentos em várias facções, entradas de materiais, estornos e saldos derivados do histórico. [RPCs, permissões, testes e checkpoint](docs/pedidos-estoque.md). Telas operacionais e login com senha ainda pendentes; consultas/gravações do banco já têm contrato disponível.

## Cadastros na aplicação

Após login, o painel oferece facções, unidades, materiais e modelos de bolsas. Gerente Logístico cadastra/edita/exclui; Motorista e Gestor consultam. [Telas, validação e checkpoint](docs/telas-cadastros.md). Autenticação confirmada pelo responsável; teste completo das novas telas ainda pendente. Composição, pedidos e movimentos ainda não têm interface.
