import {DurableObject} from 'cloudflare:workers';
import {stripe,entitled,type BillingEnv,type Subscription} from './stripe';
type Session={id:string;url:string;status:string};
// One serialized account per verified Supabase user; no public HTTP route to this object.
export class BillingAccount extends DurableObject<BillingEnv>{
 async fetch(request:Request):Promise<Response>{return this.ctx.blockConcurrencyWhile(async()=>{
 try{
 const {action,userId,email,interval}=await request.json() as {action:string;userId:string;email:string;interval?:string};
 const owner=await this.ctx.storage.get<string>('owner');if(owner&&owner!==userId)return Response.json({error:'Invalid billing owner'},{status:403});
 await this.ctx.storage.put('owner',userId);
 let customer=await this.ctx.storage.get<string>('customer');
 if(!customer&&action==='checkout'){
  // Persist the idempotency key before the network call, including retries after interruption.
  let key=await this.ctx.storage.get<string>('customerKey');if(!key){key=crypto.randomUUID();await this.ctx.storage.put('customerKey',key);}
  const c=await stripe<{id:string}>(this.env,'customers',{email,'metadata[gift_user_id]':userId,'metadata[app]':'gift'},key);customer=c.id;await this.ctx.storage.put('customer',customer);
 }
 const all=customer?await stripe<{data:Subscription[]}>(this.env,`subscriptions?customer=${encodeURIComponent(customer)}&status=all&limit=100`):{data:[]};
 const plans=all.data.filter(s=>s.items.data.some(i=>[this.env.STRIPE_PRICE_MONTHLY,this.env.STRIPE_PRICE_YEARLY].includes(i.price.id)));
 const current=plans.find(s=>entitled(s))??plans.find(s=>!['canceled','incomplete_expired'].includes(s.status));
 if(plans.length)await this.ctx.storage.put('trialUsed',true);
 const eligible=!await this.ctx.storage.get<boolean>('trialUsed');
 if(action==='status')return Response.json({status:current?.status??'none',access:entitled(current),trialEligible:eligible,trialEnd:current?.trial_end,periodEnd:current?.current_period_end,cancelAtPeriodEnd:current?.cancel_at_period_end,hasCustomer:!!customer});
 if(action==='portal'){
  if(!customer)return Response.json({error:'No subscription to manage yet.'},{status:400});
  const p=await stripe<{url:string}>(this.env,'billing_portal/sessions',{customer,return_url:'https://budgetwithgift.com/billing',...(this.env.STRIPE_PORTAL_CONFIGURATION?{configuration:this.env.STRIPE_PORTAL_CONFIGURATION}:{})});return Response.json({url:p.url});
 }
 if(action!=='checkout'||!customer||!['monthly','yearly'].includes(interval??''))return Response.json({error:'Choose a plan.'},{status:400});
 if(current)return Response.json({error:'You already have a subscription. Use Manage subscription to make changes.'},{status:409});
 const pending=await this.ctx.storage.get<{id:string;interval:string}>('checkout');
 if(pending){const session=await stripe<Session>(this.env,'checkout/sessions/'+pending.id);if(session.status==='open'){if(pending.interval===interval)return Response.json({url:session.url});await stripe(this.env,`checkout/sessions/${pending.id}/expire`,{});}else if(session.status==='complete'&&!plans.length)return Response.json({error:'Your checkout completed. Refresh to see your subscription.'},{status:409});await this.ctx.storage.delete('checkout');await this.ctx.storage.delete('checkoutKey');}
 let checkoutKey=await this.ctx.storage.get<string>('checkoutKey');if(!checkoutKey){checkoutKey=crypto.randomUUID();await this.ctx.storage.put('checkoutKey',checkoutKey);await this.ctx.storage.put('checkoutInterval',interval);}
 const savedInterval=await this.ctx.storage.get<string>('checkoutInterval');if(savedInterval!==interval)return Response.json({error:'Please retry the plan you selected previously before changing plans.'},{status:409});
 const price=interval==='monthly'?this.env.STRIPE_PRICE_MONTHLY:this.env.STRIPE_PRICE_YEARLY;
 const verified=await stripe<{active:boolean;currency:string;unit_amount:number;recurring:{interval:string}}>(this.env,'prices/'+price);
 if(!verified.active||verified.currency!=='usd'||verified.unit_amount!==(interval==='monthly'?599:4999)||verified.recurring.interval!==(interval==='monthly'?'month':'year'))throw new Error('Price configuration mismatch');
 const session=await stripe<Session>(this.env,'checkout/sessions',{mode:'subscription',customer,'line_items[0][price]':price,'line_items[0][quantity]':'1',payment_method_collection:'always','payment_method_types[0]':'card',client_reference_id:userId,'metadata[gift_user_id]':userId,'subscription_data[metadata][gift_user_id]':userId,'subscription_data[metadata][app]':'gift',...(eligible?{'subscription_data[trial_period_days]':'14','subscription_data[trial_settings][end_behavior][missing_payment_method]':'cancel'}:{}),success_url:'https://budgetwithgift.com/billing?checkout=complete',cancel_url:'https://budgetwithgift.com/billing?checkout=cancelled'},checkoutKey);
 await this.ctx.storage.put('checkout',{id:session.id,interval});return Response.json({url:session.url});
 }catch{return Response.json({error:'Billing is temporarily unavailable. Please try again shortly.'},{status:503});}
 });}
}
