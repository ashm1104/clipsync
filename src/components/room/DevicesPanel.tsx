import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';
import { getClientId } from '../../hooks/useDeviceRegistration';

type DeviceRow = {
  id: string;
  client_id: string;
  name: string;
  last_seen_at: string;
  created_at: string;
};

function shortAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DevicesPanel() {
  const userId = useAppStore((s) => s.userId);
  const plan = useAppStore((s) => s.plan);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const pushToast = useAppStore((s) => s.pushToast);
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const here = getClientId();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('devices')
        .select('id,client_id,name,last_seen_at,created_at')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });
      if (!cancelled) setRows((data ?? []) as DeviceRow[]);
    })();
    const ch = supabase
      .channel(`devices:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRows((prev) => [payload.new as DeviceRow, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            const old = (payload.old as DeviceRow | null)?.id;
            if (old) setRows((prev) => prev.filter((r) => r.id !== old));
          } else if (payload.eventType === 'UPDATE') {
            const next = payload.new as DeviceRow;
            setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)));
          }
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [userId]);

  const remove = async (id: string, isCurrent: boolean) => {
    if (isCurrent) {
      pushToast({
        kind: 'info',
        title: 'Sign out from the navbar',
        body: 'Use Sign out to remove this device.',
      });
      return;
    }
    const { error } = await supabase.from('devices').delete().eq('id', id);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not remove device', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Device removed' });
  };

  const isFree = plan !== 'pro';
  const overCap = isFree && rows.length >= 2;

  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-tertiary">Devices</span>
        {isFree && (
          <span
            className="rounded-pill px-1.5 py-0.5 text-[10px]"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}
          >
            {rows.length}/2 free
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Signed-in browsers will appear here.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {rows.map((d) => {
            const isCurrent = d.client_id === here;
            return (
              <li
                key={d.id}
                className="group flex items-center justify-between gap-2 rounded-btn px-2 py-1.5"
                style={{ background: isCurrent ? 'var(--green-light, #EAF3DE)' : 'transparent' }}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                    {d.name}
                    {isCurrent && (
                      <span
                        className="ml-2 rounded-pill px-1 py-0.5 text-[9px] uppercase"
                        style={{ background: '#3B6D11', color: 'white' }}
                      >
                        This
                      </span>
                    )}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {shortAgo(d.last_seen_at)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(d.id, isCurrent)}
                  aria-label="Remove device"
                  title={isCurrent ? 'Sign out from the navbar' : 'Remove'}
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {overCap && (
        <button
          type="button"
          onClick={() => openUpgrade('third_device')}
          className="mt-3 w-full rounded-btn px-3 py-2 text-xs transition-colors"
          style={{
            background: 'var(--amber-light, #FAEEDA)',
            border: '0.5px solid var(--amber-border, #FAC775)',
            color: 'var(--amber-text, #633806)',
          }}
        >
          Pro syncs unlimited devices →
        </button>
      )}
    </div>
  );
}
