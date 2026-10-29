# Layout, navegação e carregamento — 28/10/2026

## Escopo e aceite

O responsável confirmou que o prompt orienta apenas visual e organização das funções existentes. Mantidos BagSync, perfis atuais, URLs sob `/painel`, métricas aprovadas e Expedição como saída de materiais para facções. Não foram criados lotes, vendas, qualidade, precificação, pagamentos ou estados de corte/inspeção.

Critérios: paleta e tipografia solicitadas, navegação categorizada, empresa/perfil visíveis, atalho funcional para novo pedido autorizado, skeletons estruturais, transição de conteúdo e feedback de espera sem alterar contratos de envio. Aceite técnico exige lint/build/testes e revisão visual; revisão isolada não substitui validação autenticada.

## Navegação

| Grupo | Funções existentes |
| --- | --- |
| Principal | Visão geral, pedidos de produção |
| Produção e facções | Acompanhamento da produção |
| Materiais e logística | Estoque de materiais, Expedição, entregas de materiais, entregas e recolhimentos |
| Produto final | Estoque de bolsas prontas |
| Cadastros | Facções e costureiros, modelos e materiais; ficha técnica/checklist dentro do modelo |
| Consultas | Movimentos, relatórios e documentos |

Não foram criadas rotas paralelas a partir dos exemplos do prompt. `/painel/pedidos/novo` é um novo acesso ao formulário de pedido já existente, protegido no servidor. Somente Gerente Logístico vê o atalho no cabeçalho; no celular, ele está no menu completo. Outros perfis continuam consultando os pedidos. Mostrar links de consulta não concede escrita.

## Código modular

- `components/layout/layout-shell.tsx`: sidebar retrátil, menu mobile nativo, cabeçalho e perfil. `app-shell.tsx` conserva a exportação anterior como alias.
- `lib/navigation.ts`: rotas, grupos e resolução da seção por prefixo mais específico.
- `app/painel/template.tsx`: entrada do conteúdo em 240 ms/12 px, sem remontar o shell em cada navegação.
- `components/ui/skeleton.tsx`: Skeleton, LoadingRegion, MetricSkeleton, ChartSkeleton, TableSkeleton, CardsSkeleton e PageSkeleton.
- `components/layout/shell-skeleton.tsx`: estrutura neutra enquanto acesso/empresa são verificados; não exibe identidade presumida.
- `components/dashboard/dashboard-skeleton.tsx`: acompanha filtros, três métricas, gráfico e os três blocos inferiores. O gráfico carregado dinamicamente também reutiliza ChartSkeleton.
- Páginas existentes usam PageSkeleton conforme cards/tabela/formulário. Skeleton de Expedição mantém busca, filtros e cards.
- `components/ui/pending-button.tsx`: recebe pending, pendingLabel e atributos nativos, incluindo name/value. Mantém o rótulo original invisível ocupando espaço e sobrepõe feedback; bloqueia novos cliques enquanto pendente.

Exemplo de composição:

```tsx
<Suspense fallback={<PageSkeleton label="Carregando estoque…" variant="table" />}>
  <ConteudoAutenticado />
</Suspense>

<PendingButton pending={pending} pendingLabel="Salvando…" name="intent" value="emit">
  Emitir romaneio
</PendingButton>
```

Sem temporizador ou espera artificial. Não prometer CLS zero: as dimensões aproximam o conteúdo esperado, mas variam conforme dados e tela. Movimento reduzido é respeitado tanto no CSS quanto no gráfico existente. Cores de status mantêm rótulos textuais. Layout mobile conserva navegação inferior e área segura.

## Contratos preservados

Sem novas dependências, migrations ou alterações no Supabase. Inter usa a integração next/font já existente; seu download ocorre no build. Ícones SVG atuais preservados, sem adicionar lucide-react ou instalar shadcn apenas para este incremento. Ações no servidor, RLS, precisão de quantidades, chaves e payloads de repetição continuam existentes.

O dashboard mantém Em Pedido Geral, Em Produção e Prontas e os três blocos inferiores aprovados. Não reintroduzir os indicadores rejeitados pelo responsável. Expedição continua baixa na emissão; motorista confirma sem nova baixa.

## Validação

- `node --test tests/*.test.mjs`: 62 testes aprovados.
- `npm run lint`: aprovado.
- `npx next build --webpack`: aprovado, TypeScript e 33 páginas geradas. Primeira tentativa no sandbox falhou por DNS de fonts.googleapis.com e permissão na pasta .next; a execução autorizada fora dele passou. Script padrão preservado.
- `node tests/http-access.mjs`: login 200, 29 páginas protegidas, quatro arquivos e histórico negados sem sessão, incluindo a nova rota de pedido.
- `git diff --check`: sem erros; somente avisos de conversão LF/CRLF.
- Prévia isolada no Edge: desktop 1440 px, dashboard mobile 375 px, skeleton tablet 768 px sem overflow horizontal. Fonte computada Inter; cor primária #00875A. Menu mobile fecha por Escape e devolve foco ao acionador.
- Botão de teste antes/depois da espera: 145,890625 × 44 px em ambos, disabled e aria-busy ativos durante a espera. Não foi disparada uma operação real.
- Movimento reduzido emulado e confirmado: animação de entrada e pulse com 0,00001 s, pulse limitado a uma repetição. Capturas locais `output/playwright/layout-*.png` ignoradas pelo Git.

Não houve teste SQL neste incremento exclusivamente visual. Medições de CLS em produção, latência/carga e fluxo completo autenticado permanecem fora da validação isolada. Nenhum commit ou push executado pelo agente.
