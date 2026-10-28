export const dashboardStages = [
 {key:"ordered",label:"Em Pedido Geral",description:"Total previsto nos pedidos",icon:"orders",color:"var(--chart-ordered)"},
 {key:"inProduction",label:"Em Produção",description:"Distribuídas e ainda não recolhidas",icon:"layers",color:"var(--chart-production)"},
 {key:"ready",label:"Prontas",description:"Recolhidas, considerando estornos",icon:"check",color:"var(--chart-ready)"},
] as const;
export type DashboardStage = typeof dashboardStages[number]["key"];
