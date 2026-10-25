# Requisitos confirmados — 25/10/2026

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
