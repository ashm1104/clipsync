import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';

type RoomRow = {
  id: string;
  slug: string;
  custom_slug: string | null;
  expires_at: string;
  password_hash: string | null;
};

function shortRemaining(expiresAtMs: number): string {
  const ms = expiresAtMs - Date.now();
  if (ms <= 0) return 'expired';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MyRoomsPanel() {
  const userId = useAppStore((s) => s.userId);
  const [rooms, setRooms] = useState<RoomRow[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id,slug,custom_slug,expires_at,password_hash')
        .eq('owner_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      if (!cancelled) setRooms((data ?? []) as RoomRow[]);
    })();
    const channel = supabase
      .channel(`my-rooms:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `owner_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRooms((prev) => [payload.new as RoomRow, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string } | null)?.id;
            if (oldId) setRooms((prev) => prev.filter((r) => r.id !== oldId));
          }
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="text-xs uppercase tracking-wider text-text-tertiary">Your rooms</div>
      {rooms.length === 0 ? (
        <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Rooms you create will appear here.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {rooms.map((r) => {
            const display = r.custom_slug ?? r.slug;
            const remaining = shortRemaining(new Date(r.expires_at).getTime());
            return (
              <li key={r.id}>
                <Link
                  to={`/r/${display}`}
                  className="flex items-center justify-between gap-2 rounded-btn px-2 py-1.5 transition-colors hover:bg-bg-surface"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {r.password_hash && (
                      <span aria-label="password protected" title="Password-protected">🔒</span>
                    )}
                    <span className="truncate font-mono text-sm" style={{ letterSpacing: '0.05em' }}>
                      {display}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {remaining}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
