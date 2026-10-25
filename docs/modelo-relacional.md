# Modelo relacional — base definida para implementação

## Identidade e isolamento

- companies: id UUID PK; name texto obrigatório não vazio; created_at timestamptz.
- company_users: user_id UUID PK/FK auth.users; company_id UUID FK companies obrigatório; role restrito a gerente_logistico, motorista ou gestor.
- user_id como PK impõe no máximo uma empresa por usuário. Usuário Auth sem vínculo não acessa operações.
- Provisionamento administrativo pelo desenvolvedor; nenhum usuário da aplicação altera o próprio papel ou empresa.
- RLS: usuário autenticado consulta somente seu próprio vínculo e a empresa desse vínculo; sem INSERT/UPDATE/DELETE dessas tabelas para clientes autenticados. Verificar revogação de grants padrão.
- Índice de company_id para consultas de vínculos. Não armazenar e-mail/senha duplicados; identidade no Auth.

Isso define a base técnica, ainda sem migração aplicada. Supabase CLI não encontrado no PATH neste diagnóstico; geração de migração deve ocorrer via CLI, após disponibilizar a ferramenta e selecionar ambiente.

## Entidades operacionais identificadas, ainda não fechadas

Facções/costureiras, materiais, bolsas, remessas/entregas, itens enviados e recolhimentos/itens recebidos. Todas precisam de empresa proprietária, relacionamentos restritos à mesma empresa e regras de quantidade definidas. Campos e vínculos entre remessas e retornos dependem de respostas; não há SQL operacional aprovado.

## Pedidos e recebimentos — refinamento

- Pedido identifica a operação (exemplo informado pelo responsável: bolsas Maracanaú).
- Recebimentos pertencem a pedido; relação pedido 1:N recebimentos permite retornos parciais.
- Cada quantidade recebida abate o previsto no pedido. Total recebido é agregado dos recebimentos válidos; não duplicar contagem em registros de transporte e estoque.
- Material possui unidade explícita; não agregar quantidades de unidades distintas. Estoque permite saldo negativo e precisa devolvê-lo com indicação de aviso.
- Gravação de recebimento e seu efeito no estoque devem ocorrer na mesma transação, com idempotência e referências da mesma empresa.
- Estrutura de itens/modelos por pedido, tolerância de excesso, cancelamento e precisão das quantidades ainda serão fechados antes do SQL operacional.

## Estado implementado

companies e company_users criadas no BagSync pela migração 20261025200948_company_identity.sql. RLS habilitado e privilégios verificados. SQL operacional ainda não aplicado. As referências anteriores a CLI ausente/migração não aplicada descrevem o estado anterior e estão superadas por esta atualização.

## Catálogos implementados — 25/10/2026

Migração 20261025202641 adiciona workshops, measurement_units, materials, bags e bag_materials, com empresa proprietária, FKs compostas, índices, RLS e permissões. Dicionário, cardinalidades, restrições e evidências em [catálogos de produção](catalogos-producao.md). Pedidos e movimentações permanecem pendentes; trechos anteriores descrevem o histórico.
