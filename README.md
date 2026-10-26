# BagSync — RL Bolsas

Aplicação SaaS para fabricação e logística de bolsas. Desenvolvimento incremental, com isolamento por empresa e documentação em pt-BR.

## Estado atual — 25/10/2026

- Supabase Auth integrado; autenticação com senha validada pelo responsável.
- Empresas independentes; usuário vinculado a uma empresa. Perfis: Gerente Logístico, Motorista/Entregador e Gestor.
- Cadastros de facções, unidades, materiais e modelos de bolsas; composição opcional por modelo integrada.
- Pedidos simultâneos de um modelo, atendidos por várias facções, usando estoque compartilhado da empresa.
- Entradas/entregas de materiais, recebimentos parciais de bolsas, histórico e estornos via RPCs transacionais/idempotentes.
- Saldo negativo e recebimento excedente permitidos com aviso. Composição não reserva nem baixa estoque.
- Interface funcional básica; refinamento visual/navegação e investigação de lentidão foram adiados pelo responsável.
- Romaneios PDF e extratos CSV implementados sob sessão/RLS; download autenticado real ainda precisa de homologação. Saída para clientes, cancelamento/encerramento de pedidos e retomada offline não implementados.

## Stack e ambiente

TypeScript, Next.js App Router, React, Tailwind, PostgreSQL e Supabase Auth/backend; npm, Git/GitHub e Markdown. shadcn/ui faz parte da stack definida, mas ainda não foi instalado. Versões exatas em package.json/lockfile. Ambiente observado: Node.js 24.19.0 e npm 11.17.0; versão mínima suportada ainda não estabelecida.

Raiz local confirmada: C:/Users/joaog/Projeto_RL/bagsync. Remoto: https://github.com/Joao-GuilhermeS/bagsync.
Projeto Supabase dedicado: BagSync, região São Paulo. Não alterar o projeto antigo.

## Executar

Em novo ambiente, após revisar dependências/configuração:

```powershell
npm ci
Copy-Item .env.example .env.local
# Preencher a chave publicável do BagSync em .env.local.
npm run dev
```

Não sobrescrever .env.local existente. Acesso em http://localhost:3000; usuários/empresas provisionados administrativamente conforme docs/implantacao.md. Nunca enviar senha no chat nem versionar segredos. Não usar chave administrativa no navegador.

## Verificar

```powershell
node --test tests/*.test.mjs
npm run lint
npm run build
node tests/http-access.mjs
```

Build pode exigir rede para fontes Google. Teste HTTP usa servidor temporário em 127.0.0.1:3101. Suites SQL em supabase/tests/ são administrativas e transacionais com rollback; ler instruções antes de executar, sem concorrer com provisionamento. Nesta etapa: 24 testes Node, lint, TypeScript, build, suítes SQL e proteção HTTP de 12 páginas/dois downloads passaram. PDF de QA multipágina renderizado e revisado. Testes visuais, fluxo completo dos formulários autenticados, carga e latência permanecem pendentes. Não confundir autenticação relatada pelo responsável com testes completos feitos pelo agente.

## Documentação

- [Requisitos](docs/requisitos.md) e [regras de negócio](docs/regras-de-negocio.md)
- [Arquitetura](docs/arquitetura.md) e [modelo relacional](docs/modelo-relacional.md)
- [Catálogos](docs/catalogos-producao.md) e [telas de cadastro](docs/telas-cadastros.md)
- [Pedidos/estoque](docs/pedidos-estoque.md) e [telas operacionais](docs/telas-operacoes.md)
- [Composição de bolsas e checkpoint atual](docs/composicao-bolsas.md)
- [Exportações e checkpoint atual](docs/exportacoes.md)
- [Desenvolvimento](docs/desenvolvimento.md), [decisões técnicas](docs/decisoes-tecnicas.md) e [implantação](docs/implantacao.md)
- [Instruções do Codex](AGENTS.md)

Migrações aplicadas são preservadas. Validar incrementos e apresentar checkpoint antes de commit/push; não executar versionamento automaticamente.
