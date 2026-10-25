import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {roles, type AccessContext} from "./authorization";
export async function requireAccess(): Promise<AccessContext | null> {
 const client = await createClient();
 const {data: {user}, error} = await client.auth.getUser();
 if (error || !user) redirect("/login");
 const {data, error: membershipError} = await client.from("company_users")
  .select("company_id, role").eq("user_id",user.id).maybeSingle();
 if (membershipError) throw new Error("Não foi possível consultar seu acesso. Tente novamente.");
 if (!data || !roles.includes(data.role)) return null;
 return {userId:user.id,companyId:data.company_id,role:data.role};
}
