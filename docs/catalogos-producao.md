# Catálogos de produção — incremento 1

Implementado em 25/10/2026 no repositório C:/Users/joaog/Projeto_RL/bagsync, destino confirmado pelo responsável. Projeto Supabase exclusivo: BagSync (ppgeveafuhgoymtvvrya). Escopo: banco de facções, unidades, materiais, bolsas e composição opcional; sem novas telas ou operações de estoque.

## Objetivo e aceite

Cadastrar/consultar os catálogos com integridade e isolamento por empresa. Somente gerente logístico escreve; motorista e gestor consultam. Impedir referências entre empresas, composição repetida e quantidades não positivas ou não finitas. Preservar empresa, usuário e credenciais existentes.

## Dicionário

Nomes SQL em inglês preservam o padrão existente; descrições/documentação em pt-BR. Nas quatro tabelas de cadastro: id UUID PK gerado pelo banco; company_id UUID obrigatório FK companies; created_at timestamptz obrigatório gerado pelo banco; UNIQUE(company_id,id) para referências compostas e índice por empresa.

| Tabela | Finalidade | Atributos específicos |
| --- | --- | --- |
| workshops | Facção ou costureira como destinatária de produção | name texto obrigatório, não vazio |
| measurement_units | Unidade de medida pertencente à empresa | name e symbol textos obrigatórios, não vazios; UNIQUE(company_id,symbol) |
| materials | Material de produção | name obrigatório; unit_id UUID obrigatório |
| bags | Modelo de bolsa | name obrigatório |
| bag_materials | Relação opcional de materiais por modelo | company_id, bag_id e material_id UUID obrigatórios; quantity numeric obrigatório, positivo e finito |

Campos mínimos sem telefone, documentos ou endereços obrigatórios não solicitados. Nomes podem repetir, pois não foi aprovada unicidade de nomes. Símbolo da unidade tem unicidade por comparação exata, sem conversões automáticas ou normalização de caixa.

## Relacionamentos e normalização

- Empresa 1:N facções, unidades, materiais e modelos de bolsa.
- Unidade 1:N materiais. FK(company_id,unit_id) impede unidade de outra empresa.
- Bolsa N:N material por bag_materials. PK(company_id,bag_id,material_id) impede repetição do material no mesmo modelo.
- Composição referencia bolsa e material por FKs compostas contendo company_id. Nenhum item pode ligar empresas diferentes, mesmo por acesso administrativo.
- quantity expressa material por uma bolsa, na unidade do material. Numeric sem escala fixa evita arredondamento implícito enquanto a precisão de negócio está pendente; clientes devem preservar decimal exato.
- FK para empresas e FKs dos catálogos usam NO ACTION, sem exclusão em cascata: material/bolsa com composição não pode ser apagado até remover as referências autorizadamente.
- Unidade e nome não são copiados na composição. Não há saldo armazenado no catálogo.
- Índices materials(company_id,unit_id) e bag_materials(company_id,material_id) complementam as PKs/UNIQUEs e cobrem os caminhos de FKs.

## Permissões

| Operação nos cinco catálogos | Gerente Logístico | Motorista | Gestor | Sem vínculo / anônimo |
| --- | --- | --- | --- | --- |
| Consultar registros da própria empresa | Sim | Sim | Sim | Não |
| Inserir, alterar, excluir | Sim | Não | Não | Não |
| Consultar ou escrever outra empresa | Não | Não | Não | Não |

GRANTs explícitos: authenticated recebe SELECT/INSERT/UPDATE/DELETE, sujeitos às políticas RLS; PUBLIC/anon não recebem acesso. RLS consulta vínculo em company_users por auth.uid(), sem confiar em user_metadata ou empresa enviada pelo cliente. UPDATE tem USING e WITH CHECK para impedir transferência de empresa. O próprio vínculo continua sem escrita pelo usuário da aplicação.

## Composição e limites

Composição é opcional: bolsa pode existir sem materiais. Ela descreve quantidade por bolsa; não implica reserva, baixa automática, ficha técnica obrigatória, perdas ou conversão de unidades. Não foram cadastradas unidades ou produtos de exemplo. Antes do fluxo operacional será necessário definir versionamento da composição, mudanças de unidade após uso, itens/modelos por pedido, ajustes e cancelamentos. Saldo negativo com aviso e recebimento parcial por pedido permanecem requisitos do próximo incremento.

Cada comando SQL é atômico. Operações compostas de várias linhas precisam de transação no servidor/RPC quando forem disponibilizadas no backend; não alegamos que um frontend fazendo chamadas separadas seria atômico. Duplicação do par bolsa/material é impedida no banco, inclusive sob concorrência. Idempotência de entregas/recebimentos será implementada junto aos movimentos, que ainda não existem.

## Migração e testes

Nova migração: supabase/migrations/20261025202641_catalogos_producao.sql. Gerada inicialmente pela CLI (20261025202504) e alinhada à versão retornada pela aplicação via conector. Migração anterior preservada. Apenas DDL aditivo e permissões das novas tabelas; nenhuma mudança em senha, empresa ou vínculo existente.

supabase/tests/catalogos.sql é suíte SQL de integração administrativa, sempre em BEGIN/ROLLBACK. Usa temporariamente o vínculo real de gerente e fixtures internas; não cria identidades Auth ou dados de exemplo persistentes. Não executar em paralelo a alterações administrativas: reservar sessão de teste. Rollback restaura o perfil e remove fixtures inclusive em falha de asserção (encerrar/reverter a transação se o cliente mantiver sessão).

Executada duas vezes: migração + testes na mesma transação revertida, depois testes sobre a migração aplicada. Ambos retornaram OK. Casos executados: CRUD de facção pelo gerente; criação de unidade, material, bolsa e composição; duplicidade; quantidade zero/NaN; material com unidade de outra empresa; transferência de bolsa entre empresas; escrita em outra empresa; exclusão de material referenciado; nome vazio; consultas e exclusões por motorista/gestor; inserção e alteração de bolsa negadas aos dois; consulta sem identidade; leitura anônima negada. Testes usam identidade SQL simulada sob authenticated, não senha/JWT emitido via navegador.

Verificações adicionais: sete tabelas públicas com RLS e sem SELECT para anon; catálogos vazios após rollback; vínculo real preservado. Oito testes Node passaram; npm run lint, npm run build (inclui TypeScript) e git diff --check passaram. Login real com senha e testes visuais continuam pendentes.

## Alertas e checkpoint

Supabase security advisor mantém alerta de proteção de senhas vazadas desativada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. Não alterada configuração de Auth. Performance advisor apenas informa índice company_users_company_id_idx sem uso observado; preservado, pois ainda não há carga representativa: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.

Revisar todas as mudanças locais anteriores antes de agrupar commit. Comandos propostos, não executados:

```powershell
git status --short
git diff --check
git diff
git ls-files --others --exclude-standard
# Ler migração, testes e documentos novos.
git add supabase/migrations/20261025202641_catalogos_producao.sql supabase/tests/catalogos.sql docs/catalogos-producao.md docs/modelo-relacional.md docs/regras-de-negocio.md docs/desenvolvimento.md docs/implantacao.md README.md AGENTS.md supabase/migrations/README.md
git diff --cached
# Confirmar conjunto coerente com as mudanças anteriores ainda locais.
git commit -m "feat: criar catalogos de producao com isolamento por empresa"
git push origin main
```

Nenhum commit/push executado. Próximo incremento: definir e implementar pedidos, itens, entregas, recebimentos e movimentos de estoque transacionais/idempotentes; integrar telas depois do contrato de dados.
