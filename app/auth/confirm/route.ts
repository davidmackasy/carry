import {supabaseConfig} from '@/lib/supabase/server';
import {handleConfirmation} from '@/lib/auth/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return await handleConfirmation(request,supabaseConfig());}catch{return new Response('Sign-in is temporarily unavailable. Please try again shortly.',{status:503,headers:{'Cache-Control':'no-store'}});}}
