
# Instruções do projeto

## Stack
- TypeScript, Next.js App Router e React.
- Tailwind CSS e shadcn/ui.
- PostgreSQL e Supabase.
- Git e GitHub.
- Documentação em Markdown.

## Regras de desenvolvimento
- Ler a documentação e inspecionar o código antes de alterar arquivos.
- Não presumir requisitos ou regras de negócio.
- Não implementar funcionalidades sem escopo e critérios de aceite.
- Preferir soluções simples, tipadas e reutilizáveis.
- Evitar dependências desnecessárias.
- Projetar a interface para desktop, tablet e celular.
- Validar entradas e permissões no servidor.
- Nunca expor segredos ou chaves privadas no frontend.
- Versionar alterações do banco por migrações SQL.
- Não executar operações destrutivas sem autorização.

## Processo
- Trabalhar em incrementos verificáveis, sem gerar backlog ou sprints, conforme orientação atual do responsável.
- Definir objetivo, escopo, critérios de aceite e Definition of Done.
- Executar verificações técnicas antes de concluir cada tarefa.
- Atualizar a documentação afetada.
- Informar arquivos alterados, testes executados e pendências.
- Não afirmar que testes passaram sem executá-los.
- Solicitar aprovação antes de decisões de negócio não definidas.
- Sinalizar checkpoints de Git ao concluir marcos relevantes.

## Documentação
Manter atualizados README.md e os documentos de requisitos,
regras de negócio, arquitetura, modelo relacional e desenvolvimento
em docs/, conforme o projeto evoluir.

## Escopo inicial
Preparar a estrutura e a documentação. Não desenvolver
módulos operacionais antes da definição dos requisitos.

## Continuidade e aprovações
- A raiz Git é bagsync/. Separar fatos observados, requisitos confirmados e propostas.
- O responsável autorizou iniciar desenvolvimento com os requisitos confirmados; esclarecer somente regras ainda indefinidas.
- Avaliar impacto e obter autorização quando necessária antes de instalar dependências, executar migrações destrutivas ou publicar alterações externas.
- Não alterar regras aprovadas sem autorização e não criar dados fictícios.
- Agrupar mudanças coerentes; apresentar comandos de revisão, commit e push nos checkpoints, sem executá-los automaticamente.
- Verificar versões estáveis/compatíveis em fontes oficiais antes de mudar dependências; preservar lockfile.
- Multi-tenancy confirmado: empresas independentes sem filiais; usuário em uma única empresa. Perfis e permissões em docs/regras-de-negocio.md.
- Aplicar RLS nas tabelas expostas com políticas baseadas nas regras aprovadas; testar acesso indevido e isolamento quando aplicável.
- Nunca expor chaves secretas/service_role no frontend; validar dados e autorização no servidor.
- Versionar SQL em supabase/migrations/ após aprovação do modelo; não executar migrações remotas automaticamente.
- Cada incremento deve registrar escopo, aceite, validação real e arquivos/resultados.

## Supabase e movimentos — confirmação atual
- Criar ambiente dedicado BagSync; nunca alterar o projeto Management-System-Project (eedbrqevettzscrjnexx).
- Materiais admitem unidades diversas; saldo negativo é permitido com aviso.
- Bolsas recebidas abatem um pedido específico; recebimentos parciais são permitidos.

- Projeto Supabase dedicado criado: BagSync, ref ppgeveafuhgoymtvvrya, região sa-east-1. Usar somente esse destino em operações do BagSync; projeto antigo permanece proibido.

## Catálogos implementados
- Caminho confirmado pelo responsável: C:/Users/joaog/Projeto_RL/bagsync; não migrar/copiar para o caminho inexistente sem solicitação.
- Incremento de banco autorizado: workshops, measurement_units, materials, bags e bag_materials; detalhes em docs/catalogos-producao.md.
- Não modificar migrations aplicadas. Gerar novas via CLI. Testes SQL de integração usam BEGIN/ROLLBACK e não podem deixar fixtures ou mudanças de perfil persistentes.
- Composição não implica consumo automático de estoque. Pedidos/movimentos precisam de transações e idempotência quando forem implementados.

## Pedidos e estoque implementados
- Pedidos com um modelo, várias facções; excedente permitido com aviso; correções por estorno e novo lançamento. Contrato em docs/pedidos-estoque.md.
- Usar RPCs create_production_order/register_inventory_operation com sessão real, chave de idempotência e corpo preservados no retry.
- Não liberar escrita direta no histórico; funções SECURITY DEFINER exigem validação de identidade/empresa/perfil, search_path vazio e grants explícitos.
- Avisos de saldo negativo e excedente devem aparecer na futura interface. Não consumir material pela composição automaticamente.

## Interface dos cadastros
- Autenticação com senha foi validada pelo responsável em 25/10/2026; não pedir nem registrar senha.
- Rotas de catálogos em /painel/cadastros/[catalog], com ações no servidor e RLS. Não confiar somente na proteção do layout ou ocultação de controles.
- Apresentar checkpoint Git com mensagem sugerida ao concluir incrementos validados, conforme pedido do responsável. Distinguir testes executados pelo agente de validação relatada pelo usuário.

## Interface de pedidos/estoque
- Rotas e limites em docs/telas-operacoes.md; não converter numeric para Number/parseFloat.
- Manter chave e payload originais em retry de resultado incerto; somente nova intenção deve gerar chave nova. Snapshot atual não é persistente após recarregamento; não prometer operação offline.
- Revalidar painel após sucesso; nunca esconder avisos de saldo negativo/excedente.

## Prioridade e composição
- Em 27/10/2026, o responsável autorizou reorganizar interface/navegação, substituindo a orientação anterior de adiar refinamento visual. Seguir docs/interface-navegacao.md e design-system/bagsync/MASTER.md; não afirmar otimização ou diagnóstico de desempenho sem medição.
- Composição integrada: docs/composicao-bolsas.md. Não cria baixa/reserva automática nem snapshot histórico por pedido.
- Exportações aprovadas para próximo incremento: PDF por operação e extratos CSV com período/pedido/facção; docs/exportacoes.md.

## Exportações implementadas
- PDF por operação e extrato CSV em /painel/exportacoes; contrato e limites em docs/exportacoes.md.
- export_inventory_operations é somente leitura/SECURITY INVOKER; preservar RLS e snapshot único.
- Não remover proteção contra fórmulas CSV, precisão textual, validação de filtros nem headers no-store.
- Assets Noto Sans e licença são versionados; PDFs de QA em tmp/pdfs/ são ignorados, sem dados reais.

## Feedback do cliente em 26/10/2026
- Ler docs/adaptacao-kits-rotas.md antes de adaptar kits/rotas.
- Não criar entidade de lotes nem acesso para facções. Gestor pode atribuir rotas como exceção específica, sem CRUD geral.
- Checklist predefinido por modelo, previstos manuais por remessa e PDF imprimível. Não calcular automaticamente composição vezes quantidade.
- Traço na ficha significa material não enviado e pendente, mantendo o kit incompleto (confirmado em 26/10/2026). Não cadastrar dados manuscritos da fotografia como registros reais.

## Checklist de modelos
- Tela /painel/cadastros/bolsas/[id]/checklist; contrato em docs/tela-checklist.md. Alteração somente pelo gerente, com autorização no servidor e RLS.
- Configuração do checklist não movimenta estoque nem reescreve snapshots de remessas existentes. Não confundir com composição quantitativa.
- Responsável solicita questionário agrupado quando surgirem dúvidas de funcionamento ou relacionamentos; não presumir regras ainda indefinidas.
- Telas de criação/consulta de remessas: docs/telas-remessas.md. Criação é previsão, sem baixa de estoque; preservar chave e payload nos retries incertos. Tipos e respostas do checklist aplicados no BagSync em 26/10/2026.
- Correção explícita do responsável: município é o nome do modelo de bolsa. Padronizar por modelo; não criar município atendido como entidade/campo separado. Navegação do entregador: todos os modelos → facção cadastrada → entrega/recebimento, mantendo pedido específico. Não alterar nomes existentes automaticamente.
- Acompanhamento de produção implementado: /painel/producao; contrato em docs/tela-acompanhamento.md. Quantidade distribuída conta na primeira saída válida de material, uma vez por remessa; não duplicar complementos nem junções entre entregas/recolhimentos/notas.
- Observações de produção pelos três perfis usam permissão específica e RPC add_production_note, com idempotência e histórico imutável. Não liberar ao Gestor escrita de estoque/cadastros/saídas. Migração 20261026194930 aplicada somente no BagSync.

## Controle de saída implementado
- Contrato em docs/controle-saida.md. Entregador usa remessa preparada para preencher checklist; recolhimento de bolsas permanece uma operação independente, vinculada a pedido/facção.
- Gravar respostas/saída por submit_shipment_checklist; não interpretar texto livre como quantidade nem criar baixa duplicada. Não enviado não movimenta estoque; ✓ usa saldo calculado no servidor.
- Preservar histórico imutável de preenchimentos e estornos. PDF corresponde a um preenchimento, não ao saldo cumulativo; marcar envio estornado e não prometer impressão silenciosa.
- Migrações 20261026191246 e 20261026191312 aplicadas somente no BagSync. Tipos legados nulos não devem ser inferidos a partir de templates atuais.

## Expedição e entregas — atualização em 27/10/2026
- Ler docs/expedicao-entregas.md. Esta confirmação substitui o preenchimento da saída pelo motorista: Gerente Logístico emite pela Expedição, com baixa de estoque; motorista confirma recebimento na facção sem nova baixa e continua recolhendo bolsas.
- Unidades são predefinidas e somente leitura no aplicativo. Não reintroduzir CRUD/aba de medidas. Preservar IDs legados e não presumir conversões para rolos/caixas/pacotes.
- Checklist por modelo mantém escolha por item entre caixa OK e texto livre; unidade vem do material, e texto não substitui quantidade numérica.
- Facções têm documento genérico, telefone e endereço opcionais. Não presumir tipo/unicidade do documento ou tornar campos novos obrigatórios sem confirmação. Município físico do endereço não é o modelo da produção.
- Confirmar entrega somente via confirm_shipment_delivery; usar request_key/payload preservados em retry incerto. shipment_delivery_confirmations é imutável e não gera movimentos de estoque.
- Caminhos canônicos /painel/expedicao e /painel/entregas; remessas permanece compatível com links antigos. Tipos/ações/SQL devem negar baixa de materiais ao motorista, preservando bag_receipt.
- Migrações 20261027184848, 20261027185253 e 20261027190254 aplicadas apenas no BagSync; não reescrever as já aplicadas.

## Dashboard — 28/10/2026
- Visão geral usa quantitativos por modelo, pesquisa por nome e gráfico interativo; contrato em docs/dashboard-visao-geral.md. Preservar abaixo dele Onde você quer começar, Acesso rápido e Recolhimentos recentes.
- Em pedido = previsto por pedido, contado uma vez; em produção = saldo restante por pedido/facção; prontas = recolhidas válidas. Reutilizar production_tracking para estornos/complementos; não somar total pedido às demais categorias nem limitar excedentes.
- Agregação exata com BigInt/strings, sem Number para quantitativos. Filtros locais por nome/ID não substituem autorização/RLS; consultas autenticadas e restritas à empresa.
- Refatoração atual usa Recharts 3.10.1/react-is 19.3.0: filtros unificados com busca interna, KPIs clicáveis, tooltip e percentual, grid inferior em três blocos. Biblioteca recebe somente geometria limitada; eixos/tooltip mantêm valores exatos. Respeitar movimento reduzido e tabela acessível. Contrato atualizado em docs/dashboard-visao-geral.md.

## UX da Expedição — 28/10/2026
- Contrato em docs/ux-expedicao.md: cards filtráveis, stepper de três etapas, ChecklistItem compartilhado e cards de entrega na tela do motorista. Em Trânsito é agrupamento visual de a_entregar, independente de kit incompleto.
- saveExpedition orquestra criação e emissão em duas RPCs transacionais distintas; não afirmar atomicidade do conjunto. Preservar duas chaves distintas e payload em repetição incerta. Previsão pode persistir se emissão falhar; memória local não sobrevive a recarga.
- Salvar previsão não salva respostas locais nem movimenta estoque. Emissão efetiva libera card; confirmação não baixa novamente. Sem novas migrations ou dependências neste incremento.

## Layout e carregamento — 28/10/2026
- Responsável confirmou aplicar somente visual e organização do novo prompt: preservar BagSync, perfis, métricas e Expedição de materiais. Não criar vendas, pagamentos, qualidade, lotes ou novos estados sem requisitos.
- Seguir docs/ux-layout-carregamento.md e MASTER atualizado: esmeralda #00875A, fundo #F8FAFC, Inter, sidebar branca. LayoutShell mantém alias AppShell; rotas canônicas continuam sob /painel.
- Skeletons reutilizáveis, PendingButton com name/value preservados e template de entrada respeitam movimento reduzido. Não impor atrasos artificiais nem afirmar CLS/desempenho medidos sem evidência.

## Tabela de estoque — 29/10/2026
- Contrato em docs/estoque-data-table.md. StockTable segue estrutura shadcn/ui com TanStack React Table 9.3.1; comparação de saldos exata com BigInt, sem somar unidades diferentes. Saldo zero neutro; negativo permitido e sinalizado.
- Busca/filtros/ordenação precedem paginação local de 10. Consultas paginadas estáveis carregam a empresa inteira; não ordenar somente uma página arbitrária por ID. Layout escuro verde solicitado aplica-se apenas ao estoque.
- Entrada rápida preenche material, sem alterar validação/RPC/permissão. Histórico por material/bolsa filtra operações via movimentos associados, preservando lançamentos e estornos completos. Não expor dados de outra empresa nem gravar ao abrir ações.

## Prazos de produção — 29/10/2026
- Ler docs/prazos-producao.md. Prazo obrigatório em novas remessas; legados sem data. Dias corridos/Brasília; atenção hoje, amanhã e em dois dias; somente Gerente define/prorroga com motivo e histórico.
- Novos bag_receipt exigem p_kit_id da remessa correta com saída válida. Parciais/estornos/excessos conciliam a remessa sem mudar o razão existente. Não ratear recolhimentos históricos sem vínculo.
- Migration 20261029140127 aplicada com autorização somente no BagSync. Corpos v1 privados não são APIs para novos lançamentos; não restaurar grants nem contornar wrappers públicos. Replay de criação confere prazo inicial, não o prorrogado.
- PGlite em tmp/deadline-db é ferramenta opcional de teste, ignorada pelo Git, sem dependência do aplicativo. Nove suítes SQL locais e remotas com rollback; nunca versionar fixtures de teste como registros de negócio.

## Visão geral compacta — 29/10/2026
- Solicitação atual substitui a preservação do bloco Por Onde Começar: agora três widgets são Acesso Rápido, Alertas & Pendências e Recolhimentos Recentes. Ler docs/dashboard-compacto.md.
- Cabeçalho com filtros e CTA; desktop 65/35 para gráfico e detalhamento. Em tablet/mobile empilhar. Não cortar dados nem bloquear rolagem para caber artificialmente.
- Facções ativas: IDs distintos com saldo pendente nos modelos filtrados. Alertas reais de production_deadlines e shipment_kit_status; categorias podem se sobrepor. Recentes são os três últimos da empresa, identificados como globais.
- /painel/visao-geral é alias autenticado de /painel. Preservar agregação exata e regras de pedidos/produção/recolhimento. Sem novas dependências ou migrations.
