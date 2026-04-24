import { useState } from 'react';
import { hashPassword } from '../../lib/rooms';

type Props = {
  slug: string;
  expectedHash: string;
  onUnlock: () => void;
};

export default function PasswordGate({ slug, expectedHash, onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const h = await hashPassword(password);
      if (h !== expectedHash) {
        setErr('Wrong password');
        return;
      }
      onUnlock();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-[460px] px-[22px] py-16">
      <form
        onSubmit={submit}
        className="rounded-card p-6"
        style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
      >
        <div className="text-xs uppercase tracking-wider text-text-tertiary">Protected room</div>
        <h1 className="mt-1 font-mono text-lg" style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
          /r/{slug}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          This room requires a password to join.
        </p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="mt-4 w-full rounded-btn px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        />
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
          disabled={busy || !password.trim()}
          className="mt-4 w-full rounded-btn px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: '#3B6D11' }}
        >
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </main>
  );
}
