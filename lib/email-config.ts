import {env} from 'cloudflare:workers';
export function emailConfig(){
 const e=env as unknown as Record<string,string|undefined>;
 return {key:e.MAILGUN_API_KEY,domain:e.MAILGUN_DOMAIN,region:e.MAILGUN_REGION==='EU'?'EU':'US',from:e.GIFT_EMAIL_FROM,secret:e.CARRY_REMINDER_JOB_SECRET,supabaseUrl:e.NEXT_PUBLIC_SUPABASE_URL,adminKey:e.SUPABASE_SECRET_KEY,origin:e.NEXT_PUBLIC_APP_URL??'https://budgetwithgift.com'};
}
