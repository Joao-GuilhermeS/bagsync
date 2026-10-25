"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export async function login(form: FormData) {
 const email = form.get("email");
 const password = form.get("password");
 if (typeof email !== "string" || typeof password !== "string" ||
  email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password || password.length > 4096) {
  redirect("/login?erro=credenciais");
 }
 const client = await createClient();
 const {error} = await client.auth.signInWithPassword({email:email.trim(),password});
 if (error) redirect("/login?erro=credenciais");
 redirect("/painel");
}
export async function logout() {
 const client = await createClient();
 const {error} = await client.auth.signOut();
 if (error) throw new Error("Não foi possível sair. Tente novamente.");
 redirect("/login");
}
