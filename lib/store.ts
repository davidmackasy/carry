import {supabase} from '@/lib/supabase/server';
import type {FinanceState} from '@/types/finance';
import {emptyState} from '@/services/finance/sample';
import {summarize,today} from '@/services/finance';
export function check(error:{message:string}|null){if(error)throw new Error(error.message.includes('CONFLICT')?'CONFLICT':'Storage unavailable');}
export async function readProfile(userId:string){
 const client=await supabase();
 const {data:row,error}=await client.from('financial_profiles').select('data,revision').eq('user_id',userId).maybeSingle();check(error);
 const state:FinanceState=row?row.data:emptyState();
 if(state.onboarded){const current=summarize(state);const saved=await client.from('runway_snapshots').upsert({user_id:userId,date:today(state.timezone),runway:current.runway.days,balance:current.balance,safe:current.safe.today},{onConflict:'user_id,date',ignoreDuplicates:true});check(saved.error);}
 const snapshots=await client.from('runway_snapshots').select('date,runway,balance,safe').eq('user_id',userId).order('date',{ascending:false}).limit(180);check(snapshots.error);
 state.snapshots=(snapshots.data??[]).reverse();return {state,revision:row?.revision??0,summary:summarize(state)};
}
export async function saveProfile(userId:string,state:FinanceState,revision:number,_email?:string){
 const client=await supabase();const summary=summarize(state);
 const {error}=await client.rpc('save_gift_profile',{p_data:{...state,snapshots:[]},p_revision:revision,p_date:today(state.timezone),p_runway:summary.runway.days,p_balance:summary.balance,p_safe:summary.safe.today});check(error);return readProfile(userId);
}
export async function eraseProfile(_userId:string){const client=await supabase();const {error}=await client.rpc('erase_gift_profile');check(error);}
export async function readDraft(userId:string){const client=await supabase();const {data,error}=await client.from('setup_drafts').select('data,revision').eq('user_id',userId).maybeSingle();check(error);return {draft:data?.data??null,revision:data?.revision??0};}
export async function saveDraft(draft:unknown,revision:number){const client=await supabase();const {data,error}=await client.rpc('save_gift_draft',{p_data:draft,p_revision:revision});check(error);return {revision:data};}
export async function deleteDraft(userId:string){const client=await supabase();const {error}=await client.from('setup_drafts').delete().eq('user_id',userId);check(error);}
export async function reminderHeartbeat(){const client=await supabase();const {data,error}=await client.from('job_heartbeats').select('created_at').eq('id','reminder-job-heartbeat').maybeSingle();check(error);return data;}
