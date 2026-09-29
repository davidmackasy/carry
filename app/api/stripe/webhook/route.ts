import {env} from 'cloudflare:workers';
import {verifySignature,type BillingEnv} from '@/lib/billing/stripe';
export async function POST(request:Request){
 const body=await request.text();if(body.length>1000000)return new Response('Too large',{status:413});
 const config=env as unknown as BillingEnv;
 if(!await verifySignature(body,request.headers.get('stripe-signature'),config.STRIPE_WEBHOOK_SECRET))return new Response('Invalid signature',{status:400});
 // Entitlements are reconciled directly from Stripe on every status/access check.
 // No event payload grants access; duplicates and out-of-order deliveries are harmless.
 try{const event=JSON.parse(body);if(typeof event.id!=='string'||typeof event.type!=='string')return new Response('Invalid event',{status:400});return Response.json({received:true});}catch{return new Response('Invalid event',{status:400});}
}
