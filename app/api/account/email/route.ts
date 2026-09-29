import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readProfile,saveProfile} from '@/lib/store';
import {reminderDefaults} from '@/services/notifications';
export async function POST(r:Request){const user=await getChatGPTUser();if(!user)return new Response(null,{status:401});if(r.headers.get('origin')!==new URL(r.url).origin)return new Response(null,{status:403});try{const {state,revision}=await readProfile(user.userId);await saveProfile(user.userId,{...state,reminders:{...(state.reminders??reminderDefaults),emailEnabled:false}},revision,user.email);return Response.json({ok:true});}catch{return Response.json({error:'Could not update reminders. Please retry.'},{status:503});}}
