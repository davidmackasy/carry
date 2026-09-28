import {getChatGPTUser} from '@/app/chatgpt-auth';
import {reminderHeartbeat,readProfile} from '@/lib/store';
import {remindersFor} from '@/services/notifications';
import {emailConfig} from '@/lib/email-config';
export const dynamic='force-dynamic';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});try{const {state}=await readProfile(user.userId);const config=emailConfig();const heartbeat=await reminderHeartbeat();const scheduled=!!heartbeat&&Date.now()-Date.parse(heartbeat.created_at)<2*3600000;const configured=!!(config.key&&config.from&&config.domain&&config.adminKey&&config.supabaseUrl);return Response.json({email:user.email,deliveryStatus:!configured?'needs_sender':!scheduled?'needs_scheduler':'ready',reminders:remindersFor(state),enabled:state.reminders?.emailEnabled??false},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Could not load reminder settings.'},{status:503});}}
