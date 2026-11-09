# Identidade LIRA SERVICES

Em 09/11/2026, o responsável solicitou substituir a identidade visual RL Bolsas por LIRA SERVICES no sistema.

## Escopo e aceite

- Login: arte LIRA SERVICES adaptada da marca anterior, preservando letras geométricas com recortes, degradê verde escuro e slogan. Usa PNG transparente em src/assets/brand/lira-services.png com next/image e dimensões intrínsecas; sem barra vertical ou substituição por fonte genérica.
- Cabeçalho, menu e relatórios: usam o nome do cadastro da empresa autenticada; não substituir nomes de outros tenants.
- Mesma empresa e mesmos vínculos, conta principal, login, permissões e dados operacionais.
- BagSync continua sendo o nome do produto. E-mail de login e endereço do site continuam existentes.
- Documentos históricos, apresentações exportadas e migrations aplicadas preservam a identificação original; novos documentos gerados usam o nome atual do cadastro.

## Atualização do cadastro

Destino exclusivo: projeto BagSync `ppgeveafuhgoymtvvrya`. Atualização de dado cadastral executada em 09/11/2026 por solicitação do responsável, sem alteração de esquema ou RLS. Consulta posterior confirmou LIRA SERVICES, os três vínculos existentes e RLS habilitada em companies. O outro projeto não foi alterado.

```sql
update public.companies
set name = 'LIRA SERVICES'
where id = 'abd23955-cf67-4354-8d67-ae0b7dbec40f'
  and name = 'RL Bolsas'
returning id, name;
```

## Validação

### Correção visual solicitada

A identificação simples introduzida inicialmente foi substituída pela arte adaptada da referência local tipografiaRLbolsas. Gerada com a ferramenta integrada de imagem, usando como instrução preservar cores, tipografia geométrica com recortes e slogan, alterando o nome principal para LIRA SERVICES. Arquivo original preservado. Sem alteração de cadastro, autenticação, permissões ou layout estrutural nesta correção.

Validação da correção: lint, build webpack (40 páginas) e git diff --check aprovados. Playwright confirmou carregamento da imagem e ausência de overflow horizontal em 1440, 375 e 320 px. Capturas desktop e celular revisadas visualmente. Sem commit, push ou deploy.

### Validações do incremento inicial

- `npm run lint`: aprovado.
- `npx next build --webpack`: aprovado, 40 páginas.
- `node --test tests/checklist-pdf.test.mjs tests/export-validation.test.mjs`: sete testes aprovados.
- Playwright no build local: marca nova presente e antiga ausente; sem overflow horizontal em 1440, 375 e 320 px. Capturas de desktop e celular revisadas visualmente.
- Busca em src e public: nenhuma referência visual textual a RL Bolsas ou ao antigo PNG.
- `git diff --check -- src/app/login/page.tsx README.md docs`: aprovado. Verificação global identifica somente espaços finais na alteração preexistente de checklist-actions.ts, preservada neste incremento.
- Não houve novo login, emissão real de PDF ou teste autenticado no navegador neste incremento. A origem dinâmica do nome nos cabeçalhos e relatórios foi conferida no código.
- Nova tela de login validada localmente; depende de commit/push e deploy para aparecer no site público. Sem commit, push ou deploy neste incremento.
