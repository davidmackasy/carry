import type {Reminder} from './index';
export type EmailPayload={from:string;to:string[];subject:string;text:string};
export function reminderEmail(reminder:Reminder,recipient:string,from:string,origin:string):EmailPayload{
 return {from,to:[recipient],subject:`Gift · ${reminder.title}`,text:`${reminder.title}\n\n${reminder.body}\n\nOpen Gift to review your plan: ${origin}${reminder.kind==='followup'?'/?reminder=review':''}\n\nThis reminder is based on the estimates and due dates you entered. Gift has not verified a bank deposit or made any payment.\n\nTo stop these emails, open ${origin}/billing and choose Turn off reminder emails. You can also change preferences inside Gift.`};
}
export async function sendReminderEmail(payload:EmailPayload,config:{key?:string;domain?:string;region:string},id:string,send:typeof fetch=fetch){
 if(!config.key||!config.domain)throw new Error('Mailgun is not configured.');
 const body=new FormData();
 body.set('from',payload.from);body.set('to',payload.to.join(','));body.set('subject',payload.subject);body.set('text',payload.text);
 body.set('v:gift_reminder_id',id);
 body.set('o:tracking','no');body.set('o:tracking-clicks','no');body.set('o:tracking-opens','no');
 const host=config.region==='EU'?'api.eu.mailgun.net':'api.mailgun.net';
 const response=await send(`https://${host}/v3/${encodeURIComponent(config.domain)}/messages`,{method:'POST',headers:{Authorization:`Basic ${btoa(`api:${config.key}`)}`},body,signal:AbortSignal.timeout(20000)});
 if(!response.ok){const e=new Error('Mailgun did not accept this reminder.') as Error&{retryable:boolean};e.retryable=response.status===429;throw e;}
 const data=await response.json() as {id?:string};if(!data.id)throw new Error('Mailgun response was incomplete.');return data.id;
}
