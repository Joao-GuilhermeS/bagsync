import test from "node:test";
import assert from "node:assert/strict";
import {accountHandler} from "../supabase/functions/create-account/handler.ts";
import {hasFeature,allowedPath,roleFeatures} from "../src/lib/auth/features.ts";
import {parseAccessForm} from "../src/lib/auth/admin-validation.ts";
const env={url:"https://example.invalid",anon:"public-test",service:"server-only-test"};
const input={requestKey:"11111111-1111-4111-8111-111111111111",name:"Nome de teste",email:"test@example.invalid",role:"motorista",permissions:["inicio","consultas","motorista"],password:"Long-password-test-2026"};
const request=body=>new Request("https://example.invalid/create-account",{method:"POST",headers:{Authorization:"Bearer test-session","Content-Type":"application/json"},body:JSON.stringify(body)});
test("criação administrativa confirma e-mail sem enviar convite e nunca devolve senha",async()=>{
 const calls=[];
 const handler=accountHandler({env,fetch:async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'actor'});
  if(url.endsWith('/prepare_account_creation'))return Response.json({completed:false,email:input.email,name:input.name});
  if(url.endsWith('/lookup_account_provision_user'))return Response.json(null);
  if(url.endsWith('/auth/v1/admin/users')){const body=JSON.parse(options.body);assert.equal(body.email_confirm,true);assert.equal(body.app_metadata.bagsync_provision_request,input.requestKey);return Response.json({id:'new-user'});}
  if(url.endsWith('/complete_account_creation'))return Response.json({user_id:'new-user'});
  throw Error('Chamada inesperada');
 }});
 const result=await handler(request(input));assert.equal(result.status,200);const body=await result.text();assert.ok(!body.includes(input.password));assert.ok(!body.includes(env.service));assert.ok(calls.every(call=>!call.url.includes('invite')&&!call.url.includes('signup')));
 const payload=JSON.parse(calls.find(call=>call.url.endsWith('/prepare_account_creation')).options.body);assert.equal(payload.p_fingerprint.length,64);assert.ok(!JSON.stringify(payload).includes(input.password));
});
test("sessão inválida e limite negado nunca alcançam API administrativa",async()=>{
 let calls=0;const noSession=accountHandler({env,fetch:async()=>{calls++;return Response.json({}, {status:401});}});
 assert.equal((await noSession(request(input))).status,401);assert.equal(calls,1);
 const denied=accountHandler({env,fetch:async(url)=>url.endsWith('/auth/v1/user')?Response.json({id:'actor'}):Response.json({code:'42501'},{status:403})});
 assert.equal((await denied(request(input))).status,403);
 assert.equal((await denied(request({...input,password:'short'}))).status,400);
});
test("replay concluído não recria identidade; recuperação conclui usuário já criado",async()=>{
 for(const completed of [true,false]){
  const calls=[];const handler=accountHandler({env,fetch:async(url)=>{calls.push(url);if(url.endsWith('/auth/v1/user'))return Response.json({id:'actor'});if(url.endsWith('/prepare_account_creation'))return Response.json({completed,user_id:'new-user',email:input.email,name:input.name});if(url.endsWith('/lookup_account_provision_user'))return Response.json('new-user');if(url.endsWith('/complete_account_creation'))return Response.json({user_id:'new-user'});throw Error('Admin não deveria ser chamado');}});
  assert.equal((await handler(request(input))).status,200);assert.ok(calls.every(url=>!url.endsWith('/auth/v1/admin/users')));
 }
});
test("permissão individual bloqueia rota e não transforma Gestor em operador",()=>{
 const manager={userId:'u',companyId:'c',role:'gerente_logistico',permissions:['inicio','consultas']};
 assert.equal(hasFeature(manager,'expedicao'),false);assert.equal(allowedPath(manager,'/painel/expedicao/nova'),false);assert.equal(allowedPath(manager,'/painel/expedicao'),true);
 assert.equal(hasFeature({...manager,role:'gestor',permissions:['cadastros']},'cadastros'),false);
 assert.ok(!roleFeatures.gestor.includes('expedicao'));
});
test("formulário rejeita perfil/permissão arbitrários e mantém empresa fora do payload",()=>{
 const form=new FormData();form.set('name','Nome');form.set('role','motorista');form.set('request_key',input.requestKey);form.append('permissions','motorista');form.set('company_id','forged');
 assert.equal(parseAccessForm(form).permissions[0],'motorista');assert.equal(parseAccessForm(form).company_id,undefined);
 form.append('permissions','root');assert.throws(()=>parseAccessForm(form));
});
