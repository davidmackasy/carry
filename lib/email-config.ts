import {env} from 'cloudflare:workers';
export function emailConfig(){const e=env as unknown as Record<string,string|undefined>;return {key:e.RESEND_API_KEY,from:e.CARRY_EMAIL_FROM,secret:e.CARRY_REMINDER_JOB_SECRET,origin:e.NEXT_PUBLIC_APP_URL??e.CARRY_APP_URL??'https://budgetwithgift.com'};}
