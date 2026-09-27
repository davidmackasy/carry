import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('Supabase migration isolates users, preserves revision conflicts, and deletes atomically',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role service_role bypassrls;create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth,public to authenticated,anon;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('request.jwt.claim.email',true)) $$;
 insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
 await db.exec(await readFile(new URL('../supabase/migrations/202609270001_gift.sql',import.meta.url),'utf8'));
 const user=async(id,email)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.email',$2,false)",[id,email]);await db.exec('set role authenticated');};
 const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
 await user(first,'one@example.com');
 let r=await db.query("select public.save_gift_profile($1,0,'2026-09-27',39,100000,2000) as revision",[JSON.stringify({name:'First',reminders:{emailEnabled:true}})]);assert.equal(r.rows[0].revision,1);
 await assert.rejects(db.query("select public.save_gift_profile('{}',0,'2026-09-27',0,0,0)"),/CONFLICT/);
 assert.equal((await db.query('select revision from public.financial_profiles')).rows[0].revision,1);
 await db.query("select public.save_gift_draft('{\"step\":1}',0)");await assert.rejects(db.query("select public.save_gift_draft('{}',0)"),/CONFLICT/);
 await user(second,'two@example.com');
 assert.equal((await db.query('select * from public.financial_profiles')).rows.length,0);
 assert.equal((await db.query('select * from public.setup_drafts')).rows.length,0);
 assert.equal((await db.query('select * from public.email_recipients')).rows.length,0);
 await assert.rejects(db.query('insert into public.financial_profiles(user_id,data) values ($1,$2)',[first,'{}']),/row-level security/);
 await assert.rejects(db.query('insert into public.email_recipients(user_id,email) values ($1,$2)',[second,'victim@example.com']),/row-level security/);
 await db.query("select public.save_gift_profile('{}',0,'2026-09-27',1,100,1)");
 await user(first,'one@example.com');await db.query('select public.erase_gift_profile()');
 assert.equal((await db.query('select * from public.financial_profiles')).rows.length,0);
 assert.equal((await db.query('select * from public.runway_snapshots')).rows.length,0);
 assert.equal((await db.query('select * from public.email_recipients')).rows.length,0);
 await user(second,'two@example.com');assert.equal((await db.query('select * from public.financial_profiles')).rows.length,1);
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.financial_profiles'),/permission denied/);
 await assert.rejects(db.query("select public.save_gift_profile('{}',0,'2026-09-27',1,1,1)"),/permission denied/);
 }finally{await db.close();}
});
