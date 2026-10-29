// Preparação opcional: npm install --prefix tmp/deadline-db --no-audit --no-fund @electric-sql/pglite@0.5.13
// PostgreSQL em memória; nenhuma credencial ou conexão de produção.
import fs from "node:fs";
const {PGlite}=await import("../tmp/deadline-db/node_modules/@electric-sql/pglite/dist/index.js");
const db=new PGlite();
try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
 grant usage on schema auth to anon,authenticated;`);
 for(const name of fs.readdirSync("supabase/migrations").filter(name=>name.endsWith(".sql")).sort()){
  await db.exec(fs.readFileSync("supabase/migrations/"+name,"utf8"));console.log("MIGRATION OK",name);
 }
 await db.exec(`insert into auth.users values('11111111-1111-4111-8111-111111111111');
 insert into public.companies(id,name) values('22222222-2222-4222-8222-222222222222','__local_tests__');
 insert into public.company_users(user_id,company_id,role) values('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','gerente_logistico');`);
 for(const name of fs.readdirSync("supabase/tests").filter(name=>name.endsWith(".sql")).sort()){
  try{await db.exec(fs.readFileSync("supabase/tests/"+name,"utf8"));console.log("SQL SUITE OK",name);}
  catch(error){await db.exec("rollback");console.error("SQL SUITE FAILED",name,error.message,error.where??"");process.exitCode=1;}
 }
}catch(error){console.error(error.message,error.where??"");process.exitCode=1;}
finally{await db.close();}
