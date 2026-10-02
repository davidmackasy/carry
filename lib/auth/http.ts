import {createServerClient,parseCookieHeader,serializeCookieHeader} from '@supabase/ssr';
export type AuthConfig={url:string;key:string};
export function requestAuth(request:Request,config:AuthConfig,fetcher:typeof fetch=fetch){
 const jar=new Map(parseCookieHeader(request.headers.get('cookie')??'').map(({name,value})=>[name,value??'']));
 const pending:string[]=[];
 const client=createServerClient(config.url,config.key,{global:{fetch:fetcher},cookies:{
  getAll:()=>Array.from(jar,([name,value])=>({name,value})),
  setAll:values=>{for(const {name,value,options} of values){jar.set(name,value);pending.push(serializeCookieHeader(name,value,{...options,httpOnly:true,secure:new URL(request.url).protocol==='https:'}));}}
 }});
 return {client,respond:(body:unknown,status=200)=>{const headers=new Headers({'Content-Type':'application/json','Cache-Control':'private, no-store'});pending.forEach(value=>headers.append('Set-Cookie',value));return new Response(JSON.stringify(body),{status,headers});},redirect:(path:string)=>{const headers=new Headers({Location:new URL(path,new URL(request.url).origin).href,'Cache-Control':'private, no-store'});pending.forEach(value=>headers.append('Set-Cookie',value));return new Response(null,{status:303,headers});}};
}
export function safeNext(value:unknown){if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//'))return '/app';try{const u=new URL(value,'https://app.local');return u.origin==='https://app.local'&&!u.pathname.startsWith('/auth')?u.pathname+u.search+u.hash:'/app';}catch{return '/app';}}
function resetErrorCode(error:{code?:string;name?:string}){return error.name==='AuthSessionMissingError'?'session_not_found':/^[a-z_]{1,64}$/.test(error.code??'')?error.code:'password_update_failed';}
function authError(error:{code?:string;status?:number;name?:string},action:string){
 if(error.name==='AuthSessionMissingError')return 'Your reset session expired. Request a new password-reset email and use its newest link.';
 if(error.status===429||error.code?.includes('rate_limit'))return 'Too many attempts. Please wait a few minutes and try again.';
 if(error.code==='email_not_confirmed')return 'Confirm your email using the link in your inbox before signing in.';
 if(error.code==='signup_disabled')return 'Account registration is currently unavailable. Please try again later.';
 if(error.code==='same_password')return 'Choose a different password. Your new password must be different from your current password.';
 if(error.code==='weak_password')return 'This password does not meet the account security requirements. Choose a longer, unique password with uppercase and lowercase letters, a number, and a symbol.';
 if(error.code==='reauthentication_needed'||error.code==='reauthentication_not_valid')return 'For your security, request a fresh password-reset email and use its newest link before changing your password.';
 if(['session_not_found','session_expired','refresh_token_not_found','refresh_token_already_used','bad_jwt'].includes(error.code??''))return 'Your reset session expired. Request a new password-reset email and use its newest link.';
 if(action==='login')return 'Could not sign in. Check your email and password. If you are new, choose Create account.';
 if(action==='forgot')return 'We could not send the reset email. Please try again shortly.';
 return 'We could not complete your request. Please try again shortly.';
}
export async function handleAuth(request:Request,config:AuthConfig,fetcher:typeof fetch=fetch){
 const origin=new URL(request.url).origin;
 if(request.headers.get('origin')!==origin)return Response.json({error:'Invalid request origin.'},{status:403});
 let body:Record<string,unknown>;try{const raw=await request.text();if(raw.length>8000)return Response.json({error:'Request too large.'},{status:413});body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return Response.json({error:'Please check the form and try again.'},{status:400});}
 const action=body.action;
 if(!['login','signup','forgot','reset','signout'].includes(String(action)))return Response.json({error:'Unknown action.'},{status:400});
 const auth=requestAuth(request,config,fetcher);
 const email=typeof body.email==='string'?body.email.trim():'';
 const password=typeof body.password==='string'?body.password:'';
 if(['login','signup','forgot'].includes(String(action))&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254))return auth.respond({error:'Enter a valid email address.'},400);
 if(['login','signup','reset'].includes(String(action))&&(!password||password.length>128||(action!=='login'&&password.length<8)))return auth.respond({error:action==='login'?'Enter your password.':'Use a password of 8–128 characters.'},400);
 if((action==='signup'||action==='reset')&&password!==body.confirmPassword)return auth.respond({error:'The passwords do not match.'},400);
 try{
  if(action==='login'){const {data,error}=await auth.client.auth.signInWithPassword({email,password});if(error)return auth.respond({error:authError(error,action)},400);if(!data.session)return auth.respond({error:'Sign-in did not create a session. Please try again.'},502);return auth.respond({redirect:safeNext(body.next)});}
  if(action==='signup'){const {data,error}=await auth.client.auth.signUp({email,password,options:{emailRedirectTo:origin+'/auth/confirm'}});if(error)return auth.respond({error:authError(error,action)},400);return auth.respond(data.session?{redirect:safeNext(body.next)}:{message:'Check your inbox for a confirmation link. After confirming your email, you can sign in.'});}
  if(action==='forgot'){const {error}=await auth.client.auth.resetPasswordForEmail(email,{redirectTo:origin+'/auth/confirm?flow=recovery'});if(error)return auth.respond({error:authError(error,action)},400);return auth.respond({message:'If an account exists for this email, a reset link is on its way. Check your inbox and spam folder.'});}
  if(action==='reset'){const {data:{user},error:lookup}=await auth.client.auth.getUser();if(lookup||!user)return auth.respond({error:'Your reset session expired. Request a new password-reset email.'},401);const {error}=await auth.client.auth.updateUser({password});if(error)return auth.respond({error:authError(error,action),code:resetErrorCode(error)},400);return auth.respond({redirect:'/app'});}
  const {error}=await auth.client.auth.signOut();if(error)return auth.respond({error:'Could not sign out. Please retry.'},503);return auth.respond({redirect:'/'});
 }catch{return auth.respond({error:'We could not reach the sign-in service. Please try again shortly.'},503);}
}
export async function handleConfirmation(request:Request,config:AuthConfig,fetcher:typeof fetch=fetch){
 const url=new URL(request.url);const auth=requestAuth(request,config,fetcher);const token=url.searchParams.get('token_hash'),type=url.searchParams.get('type'),code=url.searchParams.get('code');
 try{
  if(code){const {error}=await auth.client.auth.exchangeCodeForSession(code);if(!error)return auth.redirect(url.searchParams.get('flow')==='recovery'?'/auth/reset':'/app');}
  else if(token&&(type==='signup'||type==='recovery'||type==='email')){const {error}=await auth.client.auth.verifyOtp({token_hash:token,type});if(!error)return auth.redirect(type==='recovery'?'/auth/reset':'/app');}
 }catch{/* Display a recoverable error without leaking provider details or tokens. */}
 return auth.redirect('/auth/login?message='+encodeURIComponent('This confirmation link is invalid or expired. Request a new link or try signing in.'));
}
