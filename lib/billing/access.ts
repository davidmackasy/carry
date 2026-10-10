import {env} from 'cloudflare:workers';
export type BillingStatus={access:boolean;status:string;trialEligible:boolean;trialEnd?:number;periodEnd?:number;cancelAtPeriodEnd?:boolean;hasCustomer:boolean};
export async function billingStatus(userId:string,email='') {
 const namespace=(env as unknown as {BILLING_ACCOUNTS?:DurableObjectNamespace}).BILLING_ACCOUNTS;
 if(!namespace)throw new Error('Billing verification unavailable');
 const response=await namespace.get(namespace.idFromName(userId)).fetch('https://billing.internal',{method:'POST',body:JSON.stringify({action:'status',userId,email})});
 if(!response.ok)throw new Error('Billing verification unavailable');
 return await response.json() as BillingStatus;
}
export async function subscriptionRequired(userId:string,email='') {
 try {return (await billingStatus(userId,email)).access?null:Response.json({error:'Choose a plan to start your trial or manage your subscription.',code:'SUBSCRIPTION_REQUIRED',redirect:'/billing'},{status:402,headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({error:'We couldn’t verify your subscription. Please retry shortly.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
