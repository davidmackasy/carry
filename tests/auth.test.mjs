import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'gift-auth-'));
await build({entryPoints:['lib/auth/http.ts'],outfile:join(dir,'auth.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {handleAuth,handleConfirmation,requestAuth,safeNext}=await import(pathToFileURL(join(dir,'auth.mjs')));
process.on('exit',()=>{void rm(dir,{recursive:true,force:true});});
const config={url:'https://test-project.supabase.co',key:'test-publishable-key'};
const origin='https://gift.test';
const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),aud:'authenticated',role:'authenticated'})+'.test';
const session={access_token:token,refresh_token:'test-refresh-token',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
const req=(body,headers={})=>new Request(origin+'/api/auth',{method:'POST',headers:{origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const cookieHeader=response=>response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');

test('successful login returns cookies that authenticate the next request',async()=>{
 let calls=0;
 const mock=async(url)=>{calls++;assert.match(String(url),/\/auth\/v1\/token\?grant_type=password/);return json(session);};
 const response=await handleAuth(req({action:'login',email:user.email,password:'valid-password',next:'//evil.test'}),config,mock);
 assert.equal(response.status,200);assert.equal((await response.json()).redirect,'/');assert.equal(calls,1);
 assert.ok(response.headers.getSetCookie().some(v=>v.includes('auth-token=')&&v.includes('HttpOnly')&&v.includes('Secure')));
 const auth=requestAuth(new Request(origin+'/',{headers:{cookie:cookieHeader(response)}}),config,async(url,options)=>{assert.match(String(url),/\/auth\/v1\/user/);assert.equal(new Headers(options.headers).get('authorization'),'Bearer '+token);return json(user);});
 const result=await auth.client.auth.getUser();assert.equal(result.data.user.id,user.id);
});
test('invalid login remains an explicit error without redirect',async()=>{
 const r=await handleAuth(req({action:'login',email:user.email,password:'wrong'}),config,async()=>json({code:'invalid_credentials',msg:'Invalid login credentials'},400));
 assert.equal(r.status,400);const body=await r.json();assert.match(body.error,/Check your email and password/);assert.equal(body.redirect,undefined);
});
test('signup requires matching passwords and reports email confirmation',async()=>{
 const mismatch=await handleAuth(req({action:'signup',email:user.email,password:'password123',confirmPassword:'different'}),config,async()=>{throw Error('must not call');});assert.equal(mismatch.status,400);
 const r=await handleAuth(req({action:'signup',email:user.email,password:'password123',confirmPassword:'password123'}),config,async(url)=>{assert.ok(new URL(String(url)).searchParams.get('redirect_to')===origin+'/auth/confirm');return json({user});});
 assert.match((await r.json()).message,/confirmation link/);
});
test('forgot password needs no password, retains PKCE cookies, and surfaces provider errors',async()=>{
 const r=await handleAuth(req({action:'forgot',email:user.email}),config,async(url)=>{assert.equal(new URL(String(url)).searchParams.get('redirect_to'),origin+'/auth/confirm?flow=recovery');return json({});});
 assert.equal(r.status,200);assert.match((await r.json()).message,/reset link/);assert.ok(r.headers.getSetCookie().length>0);
 const failed=await handleAuth(req({action:'forgot',email:user.email}),config,async()=>json({code:'over_email_send_rate_limit',msg:'Too many requests'},429));assert.equal(failed.status,400);assert.match((await failed.json()).error,/Too many attempts/);
});
test('confirmation and recovery attach session cookies to their redirect',async()=>{
 for(const type of ['signup','recovery']){
  const r=await handleConfirmation(new Request(origin+'/auth/confirm?token_hash=test-token&type='+type),config,async()=>json(session));
  assert.equal(r.status,303);assert.equal(r.headers.get('location'),origin+(type==='recovery'?'/auth/reset':'/'));assert.ok(r.headers.getSetCookie().length>0);
 }
});
test('invalid confirmation, cross-origin requests, and unsafe redirects fail safely',async()=>{
 const r=await handleConfirmation(new Request(origin+'/auth/confirm?token_hash=bad&type=signup'),config,async()=>json({code:'otp_expired',msg:'Expired'},403));assert.match(r.headers.get('location'),/message=/);
 const cross=await handleAuth(req({action:'login'},{origin:'https://evil.test'}),config,async()=>{throw Error('must not call');});assert.equal(cross.status,403);
 assert.equal(safeNext('/\\evil.test'),'/');assert.equal(safeNext('/auth/login'),'/');assert.equal(safeNext('/?tab=Bills'),'/?tab=Bills');
});
test('PKCE recovery callback preserves cookies and opens reset screen',async()=>{
 const r=await handleAuth(req({action:'forgot',email:user.email}),config,async()=>json({}));
 const confirmed=await handleConfirmation(new Request(origin+'/auth/confirm?code=test-code&flow=recovery',{headers:{cookie:cookieHeader(r)}}),config,async(url)=>{assert.match(String(url),/grant_type=pkce/);return json(session);});
 assert.equal(confirmed.headers.get('location'),origin+'/auth/reset');assert.ok(confirmed.headers.getSetCookie().some(v=>v.includes('auth-token=')));
});
test('signout clears session cookies and reset requires an authenticated session',async()=>{
 const signedIn=await handleAuth(req({action:'login',email:user.email,password:'password123'}),config,async()=>json(session));
 const signedOut=await handleAuth(req({action:'signout'},{cookie:cookieHeader(signedIn)}),config,async(url)=>String(url).includes('/user')?json(user):new Response(null,{status:204}));
 assert.equal((await signedOut.json()).redirect,'/auth/login');assert.ok(signedOut.headers.getSetCookie().some(v=>v.includes('Max-Age=0')));
 const reset=await handleAuth(req({action:'reset',password:'password123',confirmPassword:'password123'}),config,async()=>{throw Error('No session');});assert.equal(reset.status,401);
});
