# Identidade visual do login

Atualização em 02/11/2026. Tela de acesso em duas colunas no desktop: painel escuro com a ilustração fornecida e formulário claro com a marca RL Bolsas. No celular, o formulário e a marca têm prioridade; painel ilustrado oculto. Assets PNG fornecidos pelo responsável, copiados sem alteração para public/images/login e exibidos via next/image com dimensões reservadas e tamanhos responsivos.

Autenticação, campos, validação no servidor e mensagens genéricas preservados. Sem migrations ou novas dependências. O botão de entrada mantém feedback e bloqueio de clique durante a submissão.

Abaixo do formulário: mensagem curta sobre privacidade e direitos previstos na LGPD, sem declarar certificação ou conformidade jurídica avaliada. Não há checkbox de consentimento, aceite de termos ou política de privacidade inventada. Suporte WhatsApp desabilitado e identificado como Em breve, conforme pedido explícito do responsável; o link será definido posteriormente.

Validação em 02/11/2026: npm run lint, npx next build --webpack (40 páginas) e git diff --check aprovados. Teste HTTP: login 200, 36 rotas protegidas, quatro arquivos e histórico negados sem sessão. Playwright no build local: imagens carregadas, senha mascarada, botão WhatsApp desabilitado e mensagem de erro visível. Desktop 1440×900 e celular 375×812 revisados visualmente; sem overflow horizontal nas larguras 320, 375, 768 e 1366. Nenhuma credencial foi enviada e nenhum novo login real foi executado. Sem alteração remota, commit ou push. PDFs comerciais locais existentes preservados; não fazem parte desta alteração.
