import {currentAdmin} from '@/lib/admin/access';
import {billingStatus} from '@/lib/billing/access';
import {supabaseAdmin} from '@/lib/supabase/server';

export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store'};
async function authorize(){const admin=await currentAdmin();return admin?{admin}:{response:Response.json({error:'Admin access required.'},{status:403,headers:noStore})};}
function safeName(value:unknown){return typeof value==='string'?value.slice(0,100):'';}
export async function GET(request:Request){
 const auth=await authorize();if('response'in auth)return auth.response;
 try{
  const page=Math.max(1,Math.min(1000,Number(new URL(request.url).searchParams.get('page')??1)||1));
  const db=supabaseAdmin();
  const listed=await db.auth.admin.listUsers({page,perPage:100});if(listed.error)throw listed.error;
  const users=listed.data.users;
  const ids=users.map(user=>user.id);
  const [profiles,drafts]=ids.length?await Promise.all([
   db.from('financial_profiles').select('user_id,data,revision,updated_at').in('user_id',ids),
   db.from('setup_drafts').select('user_id,updated_at').in('user_id',ids),
  ]):[{data:[],error:null},{data:[],error:null}];
  if(profiles.error||drafts.error)throw profiles.error??drafts.error;
  const profileById=new Map((profiles.data??[]).map(row=>[row.user_id,row]));
  const draftById=new Map((drafts.data??[]).map(row=>[row.user_id,row]));
  const customers=await Promise.all(users.map(async user=>{
   const profile=profileById.get(user.id);const data=(profile?.data??{}) as Record<string,unknown>;
   let billing;try{billing=await billingStatus(user.id,user.email??'');}catch{billing={status:'unavailable',access:false,trialEligible:false,hasCustomer:false};}
   const list=(key:string)=>Array.isArray(data[key])?data[key].length:0;
   return {id:user.id,email:user.email??'',name:safeName(data.name)||safeName(user.user_metadata?.full_name)||'Gift customer',createdAt:user.created_at,lastSignInAt:user.last_sign_in_at??null,emailConfirmed:!!user.email_confirmed_at,bannedUntil:user.banned_until??null,onboarding:data.onboarded?'completed':draftById.has(user.id)?'in_progress':'not_started',updatedAt:profile?.updated_at??draftById.get(user.id)?.updated_at??null,activity:{transactions:list('transactions'),bills:list('bills'),goals:list('goals')},billing};
  }));
  const summary={total:listed.data.total??customers.length,trialing:customers.filter(c=>c.billing.status==='trialing').length,paid:customers.filter(c=>c.billing.status==='active').length,completed:customers.filter(c=>c.onboarding==='completed').length,banned:customers.filter(c=>!!c.bannedUntil&&Date.parse(c.bannedUntil)>Date.now()).length};
  return Response.json({admin:{email:auth.admin.email},customers,summary,page,nextPage:listed.data.nextPage},{headers:noStore});
 }catch{return Response.json({error:'Customer management could not be loaded.'},{status:503,headers:noStore});}
}
export async function POST(request:Request){
 const auth=await authorize();if('response'in auth)return auth.response;
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid request origin.'},{status:403,headers:noStore});
 try{
  const body=await request.json() as {action?:string;userId?:string};
  if(!body.userId||!['reset_password','ban','unban'].includes(body.action??''))return Response.json({error:'Invalid admin action.'},{status:400,headers:noStore});
  const db=supabaseAdmin();const target=await db.auth.admin.getUserById(body.userId);if(target.error||!target.data.user?.email)return Response.json({error:'Customer not found.'},{status:404,headers:noStore});
  if(body.action==='ban'&&body.userId===auth.admin.userId)return Response.json({error:'You cannot ban your own admin account.'},{status:400,headers:noStore});
  if(body.action==='reset_password'){
   const sent=await db.auth.resetPasswordForEmail(target.data.user.email,{redirectTo:'https://budgetwithgift.com/auth/reset'});if(sent.error)throw sent.error;
  }else{
   const updated=await db.auth.admin.updateUserById(body.userId,{ban_duration:body.action==='ban'?'876000h':'none'});if(updated.error)throw updated.error;
  }
  await db.from('audit_events').insert({user_id:body.userId,action:`admin_${body.action}_by_${auth.admin.userId}`});
  return Response.json({ok:true,message:body.action==='reset_password'?'Password reset email sent.':body.action==='ban'?'Customer access suspended.':'Customer access restored.'},{headers:noStore});
 }catch{return Response.json({error:'The admin action could not be completed.'},{status:503,headers:noStore});}
}
