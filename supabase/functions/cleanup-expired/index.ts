// Storage sweeper. Reads public.storage_cleanup_queue (populated by the
// SQL retention crons) and removes those objects from the 'clips' bucket.
//
// Auth: a shared secret in the X-Cleanup-Secret header MUST match the
// CLEANUP_SECRET env var. We deploy with verify_jwt: false so the cron
// caller can be a plain HTTPS hit (e.g. cron-job.org / EasyCron / GitHub
// Actions) without a Supabase JWT. The shared secret has zero blast
// radius beyond triggering this one cleanup function.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BATCH_SIZE = 100; // S3 remove() takes a list; cap per call.

Deno.serve(async (req) => {
  const secret = Deno.env.get('CLEANUP_SECRET');
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: 'CLEANUP_SECRET not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const provided = req.headers.get('x-cleanup-secret');
  if (provided !== secret) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let totalDeleted = 0;
  let totalAttempted = 0;

  for (let i = 0; i < 10; i += 1) {
    const { data: rows, error: fetchErr } = await supabase
      .from('storage_cleanup_queue')
      .select('id, bucket, path')
      .order('queued_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchErr) {
      return new Response(
        JSON.stringify({ ok: false, stage: 'fetch', error: fetchErr.message }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
    if (!rows || rows.length === 0) break;

    totalAttempted += rows.length;

    // Group by bucket so we hit the storage API once per bucket per batch.
    const byBucket = new Map<string, { id: string; path: string }[]>();
    for (const row of rows) {
      const arr = byBucket.get(row.bucket) ?? [];
      arr.push({ id: row.id, path: row.path });
      byBucket.set(row.bucket, arr);
    }

    const successfullyDeletedIds: string[] = [];

    for (const [bucket, items] of byBucket) {
      const paths = items.map((it) => it.path);
      const { error: removeErr } = await supabase.storage.from(bucket).remove(paths);
      if (!removeErr) {
        successfullyDeletedIds.push(...items.map((it) => it.id));
      }
      // If the remove call itself fails, leave queue rows in place; the
      // next run will retry. We bump attempts so a poison row eventually
      // shows up.
    }

    if (successfullyDeletedIds.length > 0) {
      await supabase.from('storage_cleanup_queue').delete().in('id', successfullyDeletedIds);
      totalDeleted += successfullyDeletedIds.length;
    } else {
      // Bump attempts so we don't infinite-loop on poison rows.
      await supabase
        .from('storage_cleanup_queue')
        .update({ attempts: 1 })
        .in('id', rows.map((r) => r.id));
      break;
    }

    if (rows.length < BATCH_SIZE) break;
  }

  return new Response(
    JSON.stringify({ ok: true, deleted: totalDeleted, attempted: totalAttempted }),
    { headers: { 'content-type': 'application/json' } }
  );
});
