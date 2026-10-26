// Executar após npm run build. Não cria dados nem usa credenciais.
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
const port=3101;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{stdio:["ignore","pipe","pipe"],windowsHide:true});
let output="";server.stdout.on("data",chunk=>output+=chunk);server.stderr.on("data",chunk=>output+=chunk);
try {
 for(let i=0;i<40&&!output.includes("Ready")&&server.exitCode===null;i++)await new Promise(resolve=>setTimeout(resolve,250));
 assert.ok(output.includes("Ready"),"Servidor não iniciou: "+output);
 const routes=["/painel","/painel/cadastros/faccoes","/painel/cadastros/unidades","/painel/cadastros/materiais","/painel/cadastros/bolsas","/painel/pedidos","/painel/pedidos/11111111-1111-4111-8111-111111111111","/painel/estoque/materiais","/painel/estoque/bolsas","/painel/movimentacoes","/painel/cadastros/bolsas/11111111-1111-4111-8111-111111111111/composicao","/painel/exportacoes"];
 routes.push("/painel/cadastros/bolsas/11111111-1111-4111-8111-111111111111/checklist");
 routes.push("/painel/remessas","/painel/remessas/nova","/painel/remessas/11111111-1111-4111-8111-111111111111");
 routes.push("/painel/entregador","/painel/entregador/11111111-1111-4111-8111-111111111111","/painel/entregador/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222");
 for(const route of routes){
  const response=await fetch(`http://127.0.0.1:${port}${route}`,{redirect:"manual"});const body=await response.text();
  assert.ok(response.headers.get("location")==="/login"||body.includes("NEXT_REDIRECT;replace;/login;"),route+" deve exigir sessão");
  assert.ok(!body.includes('name="request_key"'),route+" não deve expor formulário sem sessão");
 }
 for(const route of ["/painel/exportacoes/extrato","/painel/exportacoes/romaneio/11111111-1111-4111-8111-111111111111"]){
  const r=await fetch(`http://127.0.0.1:${port}${route}`);assert.equal(r.status,401);assert.ok(r.headers.get("cache-control").includes("no-store"));assert.equal(r.headers.get("content-disposition"),null);assert.equal(typeof (await r.json()).error,"string");
 }
 const login=await fetch(`http://127.0.0.1:${port}/login`);assert.equal(login.status,200);assert.ok((await login.text()).includes("Acesse sua empresa"));
 console.log(`HTTP OK: login 200 e ${routes.length} rotas protegidas e dois downloads negados sem sessão.`);
} catch(error){console.error(error);process.exitCode=1;} finally {server.kill();}
