# Remessas — criação e acompanhamento de materiais

## Escopo do incremento

Criar remessa por pedido/facção com previsão manual dos materiais e consultar seus saldos. Não concluir saída ou baixar materiais durante a criação. Aceite: autenticação, criação restrita ao gerente, isolamento da empresa, quantidades exatas, retry idempotente e consulta paginada de pendências.

## Fluxo

1. Navegação **Remessas** abre `/painel/remessas`, com 25 registros por página e status do kit.
2. Gerente seleciona **Nova remessa**, escolhe o pedido e continua.
3. `/painel/remessas/nova?pedido=<id>` carrega o checklist ativo do modelo desse pedido, seleciona facção cadastrada e recebe quantidade de bolsas, previsão manual de cada material e anotações gerais.
4. Itens do modelo precisam ter tipo de resposta configurado. A tela orienta voltar ao cadastro se faltar configuração; não calcula composição vezes bolsas.
5. A criação usa `create_shipment_kit`, sem baixa/reserva de estoque. Sucesso abre acesso ao detalhe em `/painel/remessas/[id]`.
6. O detalhe mostra o snapshot do rótulo/unidade e as quantidades previstas, enviadas, pendentes e excedentes. Anotações são apresentadas como texto, sem interpretar HTML. Materiais aparecem paginados, sem misturar unidades.

Os três perfis consultam remessas. Somente gerente acessa a criação e a ação de servidor; RLS/RPC reforçam a permissão. Empresa e autor vêm da sessão. ID inexistente ou de outra empresa retorna página não encontrada. Não há edição de histórico nesta entrega.

## Precisão e repetição segura

Validação mantém quantidades decimais como strings. Quantidade de bolsas é inteira positiva; materiais exigem previsão positiva; itens repetidos/referências inválidas são rejeitados. A RPC valida todos os itens ativos, relações entre empresas e pedido/modelo.

O formulário preserva a chave e uma cópia do FormData quando o resultado for incerto. Campos ficam bloqueados e a repetição usa o corpo original. Não há persistência após reload nem operação offline: o usuário deve consultar as remessas antes de iniciar outra intenção. Leituras de opções/checklist são paginadas para evitar truncamento silencioso.

## Dependência e limites

A criação e o cadastro do tipo dependem da migração pendente `20261026181154_checklist_response_types.sql`, validada anteriormente com rollback, mas ainda sem autorização explícita para aplicação permanente. Não publicar esta versão antes de concluir essa atualização do banco. Nenhuma migração nova foi criada neste incremento de telas.

Esta entrega não inclui preenchimento final das respostas em texto/✓, envio parcial pela nova tela, armazenamento das respostas livres, PDF do novo checklist, tabela consolidada de acompanhamento ou novas permissões de observações. O contrato atual de entregas via RPC e operações existentes permanece disponível; entregas lançadas sem vínculo com kit não atendem automaticamente as pendências daquele kit.

Correção posterior confirmada: município é o nome do modelo. Não criar campo de município atendido nos pedidos. O acompanhamento por modelo usará quantidades das remessas, total de recolhimentos com histórico expansível e observações permitidas aos três perfis. Preservar pedidos específicos e não supor vínculo individual entre recebimento e remessa.

## Arquivos

- `src/app/painel/remessas/`: lista, seleção de pedido, formulário de criação, ação no servidor e detalhe.
- `src/lib/checklists/shipment-validation.ts`: validação independente do formulário.
- `src/lib/checklists/data.ts`: carregamento completo do checklist ativo.
- `src/app/painel/layout.tsx`: acesso à seção Remessas.
- `tests/shipments.test.mjs`: entradas inválidas, precisão, repetição de itens e campos de identidade ignorados.
- `tests/http-access.mjs`: proteção das três novas rotas.

Nenhuma dependência instalada ou dado permanente de teste criado. Alterações locais anteriores preservadas. Nenhum commit ou push executado.

## Validação executada

- `node --test tests/*.test.mjs`: 31 aprovados, incluindo três novos testes de remessas.
- `npm run lint`: saída 0.
- `npm run build`: aprovado, incluindo TypeScript e três novas rotas.
- `node tests/http-access.mjs`: login 200, 16 páginas exigindo sessão e dois downloads negados sem sessão; executado fora do sandbox por bloqueio conhecido de loopback.
- `git diff --check`: sem erros; avisos de normalização LF/CRLF conforme configuração Git.

Não foi feito teste de criação com sessão real nem verificação visual/mobile em navegador. Os testes de banco/RLS da base foram executados nos incrementos anteriores; não foram repetidos nesta etapa sem mudança de SQL. A aplicação da migração de tipos e a validação autenticada continuam pendentes antes da liberação.
