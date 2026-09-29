import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const output=await build({entryPoints:['services/notifications/email.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {sendReminderEmail,reminderEmail}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const config={key:'test-key',domain:'budgetwithgift.com',region:'US'};
const payload={from:'Gift <no-reply@budgetwithgift.com>',to:['test@example.com'],subject:'Gift reminder',text:'Upcoming bill'};
test('Mailgun sends branded reminder, private tracking disabled, stable correlation ID',async()=>{
 let called=false;
 const id=await sendReminderEmail(payload,config,'reminder-1',async(url,init)=>{
  called=true;assert.equal(url,'https://api.mailgun.net/v3/budgetwithgift.com/messages');
  assert.equal(init.headers.Authorization,'Basic '+btoa('api:test-key'));
  assert.equal(init.body.get('from'),payload.from);assert.equal(init.body.get('to'),'test@example.com');
  assert.equal(init.body.get('v:gift_reminder_id'),'reminder-1');assert.equal(init.body.get('o:tracking'),'no');
  return Response.json({id:'mailgun-id'});
 });assert.ok(called);assert.equal(id,'mailgun-id');
});
test('EU uses EU endpoint',async()=>{
 await sendReminderEmail(payload,{...config,region:'EU'},'id',async(url)=>{assert.match(url,/api.eu.mailgun.net/);return Response.json({id:'id'});});
});
test('only explicit rate limiting is automatically retryable; ambiguous failures are not resent',async()=>{
 for(const status of [400,401,429,500])await assert.rejects(sendReminderEmail(payload,config,'id',async()=>new Response('',{status})),e=>e.retryable===(status===429));
 await assert.rejects(sendReminderEmail(payload,config,'id',async()=>{throw new Error('timeout');}),e=>e.retryable!==true);
});
test('reminder includes estimates disclaimer and opt-out instructions',()=>{
 const p=reminderEmail({title:'Payday in two days',body:'Estimated pay: $500',id:'id'},'test@example.com',payload.from,'https://budgetwithgift.com');
 assert.match(p.subject,/Gift/);assert.match(p.text,/has not verified a bank deposit/);assert.match(p.text,/Turn off reminder emails/);
});
