import type {Role} from "@/lib/auth/authorization";
import type {DashboardData} from "@/lib/dashboard";
import {ProductionDashboard} from "./production-dashboard";
export function DashboardOverview({data,role}:{data:DashboardData;role:Role}) {return <ProductionDashboard data={data} role={role}/>;}
