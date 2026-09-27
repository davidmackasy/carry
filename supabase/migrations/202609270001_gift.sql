-- Apply once in Supabase SQL Editor. Existing Sites data is not modified.
begin;
create table if not exists public.financial_profiles (user_id uuid primary key references auth.users(id) on delete cascade, data jsonb not null, revision integer not null default 1 check (revision>0), updated_at timestamptz not null default now());
create table if not exists public.setup_drafts (user_id uuid primary key references auth.users(id) on delete cascade, data jsonb not null, revision integer not null default 1 check (revision>0), updated_at timestamptz not null default now());
create table if not exists public.runway_snapshots (user_id uuid references auth.users(id) on delete cascade, date date not null, runway integer not null, balance bigint not null, safe bigint not null, primary key(user_id,date));
create table if not exists public.email_recipients (user_id uuid primary key references auth.users(id) on delete cascade, email text not null, enabled boolean not null default false);
create table if not exists public.email_deliveries (id text primary key,user_id uuid not null references auth.users(id) on delete cascade,status text not null,created_at timestamptz not null default now(),claimed_at timestamptz not null default now(),payload jsonb not null default '{}',provider_id text);
create table if not exists public.job_heartbeats (id text primary key,created_at timestamptz not null default now());
create table if not exists public.audit_events (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,action text not null,created_at timestamptz not null default now());

alter table public.financial_profiles enable row level security;
alter table public.setup_drafts enable row level security;
alter table public.runway_snapshots enable row level security;
alter table public.email_recipients enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.job_heartbeats enable row level security;
alter table public.audit_events enable row level security;
create policy own_profile on public.financial_profiles for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy own_draft on public.setup_drafts for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy own_snapshot on public.runway_snapshots for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy own_recipient on public.email_recipients for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and email=(select auth.jwt()->>'email'));
create policy own_delivery_read on public.email_deliveries for select to authenticated using (user_id=(select auth.uid()));
create policy own_delivery_delete on public.email_deliveries for delete to authenticated using (user_id=(select auth.uid()));
create policy heartbeat_read on public.job_heartbeats for select to authenticated using (true);
create policy own_audit_insert on public.audit_events for insert to authenticated with check (user_id=(select auth.uid()));
grant select,insert,update,delete on public.financial_profiles,public.setup_drafts,public.runway_snapshots,public.email_recipients to authenticated;
revoke all on public.email_deliveries,public.job_heartbeats,public.audit_events from authenticated;
grant select(user_id),delete on public.email_deliveries to authenticated;
grant all on public.financial_profiles,public.setup_drafts,public.runway_snapshots,public.email_recipients,public.email_deliveries,public.job_heartbeats,public.audit_events to service_role;
grant select on public.job_heartbeats to authenticated;
grant insert on public.audit_events to authenticated;
revoke all on public.financial_profiles,public.setup_drafts,public.runway_snapshots,public.email_recipients,public.email_deliveries,public.job_heartbeats,public.audit_events from anon;

create or replace function public.save_gift_profile(p_data jsonb,p_revision integer,p_date date,p_runway integer,p_balance bigint,p_safe bigint) returns integer language plpgsql security invoker set search_path='' as $$
declare next_revision integer;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 insert into public.financial_profiles(user_id,data,revision) select auth.uid(),p_data,1 where p_revision=0
 on conflict(user_id) do nothing returning revision into next_revision;
 if next_revision is null then
  update public.financial_profiles set data=p_data,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=p_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'CONFLICT'; end if;
 insert into public.email_recipients(user_id,email,enabled) values(auth.uid(),auth.jwt()->>'email',coalesce((p_data->'reminders'->>'emailEnabled')::boolean,false)) on conflict(user_id) do update set email=excluded.email,enabled=excluded.enabled;
 insert into public.runway_snapshots(user_id,date,runway,balance,safe) values(auth.uid(),p_date,p_runway,p_balance,p_safe) on conflict(user_id,date) do update set runway=excluded.runway,balance=excluded.balance,safe=excluded.safe;
 return next_revision;
end $$;
create or replace function public.save_gift_draft(p_data jsonb,p_revision integer) returns integer language plpgsql security invoker set search_path='' as $$
declare next_revision integer;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 insert into public.setup_drafts(user_id,data,revision) select auth.uid(),p_data,1 where p_revision=0 on conflict(user_id) do nothing returning revision into next_revision;
 if next_revision is null then update public.setup_drafts set data=p_data,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=p_revision returning revision into next_revision; end if;
 if next_revision is null then raise exception 'CONFLICT'; end if;
 return next_revision;
end $$;
create or replace function public.erase_gift_profile() returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 delete from public.setup_drafts where user_id=auth.uid();
 delete from public.email_recipients where user_id=auth.uid();
 delete from public.email_deliveries where user_id=auth.uid();
 delete from public.runway_snapshots where user_id=auth.uid();
 delete from public.financial_profiles where user_id=auth.uid();
 insert into public.audit_events(user_id,action) values(auth.uid(),'financial_data_deleted');
end $$;
revoke all on function public.save_gift_profile(jsonb,integer,date,integer,bigint,bigint),public.save_gift_draft(jsonb,integer),public.erase_gift_profile() from public,anon;
grant execute on function public.save_gift_profile(jsonb,integer,date,integer,bigint,bigint),public.save_gift_draft(jsonb,integer),public.erase_gift_profile() to authenticated;
commit;
