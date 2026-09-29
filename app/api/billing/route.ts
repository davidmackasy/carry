import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
async function handle(request:Request,action:string,interval?:string){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});
 const ns=(env as unknown as {BILLING_ACCOUNTS:DurableObjectNamespace}).BILLING_ACCOUNTS;
 if(!ns)return Response.json({error:'Billing is not available yet.'},{status:503});
 const result=await ns.get(ns.idFromName(user.userId)).fetch('https://billing.internal',{method:'POST',body:JSON.stringify({action,interval,userId:user.userId,email:user.email})});
 return new Response(result.body,{status:result.status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
}
export async function GET(r:Request){return handle(r,'status');}
export async function POST(r:Request){if(r.headers.get('origin')!==new URL(r.url).origin)return Response.json({error:'Invalid origin'},{status:403});try{const b=await r.json() as {action:string;interval?:string};if(!['checkout','portal'].includes(b.action))return Response.json({error:'Invalid action'},{status:400});return handle(r,b.action,b.interval);}catch{return Response.json({error:'Invalid request'},{status:400});}}
