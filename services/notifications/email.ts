import type {Reminder} from './index';
export type EmailPayload={from:string;to:string[];subject:string;text:string};
export function reminderEmail(reminder:Reminder,recipient:string,from:string,origin:string):EmailPayload{
 return {from,to:[recipient],subject:`Gift · ${reminder.title}`,text:`${reminder.title}\n\n${reminder.body}\n\nOpen Gift to review your plan: ${origin}\n\nThis reminder is based on the estimates and due dates you entered. Gift has not verified a bank deposit or made any payment.\n\nTo stop these emails, open Gift → Payday & reminders and turn off email reminders.`};
}
export async function sendReminderEmail(payload:EmailPayload,key:string,idempotencyKey:string,send:typeof fetch=fetch){
 const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify(payload)});
 if(!response.ok){const e=new Error('Email provider did not accept this reminder.') as Error&{retryable:boolean};e.retryable=response.status===429||response.status>=500;throw e;}
 const data=await response.json() as {id?:string};if(!data.id)throw new Error('Email provider response was incomplete.');return data.id;
}
