import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readDraft,saveDraft} from '@/lib/store';
import {setupDraftSchema} from '@/lib/setup-validation';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const user=await getChatGPTUser();if(!user)return json({error:'Sign in to set up Gift.'},401);try{return json(await readDraft(user.userId));}catch{return json({error:'Could not load your saved setup. Please retry.'},503);}}
export async function PUT(request:Request){const user=await getChatGPTUser();if(!user)return json({error:'Sign in first.'},401);if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid origin.'},403);try{const body=await request.json() as {draft:unknown;revision:number};const parsed=setupDraftSchema.safeParse(body.draft);if(!parsed.success||!Number.isInteger(body.revision)||body.revision<0)return json({error:'Check the setup fields and try again.'},400);return json(await saveDraft(parsed.data,body.revision));}catch(e){if(e instanceof Error&&e.message==='CONFLICT')return json({error:'Setup changed in another window. Reload to continue.'},409);return json({error:'Could not save your setup. Your entries are still here; please retry.'},503);}}
