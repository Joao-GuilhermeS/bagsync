import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import config from "../next.config.ts";

const require=createRequire(import.meta.url);
const {blockCrossSiteDEV}=require("next/dist/server/lib/router-utils/block-cross-site-dev.js");
function blocked(url,origin,allowed=config.allowedDevOrigins){
 const response={statusCode:200,end(){}};
 const result=blockCrossSiteDEV({url,headers:{origin}},response,allowed,"127.0.0.1");
 return {result,status:response.statusCode};
}

test("IP de desenvolvimento libera chunks, fonte interna e HMR sem liberar outras origens",()=>{
 for(const url of ["/_next/static/chunks/app.js","/__nextjs_font/geist-latin.woff2","/_next/webpack-hmr","/_next/hmr"]){
  assert.equal(blocked(url,"http://26.24.177.139:3000",[]).status,403);
  assert.equal(blocked(url,"http://26.24.177.139:3000").result,false);
  assert.equal(blocked(url,"http://origem-nao-autorizada.invalid:3000").status,403);
 }
 assert.equal(blocked("/_next/webpack-hmr","http://localhost:3000").result,false);
 assert.equal(blocked("/_next/webpack-hmr","null").status,403);
});
