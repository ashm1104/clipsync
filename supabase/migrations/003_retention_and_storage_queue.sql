-- Retention cleanup for Personal Sync + storage cleanup queue.
-- Free users keep 24h of personal_clips; Pro users keep 7 days.
-- Image/file paths get enqueued so the cleanup-expired Edge Function
-- can drain them from the storage bucket on a schedule.

create table if not exists public.storage_cleanup_queue (
  id          uuid primary key default uuid_generate_v4(),
  bucket      text not null,
  path        text not null,
  queued_at   timestamptz not null default now(),
  attempts    int  not null default 0
);

alter table public.storage_cleanup_queue enable row level security;
-- service_role only; no client policies.

drop function if exists public.cleanup_expired_rooms();

create or replace function public.cleanup_expired_rooms()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rooms_removed int := 0;
begin
  insert into public.storage_cleanup_queue (bucket, path)
  select 'clips', c.content
    from public.clips c
    join public.rooms r on r.id = c.room_id
   where r.expires_at < now()
     and c.type in ('image','file')
     and c.content is not null;

  with del as (
    delete from public.rooms where expires_at < now() returning 1
  )
  select count(*)::int into v_rooms_removed from del;

  return v_rooms_removed;
end;
$$;

revoke all on function public.cleanup_expired_rooms() from public, anon, authenticated;
grant execute on function public.cleanup_expired_rooms() to service_role;

create or replace function public.cleanup_old_personal_clips()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int := 0;
begin
  insert into public.storage_cleanup_queue (bucket, path)
  select 'clips', pc.content
    from public.personal_clips pc
    left join public.profiles p on p.id = pc.user_id
   where pc.type in ('image','file')
     and pc.content is not null
     and (
       (coalesce(p.plan, 'free') = 'free' and pc.created_at < now() - interval '24 hours')
       or (p.plan = 'pro' and pc.created_at < now() - interval '7 days')
     );

  with del as (
    delete from public.personal_clips pc
    using public.profiles p
    where pc.user_id = p.id
      and (
        (coalesce(p.plan, 'free') = 'free' and pc.created_at < now() - interval '24 hours')
        or (p.plan = 'pro' and pc.created_at < now() - interval '7 days')
      )
    returning 1
  )
  select count(*)::int into v_deleted from del;

  return v_deleted;
end;
$$;

revoke all on function public.cleanup_old_personal_clips() from public, anon, authenticated;
grant execute on function public.cleanup_old_personal_clips() to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'clipsync-cleanup-personal-clips') then
    perform cron.unschedule('clipsync-cleanup-personal-clips');
  end if;
end $$;

select cron.schedule(
  'clipsync-cleanup-personal-clips',
  '15 * * * *',
  $cron$ select public.cleanup_old_personal_clips(); $cron$
);
