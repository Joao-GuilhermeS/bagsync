# Implantação

Nenhuma publicação realizada nesta etapa. Remoto GitHub configurado não comprova sincronização ou implantação.
Hospedagem, projeto Supabase, ambientes, domínio, orçamento, região e responsáveis não definidos. Não há configuração Supabase no código inspecionado.
Antes de publicar: aprovar destino e impacto; definir variáveis por ambiente; validar build, autenticação, autorização e isolamento quando aplicável; definir backups, recuperação, observabilidade e rollback.
Variáveis concretas e comandos serão documentados ao definir integração e destino. Não versionar segredos nem colocar chaves privilegiadas em NEXT_PUBLIC_.

## Projeto Supabase dedicado — 25/10/2026

Criado com autorização do responsável na organização Management System.

- Nome: BagSync.
- Referência: ppgeveafuhgoymtvvrya.
- Região: sa-east-1 (São Paulo). Quixadá–CE é a localização de uso solicitada; não é uma região de hospedagem disponível no conector.
- Estado retornado pela criação: ACTIVE_HEALTHY.
- Dashboard: https://supabase.com/dashboard/project/ppgeveafuhgoymtvvrya
- Management-System-Project não foi alterado.

Somente o projeto foi provisionado; aplicação ainda não conectada, sem migrações aplicadas. Nenhuma chave ou senha foi gravada na documentação. Custo/plano não foi informado pelo retorno da criação; não se presume gratuidade.

## Identidade e autenticação — incremento atual

Migração company_identity aplicada no projeto BagSync (ppgeveafuhgoymtvvrya), versão remota 20261025200948. Arquivo local alinhado ao identificador retornado pelo Supabase. Cria companies/company_users, vínculo único por usuário, três perfis e políticas SELECT restritas ao vínculo. Sem permissões de escrita para anon/authenticated nessas tabelas. Não foram criados dados de empresa ou usuários.

.env.local configurado e ignorado pelo Git, com URL e chave publicável do BagSync; nenhuma chave administrativa usada. .env.example contém somente nomes de variáveis e URL pública. Para outro ambiente, copiar .env.example para .env.local e preencher a chave publicável no dashboard do BagSync.

Provisionamento inicial: criar usuário real no Supabase Auth; criar empresa real via SQL Editor; inserir company_users com o UUID do usuário Auth, UUID da empresa e papel aprovado. Usar parâmetros/valores reais revisados; nunca obter empresa/perfil de user_metadata. Usuários sem vínculo veem acesso pendente. Não há autocadastro nem administração de usuários na aplicação.

Rotas: /login (e-mail/senha), /painel (sessão validada no servidor e vínculo consultado sob RLS), / redireciona para /painel. Logout via Server Action. Proxy renova cookies e marca respostas privadas/no-store. A autorização das futuras operações também deverá ser chamada no servidor e reforçada no banco.

## Migração dos catálogos

20261025202641_catalogos_producao aplicada exclusivamente no BagSync em 25/10/2026. Testada antes em transação revertida e depois de aplicada. Sem dados operacionais persistentes. Consulte catalogos-producao.md para testes/alertas e procedimento de revisão. Migração antiga preservada; nenhuma configuração de Auth ou credencial alterada.

## Pedidos e movimentos

Migração 20261025204641_pedidos_movimentacoes aplicada somente no BagSync. Testada antes/depois com rollback. RPCs create_production_order e register_inventory_operation requerem sessão autenticada, sem chave administrativa no cliente. Views de estoque/progresso sob RLS. [Contrato, alertas e limitações](pedidos-estoque.md). Nenhuma mudança em senha/credenciais/vínculo ou no projeto antigo.

## Exportações

20261025233431_exportacoes_consulta aplicada somente no BagSync; migrações anteriores intactas. Deploy precisa de runtime Node e fontes src/assets/fonts incluídas no tracing (verificado no build). Não depende de Python/Poppler em produção. Dependências: npm ci com lockfile; seguir exportacoes.md para validação dos downloads e limites. Não houve publicação/deploy neste incremento.
