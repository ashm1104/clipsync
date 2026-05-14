import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';
import { getCurrentSessionId } from '../../hooks/useDeviceRegistration';

type DeviceRow = {
  id: string;
  session_id: string;
  name: string;
  last_seen_at: string;
  created_at: string;
  is_active: boolean;
};

const FREE_SLOTS = 2;

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
  const [hereSessionId, setHereSessionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentSessionId().then((sid) => {
      if (!cancelled) setHereSessionId(sid);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fetchDevices = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('devices')
      .select('id,session_id,name,last_seen_at,created_at,is_active')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false });
    setRows((data ?? []) as DeviceRow[]);
  }, [userId]);

  const handleRefresh = async () => {
    if (!userId || refreshing) return;
    setRefreshing(true);
    await fetchDevices();
    // Brief spin so the click feels acknowledged even on instant fetches.
    setTimeout(() => setRefreshing(false), 400);
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('devices')
        .select('id,session_id,name,last_seen_at,created_at,is_active')
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
            const next = payload.new as DeviceRow;
            setRows((prev) => (prev.some((r) => r.id === next.id) ? prev : [next, ...prev]));
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

  const isFree = plan !== 'pro';
  const activeRows = rows.filter((r) => r.is_active);
  const here = hereSessionId ? rows.find((r) => r.session_id === hereSessionId) : undefined;
  const hereIsActive = !!here?.is_active;

  const remove = async (id: string, isCurrent: boolean) => {
    if (isCurrent) {
      pushToast({
        kind: 'info',
        title: 'Use Sign out',
        body: 'To remove this browser, sign out from the navbar.',
      });
      return;
    }
    const { error } = await supabase.from('devices').delete().eq('id', id);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not remove device', body: error.message });
      return;
    }
    pushToast({
      kind: 'success',
      title: 'Removed from list',
      body: "That browser stays signed in until it's signed out manually.",
    });
  };

  const claimSlot = async () => {
    if (!userId || !here) return;
    // Free: if 2 slots are taken, kick the oldest active out.
    if (isFree && activeRows.length >= FREE_SLOTS) {
      const oldest = [...activeRows]
        .filter((r) => r.id !== here.id)
        .sort((a, b) => +new Date(a.last_seen_at) - +new Date(b.last_seen_at))[0];
      if (oldest) {
        const { error } = await supabase
          .from('devices')
          .update({ is_active: false })
          .eq('id', oldest.id);
        if (error) {
          pushToast({ kind: 'error', title: 'Could not switch slot', body: error.message });
          return;
        }
      }
    }
    const { error } = await supabase
      .from('devices')
      .update({ is_active: true, last_seen_at: new Date().toISOString() })
      .eq('id', here.id);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not switch slot', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Sync moved to this device' });
  };

  const pauseDevice = async (id: string) => {
    const { error } = await supabase.from('devices').update({ is_active: false }).eq('id', id);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not pause', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Slot freed' });
  };

  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-tertiary">Devices</span>
        <div className="flex items-center gap-1.5">
          {isFree && (
            <span
              className="rounded-pill px-1.5 py-0.5 text-[10px]"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}
            >
              {activeRows.length}/{FREE_SLOTS} slots
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || !userId}
            aria-label="Refresh devices"
            title="Refresh"
            className="flex h-[22px] w-[22px] items-center justify-center rounded-btn text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-50"
            style={{ background: 'transparent' }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: refreshing ? 'pastio-spin 0.6s linear' : 'none',
              }}
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Signed-in browsers will appear here.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {rows.map((d) => {
            const isCurrent = d.session_id === hereSessionId;
            const isActive = d.is_active;
            return (
              <li
                key={d.id}
                className="group flex items-center justify-between gap-2 rounded-btn px-2 py-1.5"
                style={{
                  background: isCurrent ? 'var(--green-light, #EAF3DE)' : 'transparent',
                  opacity: isActive ? 1 : 0.6,
                }}
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
                    {!isActive && (
                      <span
                        className="ml-2 rounded-pill px-1 py-0.5 text-[9px] uppercase"
                        style={{ background: 'var(--amber-light, #FAEEDA)', color: 'var(--amber-text, #633806)' }}
                      >
                        Paused
                      </span>
                    )}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {shortAgo(d.last_seen_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isActive && !isCurrent && isFree && (
                    <button
                      type="button"
                      onClick={() => pauseDevice(d.id)}
                      className="rounded-btn px-2 py-0.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      Pause
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(d.id, isCurrent)}
                    aria-label="Remove device"
                    title={isCurrent ? 'Sign out from the navbar' : 'Remove from list'}
                    className="rounded-btn px-2 py-0.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '0.5px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isFree && here && !hereIsActive && (
        <button
          type="button"
          onClick={claimSlot}
          className="mt-3 w-full rounded-btn px-3 py-2 text-xs font-medium text-white transition-colors"
          style={{ background: '#3B6D11' }}
        >
          {activeRows.length >= FREE_SLOTS
            ? `Use this device (replace oldest)`
            : 'Use this device for sync'}
        </button>
      )}

      {isFree && rows.length > FREE_SLOTS && (
        <button
          type="button"
          onClick={() => openUpgrade('third_device')}
          className="mt-2 w-full rounded-btn px-3 py-2 text-xs transition-colors"
          style={{
            background: 'var(--amber-light, #FAEEDA)',
            border: '0.5px solid var(--amber-border, #FAC775)',
            color: 'var(--amber-text, #633806)',
          }}
        >
          Pro syncs all your devices →
        </button>
      )}
    </div>
  );
}
