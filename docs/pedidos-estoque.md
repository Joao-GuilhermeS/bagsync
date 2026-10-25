# Pedidos e estoque — incremento 2

## Escopo confirmado em 25/10/2026

Responsável confirmou: um modelo de bolsa por pedido, várias facções; recebimentos parciais; excedentes permitidos com aviso; correções por estorno e novo lançamento, preservando o original. Saldo negativo continua permitido com aviso. Não foi aprovada baixa automática por composição.

Banco e RPCs implementados exclusivamente no BagSync (ppgeveafuhgoymtvvrya). Sem novas telas/API Next.js neste incremento. O contrato do backend está disponível pelas RPCs Supabase com sessão do usuário e chave publicável.

## Tabelas

| Tabela | Campos e restrições principais |
| --- | --- |
| production_orders | id UUID PK, company_id FK empresas, request_key UUID, name não vazio, bag_id, expected_quantity numeric positivo/inteiro/finito, created_by FK Auth, created_at timestamptz. UNIQUE(company_id,id) e UNIQUE(company_id,request_key). FK(company_id,bag_id) mantém modelo na mesma empresa. |
| inventory_operations | id UUID PK, company_id, request_key, kind, order_id/workshop_id opcionais por tipo, reversal_of, note, payload JSONB técnico, result JSONB técnico, created_by e created_at. Pedido/facção obrigatórios em entrega e recebimento. UNIQUE(company_id,request_key), UNIQUE(company_id,reversal_of) e FKs compostas. |
| stock_movements | id UUID PK, company_id, operation_id, material_id ou bag_id, unit_id quando material, quantity numeric assinado/finito/não zero, created_at. Bolsa usa quantidade inteira. FKs compostas e um material/modelo por operação sem duplicação. |

Tipos de operação: material_entry (entrada positiva), material_delivery (saída de material para pedido/facção), bag_receipt (entrada de bolsas da facção no pedido), reversal (oposto dos movimentos originais).

Empresa 1:N pedidos; bolsa 1:N pedidos; pedido 1:N operações; facção 1:N operações; operação 1:N movimentos; operação original 0:1 estorno. Isso permite várias facções por pedido sem duplicar o modelo/quantidade prevista. Nenhum rateio de quantidade prevista por facção é imposto; a previsão é global do pedido.

Saldo é a soma dos movimentos do estoque central, por empresa e material/unidade ou modelo. Não é estoque físico individual da facção. Envio de material reduz estoque central; bolsa recebida aumenta estoque central e abate pedido. Sem conversão de material para bolsa. Saída de bolsas para cliente, transporte/roteirização, reservas, custo e financeiro não estão implementados.

A nova UNIQUE(company_id,id,unit_id) em materials permite FK do movimento que preserva a unidade histórica: alterar unidade do material após movimentação é impedido pela integridade referencial. Não é feita conversão automática. Índices por pedido, facção, autor, material/unidade, bolsa e chaves de operação cobrem relacionamentos e consultas.

## RPCs e permissões

| Ação | Gerente Logístico | Motorista | Gestor |
| --- | --- | --- | --- |
| Consultar pedidos, operações, saldos e progresso da própria empresa | Sim | Sim | Sim |
| Criar pedido | Sim | Não | Não |
| Entrada de material | Sim | Não | Não |
| Entrega de material/recebimento de bolsas na facção | Sim | Sim | Não |
| Estornar | Sim | Não | Não |
| Alterar/excluir diretamente histórico ou previsão do pedido | Não | Não | Não |

Pedidos são criados neste incremento; alteração de previsão, cancelamento e encerramento não são expostos ainda. A restrição direta não muda o CRUD dos catálogos. Correções de movimentos seguem a regra aprovada de estorno. Usuário sem vínculo e anônimo não acessam dados/RPCs. Perfil vem de company_users, nunca de user_metadata ou corpo da requisição.

### create_production_order

Parâmetros: p_request_key UUID novo por intenção; p_name texto; p_bag_id UUID da própria empresa; p_expected_quantity numérico inteiro positivo. Retorna {order_id}. Empresa e autor são derivados do vínculo/sessão, não recebidos por parâmetro. Repetir a chave com os mesmos dados retorna o mesmo pedido; dados diferentes são rejeitados.

### register_inventory_operation

Parâmetros: p_request_key UUID obrigatório; p_kind; p_order_id/p_workshop_id quando entrega ou recebimento; p_items JSONB; p_reversal_of apenas para estorno; p_note texto opcional.

- Entrada/entrega: p_items = [{"material_id":"UUID_REAL","quantity":"2.5"}]. Entrada não recebe pedido/facção.
- Recebimento: p_items = [{"quantity":"4"}]. Modelo deriva do pedido; não é aceito modelo enviado pelo cliente.
- Estorno: p_reversal_of = UUID original, p_items = [], sem pedido/facção explícitos. Contexto é copiado do original. Proibidos estorno de estorno e segundo estorno do mesmo original.

Retorno: {operation_id,warnings:[]}. saldo_negativo identifica material/modelo e balance em texto; recebimento_excedente informa received/expected em texto. Avisos não bloqueiam a gravação e precisam ser exibidos pela futura interface. Em repetição idempotente, a resposta original é devolvida, inclusive avisos; consultar as views para o saldo atual. Payload JSONB é identidade técnica da requisição, não uma segunda fonte dos itens operacionais. Mesmo conteúdo com ordem diferente dos itens é considerado outra requisição: reutilizar exatamente a mesma chave/corpo em retry.

Quantidades devem ser transmitidas como texto decimal para evitar perda em JavaScript; SQL armazena numeric exato sem escala fixa. Bolsas e previsão são inteiras. Numeric zero, negativo, infinito e NaN são rejeitados para entrada normal. Movimentos negativos só são gerados pela função conforme o tipo. As views mantêm numeric; futuro cliente deve cuidar da precisão ao consumir REST/JSON.

## Transações, duplicação e segurança

Cada chamada RPC é uma transação: falha em qualquer item desfaz cabeçalho, itens e resultado. Não montar operações com chamadas REST separadas. Chave única por empresa identifica intenção; repetição com payload diferente é erro. UNIQUE de original impede estorno duplicado. Cada movimentação é somente adicionada, sem UPDATE/DELETE pelo usuário da aplicação.

A função interna bagsync_private.lock_company valida auth.uid()/papel e adquire pg_advisory_xact_lock por empresa. Gravações de pedidos e movimentos pela RPC são serializadas por empresa, reduzindo complexidade de concorrência e mantendo cálculo dos avisos após o lançamento. O lock pode limitar vazão em empresas grandes; testar carga antes de otimizar. Não houve teste concorrente simultâneo nesta etapa; validação executada de replay/duplicidade é sequencial. Nenhum controle em memória no frontend é necessário para integridade.

RLS habilitado nas três tabelas e SELECT restrito à empresa do vínculo. authenticated não tem INSERT/UPDATE/DELETE/TRUNCATE nessas tabelas. As duas RPCs públicas usam SECURITY DEFINER deliberadamente para gravar somente pela rotina validada, com search_path vazio, nomes qualificados, sem SQL dinâmico e sem parâmetro de empresa/autor. EXECUTE é revogado de PUBLIC/anon e concedido a authenticated; helper interno sem acesso aos usuários. Não usar service_role no navegador. Esse desenho exige revisar qualquer futura alteração das funções com o mesmo rigor.

## Views

material_stock_balances: empresa, material, unidade, balance e negative_balance.
bag_stock_balances: empresa, modelo, balance e negative_balance.
production_order_progress: empresa/pedido/modelo, expected_quantity, received_quantity, remaining_quantity e excess_receipt. Excedente gera restante negativo, sem ocultar a diferença nem encerrar pedido automaticamente. Estornos entram no somatório assinado.

Todas usam security_invoker=true, respeitando RLS das tabelas-base; somente authenticated possui SELECT.

## Migração, testes e alertas

Migração nova: 20261025204641_pedidos_movimentacoes.sql. Criada pela CLI e versão local alinhada ao registro remoto do conector. Duas migrations anteriores preservadas.

Suíte: supabase/tests/pedidos_movimentacoes.sql. BEGIN/ROLLBACK, fixtures temporárias e identidade SQL simulada do gerente existente; perfis temporariamente alterados dentro da transação e restaurados pelo rollback. Sem identidades Auth novas ou dados permanentes. Não executar simultaneamente ao provisionamento administrativo.

Executada migração completa + suíte em transação revertida; depois aplicada e suíte repetida com sucesso. Testados: criação/replay de pedido; chave divergente; entrada decimal; entrega com saldo negativo e aviso; recebimentos parciais em duas facções; excedente com aviso; estorno de material e bolsas; segundo estorno negado; replay de operação sem duplicação; falha no segundo item sem persistência parcial; facção de outra empresa; bolsa fracionada; escrita direta negada; permissões de motorista/gestor; ausência de identidade e acesso anônimo; views de saldo/progresso; isolamento com operações/movimentos existentes em outra empresa de teste.

Conferência final: empresa/vínculo originais preservados, perfil gerente_logistico, zero pedidos/operações/movimentos persistidos. Oito testes Node passaram, lint, build (inclui TypeScript) e git diff --check passaram. Senha/login real, frontend, concorrência simultânea e carga não testados neste incremento.

Advisors: duas advertências de RPC SECURITY DEFINER executável por authenticated são esperadas neste desenho e revisadas pelas salvaguardas/testes acima: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable. Não alegamos ausência de alertas. Permanece proteção contra senha vazada desativada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. Índices sem uso observado preservados, sem carga representativa: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.

Referência técnica consultada: https://supabase.com/docs/guides/database/functions.

## Checkpoint

Commit base informado pelo usuário e verificado: f28a677; árvore estava limpa. Nenhum commit/push executado neste incremento.

```powershell
git status --short
git diff --check
git diff
git ls-files --others --exclude-standard
# Ler também os arquivos novos.
git add supabase/migrations/20261025204641_pedidos_movimentacoes.sql supabase/tests/pedidos_movimentacoes.sql docs/pedidos-estoque.md docs/regras-de-negocio.md docs/modelo-relacional.md docs/desenvolvimento.md docs/implantacao.md README.md AGENTS.md supabase/migrations/README.md
git diff --cached
git commit -m "feat: implementar pedidos e movimentacoes rastreaveis de estoque"
git push origin main
```

Próximo incremento: backend Next.js e telas de catálogos/pedidos/entregas/recebimentos, consumindo estas RPCs com sessão real e exibindo avisos. Login com senha precisa ser validado pelo responsável, sem compartilhar senha.
