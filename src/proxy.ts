import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";
import {supabaseConfig} from "@/lib/supabase/config";
export async function proxy(request: NextRequest) {
 const {url,key} = supabaseConfig();
 const requestHeaders=new Headers(request.headers);requestHeaders.set("x-bagsync-path",request.nextUrl.pathname);
 let response = NextResponse.next({request:{headers:requestHeaders}});
 const client = createServerClient(url,key,{cookies:{
  getAll: () => request.cookies.getAll(),
  setAll(values, headers) {
   values.forEach(({name,value}) => request.cookies.set(name,value));
   requestHeaders.set("cookie",request.cookies.toString());
   response = NextResponse.next({request:{headers:requestHeaders}});
   values.forEach(({name,value,options}) => response.cookies.set(name,value,options));
   Object.entries(headers).forEach(([name,value]) => response.headers.set(name,value));
  }
 }});
 await client.auth.getUser();
 response.headers.set("Cache-Control", "private, no-store");
 return response;
}
export const config = {matcher: ["/", "/login", "/painel/:path*"]};
