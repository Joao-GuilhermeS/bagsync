# Decisões técnicas

## Atualização — Expedição e entregas (27/10/2026)

Manter unidades por empresa preserva IDs/FKs; sem conversões implícitas. Separar confirmação de entrega da operação de estoque evita dupla baixa. Confirmações via RPC idempotente e sem escrita direta pelo cliente. Contrato vigente em [Expedição e entregas](expedicao-entregas.md), que substitui descrições históricas divergentes abaixo.

- DT-001 — Confirmada pelo responsável em 25/10/2026: stack descrita no README. Não houve comparação de alternativas nesta etapa.
- DT-002 — Confirmada: requisitos e aceite antes da implementação; incrementos pequenos; avaliar impacto e obter autorização quando necessária para dependências, migrações destrutivas e publicação.
- DT-003 — Aplicada no diagnóstico: alterar somente documentação, preservando código, dependências e banco. Versões do manifesto são observações locais, sem certificação de compatibilidade ou estabilidade.

Pendentes: multi-tenancy, autorização, schema, versões suportadas, implantação e metas mensuráveis. Decisões futuras devem registrar contexto, responsável, data, consequências e aprovação.

- DT-004 — Integração Tailwind via PostCSS oficial para Next.js em substituição ao loader Turbopack que falhava ao processar CSS neste ambiente. Build passou após mudança. Referência: https://tailwindcss.com/docs/installation/framework-guides/nextjs.
