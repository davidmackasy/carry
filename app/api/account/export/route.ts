import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readProfile} from '@/lib/store';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});try {const {state}=await readProfile(user.userId);return new Response(JSON.stringify(state,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="gift-budget.json"','Cache-Control':'private, no-store'}});}catch{return Response.json({error:'Could not export your budget. Please retry.'},{status:503});}}
