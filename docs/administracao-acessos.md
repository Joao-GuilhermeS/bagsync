# Administração de contas e permissões — BagSync

## Regras aprovadas em 31/10/2026

- Conta principal RL Bolsas: rlbolsas@gmail.com. Proteção por UUID aeaa0519-cad6-453f-ae6a-0787dd527120 e empresa abd23955-cf67-4354-8d67-ae0b7dbec40f; nunca por e-mail enviado pelo navegador.
- Apenas a principal define limites por perfil. Gestor e Gestor Logístico criam contas e personalizam permissões dentro desses limites. Não podem alterar a principal ou a própria conta.
- Gestor Logístico tem como base todas as operações existentes. Gestor mantém consultas, observações e atribuição de rotas, acrescentando administração limitada de contas. Motorista mantém início, consultas, entregas/recolhimentos e a observação de produção já aprovada anteriormente.
- Cadastro direto na interface: nome, e-mail, senha inicial definida por quem cria, perfil e funcionalidades. Não enviar convite nem exigir confirmação por e-mail. Não alterar senha, vínculo ou credenciais da conta principal.
- Rotas seguem aprovadas como conceito, mas o módulo operacional ainda não existe. A opção é explicitamente identificada como futura; não se afirma funcionalidade implementada.

## Tela e funcionalidades

`/painel/administracao`, último grupo da barra lateral e menu móvel. Principal vê limites e contas; administradores com permissão contas veem a lista e criação/edição, sem configurar limites. Tabela responsiva, gavetas de edição, estados de gravação, seleção por funcionalidade e últimos 20 eventos.

Funcionalidades: início; consultas/relatórios; cadastros/fichas; pedidos; entradas/estornos de estoque; Expedição; motorista; observações; prazos; rotas futuras; contas. As permissões individuais restringem a base aprovada do perfil; não convertem o Gestor em operador de estoque ou Expedição.

Existem dois controles distintos por perfil, exclusivos da principal:

1. Acessos máximos: limitam o que as contas desse perfil utilizam. Reduções afetam acessos existentes imediatamente.
2. O que pode conceder: limite independente de uso operacional, permitindo por exemplo ao Gestor cadastrar um Motorista sem operar entregas pessoalmente. Delegar contas com poder administrativo maior que o do criador é rejeitado, inclusive por uma cadeia de criação de administradores.

Por segurança, o Gestor não recebe um limite de concessão presumido: começa vazio até a principal configurá-lo. Gestor Logístico começa com concessão da base completa aprovada. A principal permanece com acesso integral. A UI informa quando falta configurar a concessão.

Desativar conta remove autorização imediatamente, inclusive para JWT já emitido; não exclui identidade ou histórico. Reativação respeita os limites do administrador. Não há exclusão ou redefinição de senha neste incremento.

## Arquitetura e segurança

- Migration nova `20261031162328_account_permissions.sql`: conta principal, configurações individuais, limites por perfil, eventos imutáveis e solicitações privadas de provisionamento. FKs compostas preservam vínculo usuário/empresa.
- Leitura administrativa apenas por RPC autorizada; sem escrita direta nas tabelas de segurança. Regras operacionais existentes de perfil são preservadas como limite máximo e complementadas pelas funcionalidades atribuídas.
- Server Actions, contexto autenticado, navegação e rotas verificam permissões. Proxy sobrescreve o cabeçalho interno da rota; não aceita a versão fornecida pelo cliente. RPCs de negócio e políticas de catálogo também verificam as funcionalidades.
- Leituras de dados necessários aos módulos atribuídos mantêm isolamento por empresa e bloqueio de conta. Uma permissão de módulo permite consultar os dados necessários a ele, não cria recortes de confidencialidade por pedido/facção. Nenhum recorte desse tipo foi aprovado.
- Autorização vem do banco, sem usar user_metadata ou claims editáveis como fonte de perfil. Mudança de limite não depende de renovar o JWT.
- APIs de exportação/histórico mantêm autorização, no-store e RLS. PDFs operacionais ficam disponíveis para a funcionalidade motorista mesmo sem abrir o módulo geral de relatórios.
- `supabase/functions/create-account`: valida JWT via Auth, prepara e autoriza a tentativa no banco, chama Auth Admin com email_confirm=true e finaliza o vínculo por RPC. Chave service_role somente no runtime da Edge Function, nunca no navegador ou em arquivo versionado.
- Auth e PostgreSQL não formam uma transação única. Se a identidade for criada e o vínculo falhar, ela fica sem acesso empresarial; repetição recupera a identidade da mesma tentativa. A recuperação verifica app_metadata escrita pela API Admin, não user_metadata editável.
- Chaves de idempotência e corpo original preservados no retry incerto. Fingerprint HMAC da senha fica na solicitação privada para impedir alteração silenciosa de credenciais no replay; senha em claro não é persistida, retornada ou registrada em histórico/logs. Rotação da chave administrativa durante uma tentativa pendente pode exigir revisão dessa tentativa.
- Lease de 30 segundos evita processamento simultâneo da mesma tentativa. Fechar/recarregar a aba perde o snapshot local; conferir a lista antes de repetir. Nenhuma operação offline foi implementada.

## Implantação

Migration aplicada e `create-account` publicada com autorização explícita no BagSync ppgeveafuhgoymtvvrya em 31/10/2026. Versão registrada no banco: 20261031162328; nome local alinhado sem alterar o SQL aplicado. A função verifica JWT explicitamente em Auth e todas as gravações voltam a verificar autorização no banco; não depende apenas do filtro do gateway. Usa variáveis padrão SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY do runtime da Edge. Não é preciso adicionar chave administrativa ao Next.js.

O contexto mantém compatibilidade com o banco anterior apenas quando a nova RPC ainda não existe; nesse caso não libera administração e mantém as permissões operacionais antigas. Erros de autenticação/autorização não acionam esse fallback. Publicar interface, migration e função como um incremento coerente.

## Validação

Validação local em 31/10/2026:

- `node --test tests/*.test.mjs`: 80 testes aprovados, incluindo criação administrativa simulada, replay, rejeição de sessão/permissões e validação dos formulários.
- `node tmp/deadline-db/run.mjs`: 15 migrations e 11 suítes SQL aprovadas no PGlite local. Cobrem isolamento, bloqueio, proteção da principal, escrita direta negada e escalada por concessão/cadeia de administradores. Fixtures somente em transação revertida.
- `npm run lint`, `npx next build --webpack` e `git diff --check`: aprovados. Build gerou 40 páginas; avisos de normalização LF/CRLF do Git não são erros de whitespace.
- Playwright em prévia isolada dos componentes reais, sem gravação: desktop 1366×768 e celular 375×812; abertura/fechamento de gavetas, reinício do formulário, senha mascarada e opções fora do perfil desabilitadas. Largura móvel sem overflow da página (375/375).
- Testes HTTP de sessão e rotas protegidas: login 200, 36 rotas protegidas e quatro downloads/históricos negados sem sessão, conforme verificação do incremento.
- Consulta remota somente leitura: uma identidade Auth e um vínculo, principal com UUID/empresa/perfil preservados. Migration aplicada e função create-account versão 1 ACTIVE.

Criação real com senha e login da nova conta ainda precisa de aceite na interface integrada, usando uma pessoa real. Testes de criação usam mocks da API Auth e fixtures SQL com rollback; não criar contas reais fictícias nem enviar e-mails para validar. A prévia visual não comprova integração com Auth remoto.

Referências oficiais: [Auth Admin createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [autenticação de Edge Functions](https://supabase.com/docs/guides/functions/auth).

## Verificação após implantação autorizada

- Onze suítes SQL também aprovadas no Supabase remoto, todas com rollback. As dez suítes operacionais usam agora identidade temporária própria, sem trocar perfil ou vínculo da principal. A primeira execução antiga de checklists foi bloqueada pela nova FK de proteção, antes desse ajuste; não foi uma falha de isolamento do aplicativo.
- Restaram exatamente uma identidade Auth, um vínculo e uma principal; zero solicitações/eventos/usuários de teste persistentes. UUID, empresa e perfil da principal mantidos; get_access_context confirma isPrimary=true e acesso integral.
- POST sem sessão para create-account retornou 401. A função usa verify_jwt=false no gateway porque valida o token explicitamente em Auth antes de processar o formulário; não aceita chamada anônima.
- Advisor revisado: quatro avisos informativos de RLS sem políticas nas tabelas administrativas correspondem ao bloqueio intencional de acesso direto. RPCs SECURITY DEFINER são APIs autorizadas, com search_path vazio e validação interna; não remover grants necessários indiscriminadamente. [Explicação do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Supabase também informa proteção contra senhas vazadas desativada. Configuração Auth não foi alterada neste incremento. [Opção e disponibilidade](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Aplicativo Next.js não foi publicado; código local e documentação prontos para revisão. Sem commit/push executado.

Checkpoint sugerido: revisar git diff e versionar com a mensagem `Implementa administração de contas e permissões com proteção da conta principal`.
