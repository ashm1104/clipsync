-- Hourly cron-driven cleanup. plpgsql function called directly by
-- pg_cron — no service-role key stored anywhere reachable from SQL.
--
-- Trade-off: we delete the rooms (cascading to clips) but DO NOT
-- delete the underlying storage objects, because Supabase blocks
-- direct DELETE on storage.objects via a guard trigger and the
-- alternative (calling the Storage REST API from Postgres) requires
-- a service-role token. Storage objects therefore orphan until the
-- cleanup-expired Edge Function is invoked manually for storage
-- sweeping. DB cost is the only thing we hold to spec; the few KB
-- of orphaned bytes are acceptable until we add a Vault-backed
-- storage sweep.

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
  with del as (
    delete from public.rooms where expires_at < now() returning 1
  )
  select count(*)::int into v_rooms_removed from del;
  return v_rooms_removed;
end;
$$;

revoke all on function public.cleanup_expired_rooms() from public, anon, authenticated;
grant execute on function public.cleanup_expired_rooms() to service_role;

-- Schedule: top of every hour. Idempotent re-schedule.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'clipsync-cleanup-expired') then
    perform cron.unschedule('clipsync-cleanup-expired');
  end if;
end $$;

select cron.schedule(
  'clipsync-cleanup-expired',
  '0 * * * *',
  $cron$ select public.cleanup_expired_rooms(); $cron$
);
