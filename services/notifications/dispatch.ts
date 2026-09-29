import {billingStatus} from '../../lib/billing/access';
import {createClient} from '@supabase/supabase-js';
import {emailConfig} from '../../lib/email-config';
import {dueReminders} from './index';
import {reminderEmail,sendReminderEmail,type EmailPayload} from './email';
import type {FinanceState} from '../../types/finance';
function check(error:unknown){if(error)throw new Error('Reminder storage unavailable');}
export async function dispatchReminders(){
 const config=emailConfig();
 if(!config.key||!config.from||!config.domain||!config.adminKey||!config.supabaseUrl)return Response.json({error:'Reminder sender or storage is not configured.'},{status:503});
 let accepted=0,failed=0;
 try{
  const db=createClient(config.supabaseUrl!,config.adminKey!,{auth:{persistSession:false,autoRefreshToken:false}});let cursor='';
  while(true){
   let query=db.from('email_recipients').select('user_id,email').eq('enabled',true).order('user_id').limit(100);
   if(cursor)query=query.gt('user_id',cursor);
   const rows=await query;check(rows.error);if(!rows.data?.length)break;
   for(const row of rows.data){
    cursor=row.user_id;
    const profile=await db.from('financial_profiles').select('data').eq('user_id',row.user_id).maybeSingle();check(profile.error);
    const state=profile.data?.data as FinanceState|undefined;if(!state?.onboarded||!state.reminders?.emailEnabled)continue;if(!(await billingStatus(row.user_id,row.email)).access)continue;
    const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:state.timezone??'UTC',hour:'2-digit',hourCycle:'h23'}).format(new Date()));if(hour<state.reminders.sendHour)continue;
    for(const reminder of dueReminders(state)){
     const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${row.user_id}:${reminder.id}`));const id=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
     const found=await db.from('email_deliveries').select('status,created_at,claimed_at,payload').eq('id',id).maybeSingle();check(found.error);const existing=found.data;
     const age=existing?Date.now()-Date.parse(existing.created_at):0;
     if(existing&&(existing.status!=='retry'||age>=23*3600000))continue;
     const payload:EmailPayload=existing?existing.payload:reminderEmail(reminder,row.email,config.from,config.origin);
     const claim=existing?await db.from('email_deliveries').update({status:'sending',claimed_at:new Date().toISOString()}).eq('id',id).eq('status',existing.status).eq('claimed_at',existing.claimed_at).select('id'):await db.from('email_deliveries').upsert({id,user_id:row.user_id,status:'sending',created_at:new Date().toISOString(),payload},{onConflict:'id',ignoreDuplicates:true}).select('id');
     check(claim.error);if(!claim.data?.length)continue;
     try{
      const current=await db.from('email_recipients').select('enabled').eq('user_id',row.user_id).maybeSingle();check(current.error);
      if(!current.data?.enabled){check((await db.from('email_deliveries').update({status:'failed',payload:{}}).eq('id',id)).error);continue;}
      const providerId=await sendReminderEmail(payload,config,id);
      check((await db.from('email_deliveries').update({status:'sent',provider_id:providerId,payload:{}}).eq('id',id)).error);accepted++;
     }catch(e){failed++;check((await db.from('email_deliveries').update({status:(e as Error&{retryable?:boolean}).retryable===true?'retry':'failed'}).eq('id',id)).error);}
    }
   }
   if(rows.data.length<100)break;
  }
  check((await db.from('job_heartbeats').upsert({id:'reminder-job-heartbeat',created_at:new Date().toISOString()})).error);
  return Response.json({accepted,failed},{status:failed?503:200});
 }catch{return Response.json({error:'Reminder dispatch failed. Retry with the same job configuration.'},{status:503});}
}
