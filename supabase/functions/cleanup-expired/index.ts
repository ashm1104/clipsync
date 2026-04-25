// Spec §20 — runs on a cron, deletes rooms past expires_at and their
// storage objects. Cascade deletes the clip rows.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const nowIso = new Date().toISOString();

  // 1. Find expired rooms.
  const { data: expiredRooms, error: roomsErr } = await supabase
    .from('rooms')
    .select('id')
    .lt('expires_at', nowIso);
  if (roomsErr) {
    return new Response(JSON.stringify({ ok: false, stage: 'list', error: roomsErr.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  let storageRemoved = 0;
  let roomsRemoved = 0;

  for (const room of expiredRooms ?? []) {
    // 2. Pull image/file paths from clips so we can drop them from storage.
    const { data: assets } = await supabase
      .from('clips')
      .select('content')
      .eq('room_id', room.id)
      .in('type', ['image', 'file']);
    const paths = (assets ?? []).map((c) => c.content).filter((p): p is string => !!p);
    if (paths.length) {
      const { error: storageErr } = await supabase.storage.from('clips').remove(paths);
      if (!storageErr) storageRemoved += paths.length;
    }

    // 3. Delete the room — cascades to clips by FK.
    const { error: delErr } = await supabase.from('rooms').delete().eq('id', room.id);
    if (!delErr) roomsRemoved += 1;
  }

  return new Response(
    JSON.stringify({ ok: true, roomsRemoved, storageRemoved, ranAt: nowIso }),
    { headers: { 'content-type': 'application/json' } }
  );
});
