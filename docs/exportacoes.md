# Exportações — incremento 6

## Escopo e diagnóstico

Aprovado pelo responsável em 25/10/2026: romaneio PDF por operação com pedido/facção/data/itens e extrato CSV por período/pedido/facção. Base Git e978213, árvore inicialmente limpa. Inspecionados contrato, migrações existentes e avisos de segurança antes da nova migração. Projeto exclusivo BagSync (ppgeveafuhgoymtvvrya); empresa, usuário, senha e vínculo preservados.

## Uso

- /painel/exportacoes oferece extrato CSV com filtros opcionais de datas, pedido e facção.
- Histórico global e do pedido oferecem Baixar romaneio PDF por operação.
- Downloads via sessão real; Gerente Logístico, Motorista e Gestor podem exportar os registros que já podem consultar na própria empresa. Exportar não altera dados.
- Romaneio informa empresa, tipo, referência, data de Brasília, pedido/facção quando aplicáveis, situação de estorno, itens, unidades, quantidades assinadas, observação e avisos do lançamento. Entrada de material sem pedido/facção mostra Não se aplica.
- Documento reemitido usa nomes atuais dos cadastros e situação atual do estorno; não é snapshot histórico dos nomes. Quantidades vêm do histórico imutável.
- CSV inclui uma linha por item, repetindo contexto da operação. Mantém original e estorno como registros distintos; não é relatório de saldo. Sem resultados, entrega cabeçalho em arquivo válido.

## Segurança e precisão

Route Handlers validam usuário no Auth, vínculo e perfil antes de consultar/gerar. Sem sessão: 401; sem vínculo: 403; filtro inválido: 400; operação não encontrada/inacessível: 404; falha de consulta: 503. Sem retornar nomes ou dados de outra empresa. Erros aparecem na interface; não são entregues arquivos parciais como sucesso.

Headers: private/no-store, Vary Cookie e nosniff. Chave administrativa não usada. Nome de arquivo é fixo ou formado por UUID validado, sem campos livres no header. Downloads não têm URLs públicas persistentes.

CSV UTF-8 com BOM, delimitador ponto e vírgula, CRLF e campos entre aspas. Aspas internas duplicadas, quebra de linha preservada. Textos com início de fórmula são prefixados por apóstrofo para proteção em planilhas. Quantidade numérica vem do banco como texto exato, validada e convertida para vírgula decimal sem Number/parseFloat, incluindo negativos. Os bytes preservam a precisão; planilhas podem converter/limitar dígitos ao abrir CSV, então importar a coluna como texto quando houver alta precisão.

Datas inicial/final são dias inclusivos em Brasília (UTC-3); consulta aplica início inclusivo e meia-noite seguinte exclusiva. Rejeita datas impossíveis, início depois do fim, UUIDs inválidos, parâmetros desconhecidos e filtros repetidos.

## Snapshot e limites

Migração nova 20261025233431_exportacoes_consulta.sql cria índice por empresa/data/id e RPC export_inventory_operations. SQL STABLE/SECURITY INVOKER, search_path vazio, EXECUTE somente para authenticated. RLS continua sendo a autorização; função não eleva privilégios. Dados, nomes, itens e status são reunidos em um único statement/snapshot, evitando combinar páginas REST obtidas em momentos diferentes.

Limites técnicos explícitos: 10.000 operações ou 50.000 itens por exportação; excesso retorna too_large sem dados parciais e o endpoint responde 413 para reduzir filtros. Saída gerada também limitada a 20 MiB por arquivo. Esses limites não são regras de estoque e podem ser revistos após teste de capacidade. Não foi realizado teste de carga/memória/concorrência da exportação.

## PDF e dependências

PDFKit 0.20.2 no backend Node, tipos 0.17.7. A stack TypeScript foi preservada; Python/Poppler usados apenas na QA, não na produção. Noto Sans Latin regular/negrito WOFF incorporadas com licença SIL OFL e origem @fontsource/noto-sans 5.3.0. Pacote de fontes removido após copiar assets licenciados; não é dependência de runtime. Assets/versionamento em src/assets/fonts/.

next.config.ts externaliza PDFKit e inclui fontes no tracing de produção. Verificado que ambas constam do trace do download. tsconfig permite imports explícitos .ts com noEmit para testes nativos do Node. Runtime Node padrão mantido: configuração explícita runtime foi rejeitada pelo Cache Components e removida antes do build aprovado. Fontes locais evitam downloads externos para gerar o PDF; build do layout ainda pode consultar fontes Google existentes.

Formato A4, texto com quebra automática, margens, cabeçalho, rodapés numerados, quantidade exata e indicação de original estornado. Não acrescenta assinatura, campos ou exigências de negócio não aprovadas.

## Arquivos

- supabase/migrations/20261025233431_exportacoes_consulta.sql e supabase/tests/exportacoes.sql.
- src/lib/exports/{types,core,access,pdf}.ts.
- src/app/painel/exportacoes/: página, filtros, download client e endpoints CSV/PDF.
- src/app/painel/operacoes/history.tsx e layout.tsx: links/botões.
- src/assets/fonts/: dois assets WOFF, licença e proveniência.
- package.json/lockfile, next.config.ts, tsconfig.json e .gitignore.
- tests/export-validation.test.mjs, pdf-export.test.mjs e http-access.mjs.

## Resultados reais

- 24 testes Node passaram, incluindo datas/limites diários, fórmulas CSV, escape, arquivo vazio, precisão e PDF multipágina.
- Suite SQL com fixtures transacionais/rollback: passou antes e depois da aplicação. Inclui três perfis, RLS entre empresas, acesso anônimo/sem identidade, filtros por pedido/facção/operação, intervalo inclusivo/exclusivo, estorno, quantidade textual e limite de 10.001 operações sem resultado truncado. Não exercitado limite de 50.001 itens em fixture.
- PDF de teste local claramente marcado, sem dados de produção: 8 páginas, 90 itens e nota longa. Renderizado por pdftoppm; revisão visual de todas as páginas em contato e primeira página ampliada sem sobreposição/corte. pypdf confirmou 90 nomes, acentos, valor exato e numeração em todas as páginas. Artefatos QA em tmp/pdfs/, ignorados pelo Git.
- npm run lint, tsc --noEmit, build e git diff --check passaram na versão final.
- HTTP: login 200, 12 páginas exigem sessão e os dois downloads retornam 401/JSON sem attachment e com no-store sem sessão. Servidor temporário encerrado.
- Verificação final: uma empresa, um vínculo e perfil gerente_logistico preservados, zero operações persistidas de teste. Nova função confirmada SECURITY INVOKER.
- Instalação reportou zero vulnerabilidades e aviso de script unrs-resolver pendente; não liberado indiscriminadamente. Advisories Supabase permanecem os dois avisos das RPCs de escrita e proteção de senha vazada já registrados em pedidos-estoque.md; sem novo aviso de privilégio para a função de exportação.

Limites de validação: não testado download autenticado ponta a ponta no navegador com dados reais, suporte a planilhas específicas, scripts/glyphs fora do latim, carga ou limites de 20 MiB/50 mil itens com fixtures completas. Não coletadas credenciais; autenticação anterior foi validada pelo responsável.

## Checkpoint e continuidade

Revisar download real no histórico e CSV com filtros usando dados reais antes de homologar. Design/navegação e investigação da lentidão continuam adiados pelo responsável. Exportações deste incremento não constituem relatórios financeiros, saída de bolsas para clientes nem encerramento de pedido.

Nenhum commit/push executado. Comandos propostos após revisão:

```powershell
git status --short
git diff --check
git diff
git ls-files --others --exclude-standard
# Ler arquivos novos; tmp/pdfs e .env.local devem continuar ignorados.
git add .gitignore next.config.ts tsconfig.json package.json package-lock.json src/app/painel/exportacoes/ src/app/painel/layout.tsx src/app/painel/operacoes/history.tsx src/assets/fonts/ src/lib/exports/ supabase/migrations/20261025233431_exportacoes_consulta.sql supabase/tests/exportacoes.sql tests/export-validation.test.mjs tests/pdf-export.test.mjs tests/http-access.mjs docs/exportacoes.md docs/desenvolvimento.md docs/arquitetura.md docs/implantacao.md README.md AGENTS.md
git diff --cached
git commit -m "feat: adicionar romaneios PDF e extratos CSV com filtros"
git push origin main
```
