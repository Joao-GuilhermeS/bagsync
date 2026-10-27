# Requisitos confirmados — 25/10/2026

## Atualização — Expedição e entregas (27/10/2026)

Unidades predefinidas e contatos de facções; Expedição emite romaneio e baixa o estoque, seguida de confirmação na facção sem nova baixa. Contrato vigente em [Expedição e entregas](expedicao-entregas.md), que substitui descrições históricas divergentes abaixo.

## Complemento — acompanhamento da produção (26/10/2026)

Acompanhamento com cards de todos os modelos cadastrados. Correção confirmada em 26/10/2026: município é o nome do modelo; padronizar por modelo, sem entidade ou etapa separada de município atendido. Navegação: modelo → facção → entrega/recebimento. Exibir facção/costureiro, quantidade distribuída para fabricação, data de distribuição, quantidades e datas dos recolhimentos e observações. Quantidade distribuída vem da saída/remessa; recolhimentos mostram total e histórico expansível; os três perfis podem registrar observações específicas deste acompanhamento. [Confirmações e limites](acompanhamento-producao.md). Preservar pedidos simultâneos, recebimentos parciais e estornos; não confundir modelo com endereço da facção.

Fonte: respostas fornecidas pelo responsável neste chat. Aprovação de regras e aceite: desenvolvedor.

- Fabricação têxtil de bolsas. Substituir registros em caderno e controlar perdas/faltas de materiais.
- Estoque: entradas e consultas, com páginas separadas para materiais de produção e bolsas acabadas/entregues.
- Produção/facções: identificar materiais enviados a cada costureira e quantidades de bolsas retornadas, conciliando com estoque.
- Logística: transporte de materiais e entrega/recolhimento de bolsas. Motorista acessa perfil da facção, consulta informações e registra entregas/recebimentos.
- Empresas independentes, sem filiais. Cada usuário pertence a uma única empresa. Multi-tenancy confirmado.
- Gerente Logístico: CRUD operacional completo. Motorista/Entregador: consultas e registro de entregas/recebimentos nas facções. Gestores: somente consultas.
- Usuários provisionados inicialmente pelo desenvolvedor no Supabase. Convites por API administrativa/painel são recomendações futuras, não funcionalidades exigidas agora.
- Fluxos e campos ainda generalizados; detalhamento progressivo.
- Sem requisitos adicionais de auditoria, retenção ou recuperação por enquanto. Autenticação e proteção dos dados continuam obrigatórias.
- Sem importações/integrações externas iniciais. Exportar romaneios e/ou extratos de consultas; formato e conteúdo pendentes.
- PT-BR, BRL e horário de Brasília (America/Sao_Paulo).
- Uso simultâneo e responsivo em desktop/tablet/celular; rapidez sem metas numéricas definidas.
- Prazo prioritário, projeto freelancer escalável; orçamento/hospedagem/backup ainda indefinidos.
- Stack do README, Supabase Auth, validação/autorização no servidor, variáveis de ambiente e migrações versionadas mantidos.

## Pendências para movimentos

Unidades e precisão das quantidades; saldo negativo; vínculo entre remessas e retornos parciais; campos mínimos da facção/material/bolsa; correção/exclusão de movimentos já conciliados; conteúdo/formato das exportações. Não presumir ficha técnica, consumo automático, perdas ou cálculo de produção esperada.

## Respostas complementares — 25/10/2026

Unidades diversas (metro, unidade, kg etc.); saldo negativo autorizado com aviso. Recebimentos de bolsas vinculados a pedido específico, com abatimento e retornos parciais. Criar projeto Supabase BagSync separado; preservar integralmente Management-System-Project.
As pendências anteriores de saldo negativo e recebimento parcial estão resolvidas. Precisão/conversões, múltiplos modelos por pedido e excesso de recebimento continuam pendentes.

## Confirmação de exportações e prioridade — 25/10/2026

Responsável aprovou romaneio PDF por operação (pedido, facção, data, itens) e extratos CSV filtrados por período/pedido/facção. [Escopo](exportacoes.md). Pediu adiar refinamento visual/navegação, relatando lentidão ainda não medida; seguir primeiro com funcionalidades. Composição de modelos agora integrada na aplicação; não gera baixa automática.

## Feedback do cliente — 26/10/2026

Novos requisitos e esclarecimentos consolidados em [adaptação de kits e rotas](adaptacao-kits-rotas.md): checklist predefinido por modelo, quantidades previstas manuais, remessa incompleta com pendências, PDF imprimível, contato/endereço da facção e rotas móveis. Não criar cadastro de lotes; facção sem acesso. Gerente Logístico e Gestor poderão atribuir rotas, sem ampliar as demais permissões do Gestor. Traço na ficha significa material não enviado e pendente, mantendo o kit incompleto (confirmado pelo responsável em 26/10/2026).
