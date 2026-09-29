import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {supabaseConfig} from '@/lib/supabase/server';
export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  let config;try{config=supabaseConfig();}catch{return response;}
  const client=createServerClient(config.url,config.key,{cookies:{
    getAll:()=>request.cookies.getAll(),
    setAll:values=>{
      values.forEach(({name,value})=>request.cookies.set(name,value));
      response=NextResponse.next({request});
      values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    }
  }});
  await client.auth.getUser();
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/((?!api/reminders/dispatch|api/stripe/webhook|_next|assets|favicon|icon-|manifest.json|sw.js|offline.html).*)']};
