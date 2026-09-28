import {supabaseConfig} from '@/lib/supabase/server';
import {handleAuth} from '@/lib/auth/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return await handleAuth(request,supabaseConfig());}catch{return Response.json({error:'Sign-in is temporarily unavailable. Please try again shortly.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
