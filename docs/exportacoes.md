# Exportações — requisitos aprovados

Confirmado pelo responsável em 25/10/2026, neste chat:

- Romaneio em PDF por operação, contendo pedido, facção, data e itens.
- Extratos em CSV com filtros de período, pedido e facção.

Status: próximo incremento; ainda não implementado. Não há arquivos exportados nesta etapa.

A implementação deverá manter autenticação/autorização, isolamento por empresa, quantidades exatas, horário de Brasília e indicação de estornos. Downloads não podem usar credenciais privilegiadas no navegador. Validar conteúdo/escape de campos e filtros, impedir acesso entre empresas e distinguir falha de exportação de arquivo vazio. Não alterar movimentos ou saldos para gerar documentos.
