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

Build pode exigir rede para fontes Google. Teste HTTP usa servidor temporário em 127.0.0.1:3101. Suites SQL em supabase/tests/ são administrativas e transacionais com rollback; ler instruções antes de executar, sem concorrer com provisionamento. Estado atual: 69 testes Node, lint, TypeScript/build com Webpack e nove suítes SQL aprovados; 32 páginas protegidas, quatro arquivos e consulta de histórico negados sem sessão. PDFs de QA de uma e 11 páginas foram renderizados e revisados no incremento de saída. Fluxo completo dos formulários autenticados, impressão física, carga e latência permanecem pendentes; revisão visual em prévia isolada registrada na documentação. Não confundir autenticação relatada pelo responsável com testes completos feitos pelo agente.

## Interface atual

Prazos de produção em `/painel/prazos`: data obrigatória em novas remessas, alertas por vencimento e prorrogação justificada pelo Gerente Logístico. Novos recolhimentos escolhem a remessa; parciais e estornos conciliam seu saldo. [Contrato, migration aplicada e validação](docs/prazos-producao.md).

Estoque atualizado em 29/10: Data Table com ordenação A–Z/saldo, busca, status, unidades, entrada rápida e histórico por item. Usa TanStack React Table 9.3.1 e primitivas locais no padrão shadcn/ui. [Contrato e validação](docs/estoque-data-table.md).

Layout atualizado: paleta esmeralda, Inter, navegação clara por função, skeletons e botões com espera estável. [Estrutura e contrato](docs/ux-layout-carregamento.md). Regras existentes preservadas; sem novas dependências ou migrations.

Expedição atualizada em 28/10: cards com filtros, nova remessa em três etapas e cards de confirmação para o motorista. Ver [UX da Expedição](docs/ux-expedicao.md). Sem migrations ou dependências novas neste incremento.

Visão geral atualizada em 28/10: barra de filtros com busca interna por modelo, KPIs clicáveis e gráfico Recharts com tooltip e percentual de conclusão. As seções de orientação, acesso rápido e recolhimentos recentes permanecem abaixo. Ver [dashboard](docs/dashboard-visao-geral.md).

Atualização de 27/10: **Expedição → romaneio/baixa → confirmação da entrega**, com recolhimento de bolsas separado. Materiais usam 17 unidades predefinidas, sem cadastro editável de medidas. Facções incluem documento, telefone e endereço. Contrato e validação em [Expedição e entregas](docs/expedicao-entregas.md).

Menu por função, painel com indicadores reais, navegação mobile e formulários em painéis. Contrato e limites em [Interface e navegação](docs/interface-navegacao.md). Neste checkpoint: 69 testes Node e lint aprovados; build/TypeScript aprovado com `npx next build --webpack`. O build padrão apresentou falha interna de subprocesso do Turbopack, inclusive fora do sandbox; não houve troca permanente do compilador. Prévia isolada revisada no desktop/celular; validação dos formulários com sessão real permanece pendente.

## Documentação

- [Visão geral: requisitos, regras básicas e funcionamento](docs/visao-geral-bagsync.md)
- [Interface e navegação](docs/interface-navegacao.md) e [design system](design-system/bagsync/MASTER.md)
- [Dashboard por modelo na Visão geral](docs/dashboard-visao-geral.md)
- [Expedição, entregas e novos campos de facções](docs/expedicao-entregas.md)

- [Requisitos](docs/requisitos.md) e [regras de negócio](docs/regras-de-negocio.md)
- [Arquitetura](docs/arquitetura.md) e [modelo relacional](docs/modelo-relacional.md)
- [Catálogos](docs/catalogos-producao.md) e [telas de cadastro](docs/telas-cadastros.md)
- [Pedidos/estoque](docs/pedidos-estoque.md) e [telas operacionais](docs/telas-operacoes.md)
- [Composição de bolsas e checkpoint atual](docs/composicao-bolsas.md)
- [Exportações e checkpoint atual](docs/exportacoes.md)
- [Entregador](docs/tela-entregador.md), [remessas](docs/telas-remessas.md) e [controle de saída com checklist/PDF](docs/controle-saida.md)
- [Acompanhamento consolidado da produção e observações](docs/tela-acompanhamento.md)
- [Desenvolvimento](docs/desenvolvimento.md), [decisões técnicas](docs/decisoes-tecnicas.md) e [implantação](docs/implantacao.md)
- [Instruções do Codex](AGENTS.md)

Migrações aplicadas são preservadas. Validar incrementos e apresentar checkpoint antes de commit/push; não executar versionamento automaticamente.
