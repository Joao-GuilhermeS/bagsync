# Decisões técnicas

- DT-001 — Confirmada pelo responsável em 25/10/2026: stack descrita no README. Não houve comparação de alternativas nesta etapa.
- DT-002 — Confirmada: requisitos e aceite antes da implementação; incrementos pequenos; avaliar impacto e obter autorização quando necessária para dependências, migrações destrutivas e publicação.
- DT-003 — Aplicada no diagnóstico: alterar somente documentação, preservando código, dependências e banco. Versões do manifesto são observações locais, sem certificação de compatibilidade ou estabilidade.

Pendentes: multi-tenancy, autorização, schema, versões suportadas, implantação e metas mensuráveis. Decisões futuras devem registrar contexto, responsável, data, consequências e aprovação.

- DT-004 — Integração Tailwind via PostCSS oficial para Next.js em substituição ao loader Turbopack que falhava ao processar CSS neste ambiente. Build passou após mudança. Referência: https://tailwindcss.com/docs/installation/framework-guides/nextjs.
