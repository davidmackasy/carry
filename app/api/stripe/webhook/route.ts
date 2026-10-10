import {env} from 'cloudflare:workers';
import {verifySignature,type BillingEnv} from '@/lib/billing/stripe';
import {adminNotifyEmail} from '@/lib/admin/access';
import {emailConfig} from '@/lib/email-config';
import {sendReminderEmail} from '@/services/notifications/email';
import {supabaseAdmin} from '@/lib/supabase/server';
export async function POST(request:Request){
 const body=await request.text();if(body.length>1000000)return new Response('Too large',{status:413});
 const config=env as unknown as BillingEnv;
 if(!await verifySignature(body,request.headers.get('stripe-signature'),config.STRIPE_WEBHOOK_SECRET))return new Response('Invalid signature',{status:400});
 // Entitlements are reconciled directly from Stripe on every status/access check.
 // Webhooks only create an idempotent admin notification; they never grant access.
 try{
  const event=JSON.parse(body) as {id?:string;type?:string;data?:{object?:{status?:string;trial_end?:number;metadata?:Record<string,string>;items?:{data?:{price?:{id?:string}}[]}}}};
  if(typeof event.id!=='string'||typeof event.type!=='string')return new Response('Invalid event',{status:400});
  const subscription=event.data?.object,userId=subscription?.metadata?.gift_user_id;
  if(event.type!=='customer.subscription.created'||subscription?.status!=='trialing'||!userId)return Response.json({received:true});
  const namespace=(env as unknown as {BILLING_ACCOUNTS?:DurableObjectNamespace}).BILLING_ACCOUNTS;if(!namespace)throw new Error('Billing storage unavailable');
  const account=namespace.get(namespace.idFromName(userId));
  const claim=await account.fetch('https://billing.internal',{method:'POST',body:JSON.stringify({action:'claim_admin_event',eventId:event.id,userId,email:''})});
  const claimed=await claim.json() as {claimed?:boolean};if(!claim.ok)throw new Error('Notification claim failed');if(!claimed.claimed)return Response.json({received:true,duplicate:true});
  try{
   const recipient=adminNotifyEmail();const mail=emailConfig();if(!recipient||!mail.from)throw new Error('Admin notification is not configured');
   const db=supabaseAdmin(),[authUser,profile]=await Promise.all([db.auth.admin.getUserById(userId),db.from('financial_profiles').select('data').eq('user_id',userId).maybeSingle()]);
   const customerEmail=authUser.data.user?.email??'Email unavailable';const profileData=profile.data?.data as {name?:string;onboarded?:boolean}|undefined;
   const price=subscription.items?.data?.[0]?.price?.id;const plan=price===config.STRIPE_PRICE_YEARLY?'yearly':price===config.STRIPE_PRICE_MONTHLY?'monthly':'Gift';
   await sendReminderEmail({from:mail.from,to:[recipient],subject:'Gift · A new customer started a free trial',text:`A new Gift customer started a 14-day free trial.\n\nCustomer: ${profileData?.name||'Gift customer'}\nEmail: ${customerEmail}\nPlan: ${plan}\nTrial ends: ${subscription.trial_end?new Date(subscription.trial_end*1000).toISOString().slice(0,10):'Not provided'}\nOnboarding: ${profileData?.onboarded?'Complete':'Not completed'}\n\nOpen the Gift admin console: https://budgetwithgift.com/app`},mail,event.id);
   const completed=await account.fetch('https://billing.internal',{method:'POST',body:JSON.stringify({action:'complete_admin_event',eventId:event.id,userId,email:''})});if(!completed.ok)throw new Error('Notification completion failed');
   return Response.json({received:true,notified:true});
  }catch(error){await account.fetch('https://billing.internal',{method:'POST',body:JSON.stringify({action:'release_admin_event',eventId:event.id,userId,email:''})});throw error;}
 }catch{return new Response('Webhook processing failed',{status:503});}
}
