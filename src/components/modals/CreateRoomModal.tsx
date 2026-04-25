import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { createRoom, type RoomExpiry } from '../../lib/rooms';

const EXPIRY_OPTIONS: { value: RoomExpiry; label: string; pro: boolean }[] = [
  { value: '1h', label: '1 hour', pro: false },
  { value: '24h', label: '24 hours', pro: false },
  { value: '7d', label: '7 days', pro: true },
];

export default function CreateRoomModal() {
  const open = useAppStore((s) => s.createRoomModalOpen);
  const close = useAppStore((s) => s.closeCreateRoom);
  const plan = useAppStore((s) => s.plan);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const pushToast = useAppStore((s) => s.pushToast);

  const [expiry, setExpiry] = useState<RoomExpiry>('24h');
  const [customSlug, setCustomSlug] = useState('');
  const [password, setPassword] = useState('');
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;
  const isPro = plan === 'pro';

  const handleExpirySelect = (o: (typeof EXPIRY_OPTIONS)[number]) => {
    if (o.pro && !isPro) {
      openUpgrade('expiry_7d');
      return;
    }
    setExpiry(o.value);
  };

  const togglePassword = () => {
    if (!isPro) {
      openUpgrade('password_room');
      return;
    }
    setUsePassword((v) => !v);
  };

  const toggleCustomSlug = () => {
    if (!isPro) {
      openUpgrade('custom_slug');
      return;
    }
    setUseCustomSlug((v) => !v);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const room = await createRoom({
        expiry,
        customSlug: useCustomSlug && isPro ? customSlug : null,
        password: usePassword && isPro ? password : null,
      });
      const joinSlug = room.custom_slug ?? room.slug;
      pushToast({
        kind: 'success',
        title: 'Room created',
        body: `/r/${joinSlug} is live for ${EXPIRY_OPTIONS.find((o) => o.value === expiry)?.label}.`,
      });
      close();
      window.open(`/r/${joinSlug}`, '_blank', 'noopener,noreferrer');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not create room');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={close}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-[460px] rounded-modal p-6"
        style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            New room
          </h2>
          <button
            type="button"
            onClick={close}
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-text-tertiary">Expires in</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {EXPIRY_OPTIONS.map((o) => {
              const locked = o.pro && !isPro;
              const selected = !locked && expiry === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleExpirySelect(o)}
                  className="relative rounded-btn px-3 py-2 text-sm transition-colors"
                  style={{
                    background: selected ? '#EAF3DE' : 'var(--bg-surface)',
                    border: `0.5px solid ${selected ? '#3B6D11' : 'var(--border-subtle)'}`,
                    color: locked ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    opacity: locked ? 0.55 : 1,
                    cursor: 'pointer',
                  }}
                >
                  {o.label}
                  {o.pro && !isPro && (
                    <span
                      className="ml-1 rounded-pill px-1 py-0.5 text-[9px] font-medium uppercase"
                      style={{ background: '#3B6D11', color: 'white' }}
                    >
                      Pro
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Custom code
            {!isPro && (
              <span
                className="ml-2 rounded-pill px-1 py-0.5 text-[9px] font-medium uppercase"
                style={{ background: '#3B6D11', color: 'white' }}
              >
                Pro
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={toggleCustomSlug}
            className="rounded-pill px-2 py-0.5 text-xs transition-colors"
            style={{
              background: useCustomSlug && isPro ? '#3B6D11' : 'var(--bg-surface)',
              color: useCustomSlug && isPro ? 'white' : 'var(--text-secondary)',
              border: '0.5px solid var(--border-subtle)',
              opacity: isPro ? 1 : 0.55,
            }}
          >
            {useCustomSlug && isPro ? 'on' : 'off'}
          </button>
        </div>
        {useCustomSlug && isPro && (
          <input
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-z0-9-]/gi, ''))}
            placeholder="design-standup"
            className="mt-2 w-full rounded-btn px-3 py-2 font-mono text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '0.5px solid var(--border-default)',
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
            }}
          />
        )}

        <div className="mt-4 flex items-center justify-between">
          <label className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Password-protect
            {!isPro && (
              <span
                className="ml-2 rounded-pill px-1 py-0.5 text-[9px] font-medium uppercase"
                style={{ background: '#3B6D11', color: 'white' }}
              >
                Pro
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={togglePassword}
            className="rounded-pill px-2 py-0.5 text-xs transition-colors"
            style={{
              background: usePassword && isPro ? '#3B6D11' : 'var(--bg-surface)',
              color: usePassword && isPro ? 'white' : 'var(--text-secondary)',
              border: '0.5px solid var(--border-subtle)',
              opacity: isPro ? 1 : 0.55,
            }}
          >
            {usePassword && isPro ? 'on' : 'off'}
          </button>
        </div>
        {usePassword && isPro && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a password"
            className="mt-2 w-full rounded-btn px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '0.5px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
        )}

        {err && (
          <div
            className="mt-3 rounded-btn p-2 text-xs"
            style={{ background: 'var(--red-light)', color: 'var(--red-text)' }}
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || (useCustomSlug && isPro && !customSlug.trim()) || (usePassword && isPro && !password.trim())}
          className="mt-5 w-full rounded-btn px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: '#3B6D11' }}
          onMouseEnter={(e) => {
            if (!busy) e.currentTarget.style.background = '#27500A';
          }}
          onMouseLeave={(e) => {
            if (!busy) e.currentTarget.style.background = '#3B6D11';
          }}
        >
          {busy ? 'Creating…' : 'Create room'}
        </button>
      </form>
    </div>
  );
}
