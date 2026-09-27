// Compatibility exports keep existing feature modules stable during the hosting migration.
import {redirect} from 'next/navigation';
import {supabase} from '@/lib/supabase/server';
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{
  const client=await supabase();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user||!user.email)return null;
  const fullName=typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name:null;
  return {userId:user.id,email:user.email,displayName:fullName??user.email,fullName};
}
export async function requireChatGPTUser(returnTo:string){const user=await getChatGPTUser();if(user)return user;redirect(chatGPTSignInPath(returnTo));}
export function safeReturn(value:string|null){if(!value||!value.startsWith('/')||value.startsWith('//'))return '/';try{const u=new URL(value,'https://app.local');return u.origin==='https://app.local'&&!u.pathname.startsWith('/auth')?u.pathname+u.search+u.hash:'/';}catch{return '/';}}
export function chatGPTSignInPath(returnTo:string){return '/auth/login?next='+encodeURIComponent(safeReturn(returnTo));}
export function chatGPTSignOutPath(){return '/auth/signout';}
