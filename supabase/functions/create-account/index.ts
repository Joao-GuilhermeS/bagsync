import {accountHandler} from "./handler.ts";
declare const Deno:{env:{get:(key:string)=>string|undefined};serve:(handler:(request:Request)=>Promise<Response>)=>void};
const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if(!url||!anon||!service)throw new Error("Ambiente administrativo indisponível.");
Deno.serve(accountHandler({env:{url,anon,service},fetch}));
