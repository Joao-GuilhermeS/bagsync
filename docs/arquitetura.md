# Arquitetura

## Observada

- src/app/page.tsx: demonstração do scaffold.
- src/app/layout.tsx: layout, metadados padrão, idioma en e fontes Geist via next/font/google.
- src/app/globals.css: import Tailwind e estilos globais.
- public/: SVGs do scaffold.
- next.config.ts: cacheComponents, partialPrefetching e @tailwindcss/turbopack declarados; compatibilidade pendente.
- tsconfig.json: strict habilitado e alias @/* para src/*.
- ESLint e package-lock.json presentes.

## Direção definida

Next.js App Router, React e TypeScript; Tailwind e shadcn/ui; backend e autenticação Supabase; PostgreSQL relacional.
Integração Supabase, sessão, autorização, shadcn/ui e schema não implementados. Validar entradas e permissões no servidor; controles visuais não substituem autorização. Políticas RLS devem refletir regras aprovadas.

## Pendências

Confirmar modelo de empresas, vínculos, perfis, fluxos de autenticação, entidades, integrações, capacidade e hospedagem antes de detalhar módulos ou camadas.

## Atualização — requisitos recebidos

Multi-tenancy confirmado, sem filiais, usuário em uma empresa. Três perfis conforme regras-de-negocio.md. Base de autorização tipada iniciada, ainda sem rotas protegidas ou conexão Supabase. Modelo inicial e sequência em modelo-relacional.md e desenvolvimento.md substituem pendências já respondidas acima.

## Integração de autenticação implementada

Sessão Supabase SSR por cookies, renovação em src/proxy.ts, getUser no servidor e vínculo em company_users sob RLS. /painel impede acesso sem sessão; usuário sem vínculo vê acesso pendente. Bibliotecas oficiais fixadas em package.json. Interface PT-BR com Tailwind; shadcn/ui ainda não instalado. Sem cache compartilhado dos dados autenticados. Referência: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs.

## Telas de catálogos

/painel usa layout autenticado e navegação. /painel/cadastros/[catalog] permite somente quatro recursos conhecidos, com consultas SSR e paginação. Server Action aplica validação por campos permitidos, perfil e empresa da sessão antes de gravar sob RLS. Não há API privilegiada ou chave administrativa. [Contrato e verificações](telas-cadastros.md).

## Interface de produção/estoque

Server Components consultam views/tabelas sob sessão/RLS; numeric é selecionado como texto para preservar precisão. Server Action valida por perfil e envia RPC transacional, sem empresa/autor do formulário. Snapshot em memória e chave por intenção preservam retry enquanto o componente permanecer aberto. [Detalhes e limitações](telas-operacoes.md).

## Composição integrada

Nova rota /painel/cadastros/bolsas/[id]/composicao e Server Action usam a tabela bag_materials existente sob RLS. Chave completa em edição/exclusão, quantidade decimal em texto e perfil validado no servidor. Sem alteração estrutural, consumo automático ou snapshot por pedido. [Validação](composicao-bolsas.md).

## Exportações integradas

Downloads Node via Route Handlers com Auth/vínculo validados, sem cache compartilhado e sem service_role. RPC SECURITY INVOKER reúne um snapshot sob RLS; quantidade textual e CSV protegido contra fórmulas. PDFKit com fontes locais licenciadas e tracing explícito. Limites técnicos evitam truncamento silencioso. [Contrato e QA](exportacoes.md).
