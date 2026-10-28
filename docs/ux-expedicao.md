# Expedição — interface e integração com o motorista

Atualização: 28/10/2026. Escopo aprovado pelo responsável: reorganizar a Expedição e apresentar entregas emitidas na tela do motorista, preservando os contratos de estoque existentes.

## Fluxo

1. Em `/painel/expedicao`, pesquisar pedido, modelo ou facção e filtrar Pendentes, Em Trânsito ou Entregues. Cards mostram o atendimento do kit, destinatário e acesso a checklist, PDF disponível e histórico.
2. Em Nova Remessa, selecionar pedido/modelo e facção em seletores pesquisáveis.
3. Informar quantidade de bolsas e previstos manuais dos materiais. O checklist vem do modelo: botão OK confirma o previsto integral; parcial usa quantidade numérica; texto livre possui campo numérico separado para a baixa. Não enviado continua pendente. Não multiplicar composição automaticamente.
4. Revisar, adicionar observações e emitir. Também é possível salvar somente a previsão, sem baixa e sem card de entrega. Esse botão não salva as respostas de conferência digitadas localmente.
5. A emissão com saída efetiva disponibiliza PDF e card em Entregas e Recolhimentos. O motorista consulta contatos/endereço e marca como entregue. A confirmação registra histórico, sem nova baixa nem encerramento do pedido de produção.

Em Trânsito agrupa envios emitidos ainda `a_entregar`: não representa rastreamento nem cria um novo estado no banco. Kit incompleto e transporte são dimensões independentes. Complementos podem produzir novos envios; estornos são preservados. A remessa fica em trânsito enquanto existir envio ativo pendente; fica entregue quando todos os envios ativos forem confirmados. Sem envio ativo, fica pendente.

## Componentes e estado

- `components/expedition/expedition-list.tsx`: filtros locais, cards e paginação de 12 itens.
- `components/expedition/remessa-wizard.tsx`: etapas, seleção, quantidade, notas e respostas controladas por ID do template.
- `components/expedition/checklist-item.tsx`: interação OK/parcial/texto reutilizada também no preenchimento de remessa existente.
- `components/ui/search-select.tsx`: busca, teclado, foco e seleção; reutilizado pelo dashboard.
- `components/driver/delivery-card.tsx`: card com endereço, contatos, resumo, PDF/histórico e confirmação autorizada.
- `lib/shipments/expedition.ts`: validação e associação das respostas aos IDs do snapshot persistido; `contact.ts`: links de contato.
- `app/painel/expedicao/actions.ts`: orquestração autenticada no servidor. Caminhos antigos de remessas continuam compatíveis.

Cada resposta local tem `expected`, `mode` (`pending`, `complete`, `partial`), `quantity` e `text`. Quantidades são strings, validadas pelas regras existentes; não converter valores de negócio para Number. Voltar entre etapas preserva respostas; trocar pedido limpa os itens. Inputs visíveis alimentam campos canônicos enviados à action. Skeleton e estados vazios cobrem carregamento e ausência de resultados.

## Persistência e segurança

Somente Gerente Logístico prepara/emite; permissões de confirmação continuam validadas no servidor e nas RPCs. Empresa vem da sessão. Consultas respeitam RLS e filtro de empresa, com paginação estável de 500 registros. A listagem reúne metadados para filtros locais; não constitui busca paginada no servidor nem comprovação de desempenho em alto volume.

Criar previsão e emitir são duas RPCs existentes, cada uma transacional, com duas chaves de idempotência distintas. O conjunto não é uma transação única: se a emissão falhar após criar a previsão, a remessa preparada permanece consultável. O formulário congela o payload e reutiliza as chaves na repetição incerta. Essa retenção é em memória; ao recarregar/sair, consultar o histórico antes de iniciar outra tentativa. Não efetuar baixa manual para compensar resposta incerta.

Sem migrations ou dependências novas neste incremento. Preservadas `create_shipment_kit`, `submit_shipment_checklist`, `confirm_shipment_delivery`, snapshots e estornos. O card aparece nas consultas após emissão; não foi adicionada assinatura Realtime entre dispositivos.

Mapas usam endereço codificado; telefone e WhatsApp usam dígitos validados. Número nacional completo recebe código 55; número local sem DDD não recebe DDD presumido. Links não enviam mensagens automaticamente. Referências: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [WhatsApp click-to-chat](https://faq.whatsapp.com/5913398998672934/?locale=pt_BR).

## Validação do incremento

- 62 testes Node aprovados, incluindo cinco novos testes de parsing, idempotência, associação ao snapshot, estados de transporte e contatos.
- Lint e `npx next build --webpack` aprovados. O comando padrão do projeto continua usando Next/Turbopack; não foi substituído.
- Teste HTTP aprovado: login público, 28 páginas protegidas, quatro arquivos e consulta de histórico negados sem sessão.
- Suíte `supabase/tests/expedicao_entregas.sql` executada no BagSync com rollback: emissão, confirmação sem nova baixa, repetição, estorno, permissões e isolamento.
- Revisão visual em prévia isolada: cards desktop, seleção pesquisável, OK, parcial, texto, avanço/recuo preservando respostas e revisão final mobile. Em viewport de 375 px, largura do documento de 375 px, sem overflow horizontal. Capturas locais em `output/playwright/expedicao-*.png` (ignoradas pelo Git). Não equivale a teste ponta a ponta autenticado.
- Após o rollback, conferência de leitura confirmou o estado preservado: uma remessa preparada, nenhum preenchimento e nenhuma confirmação de entrega persistidos.

Pendências de aceite: emissão e confirmação em navegador com sessão real, card preenchido do motorista e impressão física. Nenhum commit ou push executado pelo agente.
