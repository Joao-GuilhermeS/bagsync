# Romaneio A4 de Expedição de Materiais

## Escopo

Layout do PDF da emissão em `/painel/expedicao/[id]/preenchimentos/[submission]/pdf`, também acessível pela rota legada de remessas. Mantido PDFKit, já instalado, e fontes Noto Sans versionadas. Sem dependências novas ou mudanças de banco. Papel A4 retrato; não foi criado formato térmico neste incremento.

## Documento

- Marca da empresa autenticada com o sufixo Produção & Logística. Para a RL Bolsas, o cabeçalho usa RL Bolsas - Produção & Logística; não se fixa a marca de uma empresa para os demais tenants.
- Título ROMANEIO DE EXPEDIÇÃO DE MATERIAIS, UUID completo do romaneio e da remessa, data/hora original da emissão em America/Sao_Paulo.
- Bloco delimitado com nome da facção, telefone, rua, número, complemento, bairro, cidade, UF e CEP, além de pedido, modelo e quantidade de bolsas.
- Tabela de material, unidade, previsto da remessa, enviado nesta emissão e caixa OK/Pendente. Quantidades permanecem textuais e exatas; unidades distintas não são somadas.
- Resposta livre próxima ao item; observações da saída e instruções da remessa em caixa própria; área pautada para notas manuscritas.
- Duas linhas de assinatura, motorista e facção, com data em branco do recebimento. Protocolo permanece junto e aparece só na última página.
- Cores predominantemente cinza/preto, detalhe #1B3B2B, bordas finas e cabeçalho repetido. Tabela e textos longos paginam sem cortar conteúdo.

## Integridade e origem dos dados

O PDF continua representando uma emissão, não o saldo acumulado do kit. Previsto vem do snapshot da remessa; enviado vem da resposta histórica desta emissão. OK significa confirmação do envio informado, inclusive parcial, e não Kit Completo. Traço/vazio ou zero pendente não movimentam estoque. Avisos de estorno e ausência de novo envio continuam destacados.

Telefone/endereço são do cadastro atual da facção, consultado com filtro de empresa e RLS. O rodapé deixa essa origem explícita; não há snapshot histórico desses campos e não foi inventado um.

O autor é o `created_by` da emissão, nunca o usuário que baixa o PDF. O modelo atual não tem nome de operador acessível para esse autor. Nesses casos aparece Nome não cadastrado e seu identificador. O renderizador aceita nome quando houver uma fonte cadastrada, mas este incremento não cria perfis ou nomes fictícios nem acessa a API administrativa de Auth. Disponibilizar nome do operador no cadastro continua pendente de definição.

## Arquivos

- `src/lib/checklists/pdf.ts`: estrutura e desenho A4 com paginação.
- `src/lib/checklists/report.ts`: consulta de contato/endereço e autor; contrato existente preservado.
- `tests/checklist-pdf.test.mjs`: quatro cenários de geração.
- `tests/verify-checklist-pdf.py`: QA opcional com pypdf/pdfplumber, sem dependência de produção.

Há alterações locais prévias em checklist-actions, checklist-form, validação e seus testes/documentação. Foram preservadas; não fazem parte da alteração de layout do PDF.

## Validação

`node --test tests/*.test.mjs`: 75 aprovados. Quatro cenários PDF: curto, contato completo/nome informado, longo com estorno e conferência sem envio. QA com Python confirmou A4, uma página nos dois exemplos curtos, oito no longo, margens, cabeçalhos, assinaturas únicas, contato, fuso, precisão e avisos. PNGs geradas por Poppler e revisadas nas páginas curta e longa (início, meio e fim).

Arquivos de QA em tmp/pdfs/ estão ignorados pelo Git e usam somente fixtures de teste. Nenhuma remessa ou movimento de negócio foi criado, nenhum PDF autenticado real foi emitido e nenhuma impressão física foi executada. Impressão segue o visualizador PDF do navegador; não há impressão silenciosa.

Build Webpack, TypeScript, lint, teste HTTP (35 rotas protegidas, quatro arquivos e histórico negados sem sessão) e git diff --check aprovados. Prévia ilustrativa com dados de teste em output/pdf/romaneio-expedicao-validacao.pdf, sem valor operacional.

## Checkpoint Git

Revisar e versionar apenas os arquivos deste incremento, preservando as mudanças locais prévias:

```powershell
git diff -- src/lib/checklists/pdf.ts src/lib/checklists/report.ts tests/checklist-pdf.test.mjs docs/controle-saida.md
git add src/lib/checklists/pdf.ts src/lib/checklists/report.ts tests/checklist-pdf.test.mjs tests/verify-checklist-pdf.py docs/controle-saida.md docs/romaneio-expedicao-a4.md
git commit -m "Refatora romaneio A4 com destinatário, tabela e protocolo de entrega"
git push
```

O PDF de validação é uma prévia local e não está incluído nesses comandos. Nenhum commit/push foi executado pelo agente.
