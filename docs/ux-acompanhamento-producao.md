# Acompanhamento de produção — tabela e histórico

## Escopo e aceite

Refinamento visual do detalhe por modelo em `/painel/producao/[bag]`, preservando autorização, RLS, cálculos, filtros GET e paginação de 25 combinações de pedido/facção.

- Cabeçalho compacto com retorno aos modelos e regras em tooltip acessível.
- Filtros por pedido, facção e saldo pendente; Limpar remove os filtros.
- Data Table clara com contato, quantidades exatas, datas em Brasília e ações à direita.
- Facção e ações permanecem fixas durante a rolagem horizontal. No celular, ações usam ícones com nomes acessíveis.
- Histórico em gaveta lateral, consultado ao abrir, com linha do tempo separada por distribuições, recolhimentos e observações. Cada categoria mantém paginação de 25 registros, carregamento, estado vazio e repetição após erro.
- Observações e avisos de excedente/remessas sem saída válida permanecem disponíveis. Recolhimentos estornados continuam identificados.

## Componentes

- `TrackingHeader`: cabeçalho, tooltip e filtros.
- `TrackingTable`: TanStack Table e primitivas de tabela do projeto, sem paginação duplicada no cliente.
- `ProductionDetails`: consulta autenticada existente e apresentação do histórico.
- `FormDrawer`: dialog nativo modal já utilizado no projeto, agora com ícone e callbacks opcionais. Escape fecha e o navegador restaura o foco.
- `InfoTooltip`: abertura por foco, mouse ou clique, fechamento por Escape ou interação externa.

Não foram instaladas dependências nem alterados schema, RPCs ou políticas. Os dados de contato são consultados com filtro explícito de empresa, além da RLS existente.

## Regras preservadas

A primeira saída válida distribui a quantidade da remessa uma única vez. Complementos não duplicam a quantidade e estornos continuam considerados. O badge Concluído indica somente saldo pendente zerado: não encerra o pedido e não inclui remessas sem saída válida. Quantidades permanecem textuais, sem conversão para ponto flutuante.

## Validação

Resultados técnicos e limites da validação visual registrados no checkpoint deste incremento. A prévia isolada não grava observações nem substitui o teste autenticado de escrita no ambiente real.

### Resultados em 29/10/2026

- `npm run lint`: aprovado.
- `node --test tests/*.test.mjs`: 70 testes aprovados.
- `npx next build --webpack`: aprovado, incluindo TypeScript. A primeira execução foi bloqueada por permissão em `.next`; repetição autorizada concluída.
- `node tests/http-access.mjs`: aprovado; login 200, 33 rotas protegidas, quatro arquivos e histórico negados sem sessão. Foi necessária execução autorizada para conexão local.
- Playwright/Edge: prévia isolada dos componentes reais em 1366×768 e 375×812, com snapshot de dados existentes. Histórico carregou distribuições, recolhimentos e observações; tooltip acessível por foco e fechado por Escape. Gaveta e formulário de observação inspecionados no celular, sem submissão.
- Em 375px, documento sem overflow horizontal; com tabela rolada 400px, facção permaneceu em x=17 e ações até x=358. A rolagem fica restrita ao contêiner.
- Não foi executada gravação autenticada de observação neste incremento. Filtros/paginação mantêm o contrato GET existente; a prévia isolada não executa consultas autenticadas de navegação.
