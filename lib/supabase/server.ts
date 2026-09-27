import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {env} from 'cloudflare:workers';

export function supabaseConfig(){
  const e=env as unknown as Record<string,string|undefined>;
  const url=e.NEXT_PUBLIC_SUPABASE_URL;
  const key=e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Supabase is not configured.');
  return {url,key};
}
export async function supabase(){
  const {url,key}=supabaseConfig();
  const jar=await cookies();
  return createServerClient(url,key,{cookies:{
    getAll:()=>jar.getAll(),
    setAll:values=>{try{values.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Middleware refreshes cookies before Server Components render. */}}
  }});
}
export function supabaseAdmin(){
  const {url}=supabaseConfig();
  const key=(env as unknown as Record<string,string|undefined>).SUPABASE_SECRET_KEY;
  if(!key)throw new Error('Reminder storage is not configured.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
