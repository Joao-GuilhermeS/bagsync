import {Suspense} from "react";
import {workspace} from "@/lib/operations/data";
import {dashboardData} from "@/lib/dashboard";
import {DashboardOverview} from "@/components/dashboard/overview";
import {DashboardSkeleton} from "@/components/dashboard/dashboard-skeleton";
async function Overview(){
 const {access,client}=await workspace();const data=await dashboardData(client,access.companyId);
 return <DashboardOverview data={data} role={access.role}/>;
}
export default function Panel(){return <Suspense fallback={<DashboardSkeleton/>}><Overview/></Suspense>;}
