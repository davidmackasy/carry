export type BillingEnv={STRIPE_SECRET_KEY:string;STRIPE_WEBHOOK_SECRET:string;STRIPE_PRICE_MONTHLY:string;STRIPE_PRICE_YEARLY:string;STRIPE_PORTAL_CONFIGURATION?:string};
export async function stripe<T>(env:BillingEnv,path:string,params?:Record<string,string>,idempotency?:string):Promise<T>{
 if(!env.STRIPE_SECRET_KEY)throw new Error('Billing is not configured');
 const response=await fetch('https://api.stripe.com/v1/'+path,{method:params?'POST':'GET',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Stripe-Version':'2025-02-24.acacia',...(params?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},body:params?new URLSearchParams(params):undefined,signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Billing provider unavailable');return response.json() as Promise<T>;
}
export async function verifySignature(body:string,header:string|null,secret:string,now=Date.now()){
 if(!header||!secret)return false;
 const parts=header.split(',').map(p=>p.split('='));const timestamp=parts.find(p=>p[0]==='t')?.[1];
 if(!timestamp||!/^\d+$/.test(timestamp)||Math.abs(now/1000-Number(timestamp))>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${body}`)));
 return parts.filter(p=>p[0]==='v1').some(([,signature])=>{if(!/^[a-f0-9]{64}$/.test(signature??''))return false;let diff=0;for(let i=0;i<32;i++)diff|=mac[i]^parseInt(signature.slice(i*2,i*2+2),16);return diff===0;});
}
export type Subscription={id:string;status:string;trial_end:number|null;current_period_end:number;cancel_at_period_end:boolean;items:{data:{price:{id:string}}[]}};
export const entitled=(s:Subscription|undefined)=>!!s&&['active','trialing'].includes(s.status);
