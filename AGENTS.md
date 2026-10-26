
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
- Responsável orientou adiar refinamento visual/navegação e relatou lentidão sem medição: não afirmar otimização ou diagnóstico de desempenho inexistente.
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
