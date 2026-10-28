# Expedição

Aplicar o MASTER.md e o contrato `docs/ux-expedicao.md`.

- Fundo claro, verde institucional para ação principal, bordas suaves e sombras discretas.
- Listagem com busca, filtros de transporte, cards e progresso do atendimento do kit. Separar badge de incompletude do badge de transporte.
- Nova Remessa em três etapas: Seleção → Checklist → Finalização. Campos em uma coluna no celular; não usar página longa sem hierarquia.
- OK é botão grande com estado `aria-checked`, ícone de confirmação e texto. Parcial permanece disponível; texto nunca representa quantidade automaticamente.
- Entrega apresenta endereço e contatos clicáveis, quantidade/modelo/data e ação Marcar como Entregue. Feedback de espera, sucesso e incerteza preserva o contrato de idempotência.
- Não usar cor como único indicador; manter foco visível, navegação por teclado, estados vazios e skeleton.
