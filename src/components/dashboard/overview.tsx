import type {Role,AccessContext} from "@/lib/auth/authorization";
import type {DashboardData} from "@/lib/dashboard";
import {ProductionDashboard} from "./production-dashboard";
export function DashboardOverview({data,role,access}:{data:DashboardData;role:Role;access?:AccessContext}) {return <ProductionDashboard access={access} data={data} role={role}/>;}
