import {env} from 'cloudflare:workers';
import {getChatGPTUser,type ChatGPTUser} from '@/app/chatgpt-auth';

export function isAdminEmail(email:string,configured:string|undefined){
 const allowed=(configured??'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
 return allowed.includes(email.trim().toLowerCase());
}
export function adminNotifyEmail(){return (env as unknown as Record<string,string|undefined>).ADMIN_NOTIFY_EMAIL?.trim()??'';}
export async function currentAdmin():Promise<ChatGPTUser|null>{
 const user=await getChatGPTUser();
 if(!user)return null;
 const configured=(env as unknown as Record<string,string|undefined>).ADMIN_EMAILS;
 return isAdminEmail(user.email,configured)?user:null;
}
