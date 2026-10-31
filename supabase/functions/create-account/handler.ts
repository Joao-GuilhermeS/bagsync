// API administrativa isolada. Nenhuma senha, sessão ou chave é registrada em logs.
type Environment={url:string;anon:string;service:string};
type Dependencies={env:Environment;fetch:typeof fetch};
const roles=["gerente_logistico","gestor","motorista"];
const permissions=["inicio","consultas","cadastros","pedidos","estoque","expedicao","motorista","observacoes","prazos","rotas","contas"];
const reply=(status:number,body:Record<string,unknown>)=>Response.json({...body,uncertain:body.uncertain??(status>=500||status===409)},{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export function accountHandler({env,fetch:request}:Dependencies){return async(req:Request):Promise<Response>=>{
 if(req.method!=="POST")return reply(405,{message:"Método não permitido."});
 const authorization=req.headers.get("authorization");if(!authorization?.startsWith("Bearer "))return reply(401,{message:"Entre no sistema."});
 try{
  const identity=await request(`${env.url}/auth/v1/user`,{headers:{apikey:env.anon,Authorization:authorization}});
  if(!identity.ok)return reply(401,{message:"Sessão inválida."});
  const reader=req.body?.getReader();if(!reader)return reply(400,{message:"Dados ausentes."});
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>16384){await reader.cancel();return reply(413,{message:"Formulário muito grande."});}chunks.push(part.value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply(400,{message:"Dados inválidos."});}
  if(!input||typeof input!=="object"||typeof input.requestKey!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestKey)||typeof input.name!=="string"||!input.name.trim()||input.name.trim().length>120||typeof input.email!=="string"||input.email.length>254||!/^\S+@\S+\.\S+$/.test(input.email.trim())||!roles.includes(input.role)||typeof input.password!=="string"||input.password.length<12||input.password.length>128||!Array.isArray(input.permissions)||input.permissions.length>permissions.length||input.permissions.some((value:unknown)=>typeof value!=="string"||!permissions.includes(value)))return reply(400,{message:"Revise nome, e-mail, perfil, permissões e senha (12 a 128 caracteres)."});
  const rpc=async(name:string,body:unknown,service=false)=>request(`${env.url}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:service?env.service:env.anon,Authorization:service?`Bearer ${env.service}`:authorization,"Content-Type":"application/json"},body:JSON.stringify(body)});
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.service),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const proof=Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${input.requestKey}:${input.password}`))),value=>value.toString(16).padStart(2,"0")).join("");
  const prepared=await rpc("prepare_account_creation",{p_request_key:input.requestKey,p_name:input.name.trim(),p_email:input.email.trim(),p_role:input.role,p_permissions:[...new Set(input.permissions)].sort(),p_fingerprint:proof});
  if(!prepared.ok){const failure=await prepared.json().catch(()=>({}));return reply(failure.code==="42501"?403:failure.code==="55P03"?409:400,{uncertain:failure.code==="55P03",message:failure.code==="55P03"?"Criação em andamento. Aguarde 30 segundos e repita a mesma tentativa.":"Criação não autorizada ou dados divergentes. Confira os limites e o e-mail."});}
  const intent=await prepared.json();if(intent.completed)return reply(200,{success:true,userId:intent.user_id});
  const lookup=await rpc("lookup_account_provision_user",{p_request_key:input.requestKey},true);
  if(!lookup.ok)return reply(503,{uncertain:true,message:"Não foi possível confirmar a tentativa. Repita os mesmos dados."});
  let userId=await lookup.json();
  if(!userId){
   const created=await request(`${env.url}/auth/v1/admin/users`,{method:"POST",headers:{apikey:env.service,Authorization:`Bearer ${env.service}`,"Content-Type":"application/json"},body:JSON.stringify({email:intent.email,password:input.password,email_confirm:true,app_metadata:{bagsync_provision_request:input.requestKey},user_metadata:{full_name:intent.name}})});
   if(!created.ok&&created.status>=400&&created.status<500)return reply(400,{uncertain:false,message:"Não foi possível criar essa conta. Revise o e-mail e os requisitos de senha."});
   if(!created.ok)return reply(503,{uncertain:true,message:"Não foi possível confirmar a criação. Confira a lista e repita a mesma tentativa após 30 segundos."});
   const user=await created.json();userId=user.id??user.user?.id;
  }
  if(typeof userId!=="string")return reply(503,{uncertain:true,message:"Resultado não confirmado. Repita a mesma tentativa."});
  const finalized=await rpc("complete_account_creation",{p_request_key:input.requestKey,p_user_id:userId});
  if(!finalized.ok)return reply(503,{uncertain:true,message:"A identidade pode ter sido criada, mas o acesso não foi confirmado. Repita os mesmos dados após 30 segundos."});
  return reply(200,{success:true,userId});
 }catch{return reply(503,{uncertain:true,message:"Conexão interrompida. Confira a lista e repita a mesma tentativa após 30 segundos."});}
};}
