# Dados de demonstração da RL Bolsas

## Autorização e destino

Em 02/11/2026 o responsável solicitou explicitamente dados fictícios para enriquecer a apresentação visual e confirmou que todos os registros atuais da empresa são testes e podem ser ajustados. Essa autorização substitui, somente para este conjunto, a orientação anterior de não criar dados fictícios.

Aplicado exclusivamente ao projeto BagSync ppgeveafuhgoymtvvrya, empresa abd23955-cf67-4354-8d67-ae0b7dbec40f, conta responsável rlbolsas@gmail.com. Conta, senha, empresa, vínculos, papéis e demais contas não foram alterados. Projeto antigo não acessado.

## Alterações aplicadas

- Cinco facções novas: Costura Aurora, Ateliê Horizonte, Costura Lagoa, Oficina Girassol e Costura Sertão, todas com prefixo TESTE. Endereços fictícios e documentos genéricos DEMO; sem novos telefones ou CPF/CNPJ simulando pessoas reais.
- Quatro facções existentes receberam o prefixo TESTE e capitalização do nome; IDs e contatos originais preservados.
- Quatro pedidos novos, com prefixo TESTE - DEMO 02/11: Pacatuba 3.000, Maracanaú 4.500, Maranguape 2.500 e Itarema 1.800 bolsas.
- Doze remessas novas: uma preparada sem saída, kits completos, envios parciais, alerta manual de revisão, entregas a confirmar, produção em andamento e uma remessa de 1.500 bolsas totalmente recolhida.
- Entrada fictícia em seis materiais, mantendo dois materiais com saldo negativo para mostrar os avisos existentes. As quantidades foram escolhidas apenas para este cenário; não representam consumo real nem cálculo automático do aplicativo.
- Recolhimentos fracionados para demonstrar histórico; todos os novos recolhimentos vinculados à remessa correspondente.
- Complemento e recolhimento de 300 bolsas na remessa preexistente 10e71e2d-e022-4f2d-b74f-08535b337a72.
- Definição de prazo em três remessas legadas, com motivo e histórico pela RPC existente.
- Doze observações de produção identificadas como teste.

Pedidos antigos mantêm nome, modelo e quantidade prevista. Sua produção foi atualizada por novas remessas/recolhimentos. Não houve alteração direta ou exclusão de movimentos antigos, nem datas de operação artificialmente retroativas. A divergência já existente entre o nome Itarema fundamental e seu modelo Maranguape foi preservada; não houve remapeamento inferido de modelo.

## Resultado conferido no banco

| Informação | Antes | Depois |
| --- | ---: | ---: |
| Facções | 4 | 9 |
| Pedidos | 4 | 8 |
| Remessas | 6 | 18 |
| Operações de estoque | 16 | 48 |
| Movimentos no razão | 31 | 104 |
| Observações de produção | 0 | 12 |
| Contas Auth | 3 | 3 |

| Modelo | Em pedido geral | Recolhidas |
| --- | ---: | ---: |
| Itarema | 1.959 | 0 |
| Maracanaú | 19.500 | 6.200 |
| Maranguape | 70.499 | 26.770 |
| Pacatuba | 3.000 | 2.100 |
| Total | 94.958 | 35.070 |

São 11 kits completos e 7 incompletos. Existem 19 romaneios/saídas válidos: 16 entregues e 3 a entregar; complementos podem gerar mais de um romaneio por remessa. Na conferência de 02/11/2026, a tela de prazos possui 7 remessas a vencer e 9 no prazo. Essas categorias mudam com a data e não representam desempenho real da empresa.

## Execução e validação

Roteiro versionável em supabase/demo/20261102_visual_demo.sql. Não é migration e não altera o esquema. Por padrão termina em ROLLBACK. A execução permanente autorizada trocou somente esse comando final por COMMIT.

Operação administrativa pelo conector, com contexto SQL da conta solicitante e role authenticated para cadastros e RPCs. RLS e autorização operacional permaneceram ativas; esse procedimento não equivale a realizar login no navegador. Escritas de produção/estoque usaram RPCs existentes, com chaves determinísticas por intenção. Contagens finais e invariantes foram conferidas em contexto administrativo.

A primeira simulação atingiu 90 segundos em uma consulta final da view de status e foi revertida. Essa verificação administrativa foi movida para depois de RESET ROLE, preservando as verificações de escrita. A simulação completa seguinte passou com rollback, seguida de aplicação permanente com sucesso.

Verificação posterior: todos os novos recolhimentos estão vinculados às remessas, previsões originais e identidades preservadas. Leitura com contexto autenticado retornou 8 pedidos, 9 facções, 17 combinações de produção e 18 estados de remessa. Repetição completa do roteiro em nova transação revertida manteve as mesmas contagens, sem duplicações.

Não foram executados build ou lint da aplicação neste trabalho, pois não houve mudança de código executável do frontend/backend. Não houve nova validação visual no navegador autenticado; atualizar a página do aplicativo para consultar os dados gravados. Sem commit ou push executado.

## Uso futuro

Este conjunto afeta o estoque e os indicadores da empresa, pois são registros persistentes. Não misturar com produção real sem definir previamente a separação ou a limpeza autorizada. Não apagar o histórico nem remover dados com comandos genéricos: uma futura limpeza precisa considerar movimentos, estornos e dependências. A autorização desta carga não se estende a outras empresas, projetos ou lotes de dados.
