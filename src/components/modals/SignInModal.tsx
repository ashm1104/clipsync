import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';

type Stage = 'choose' | 'magic_sent' | 'error';

export default function SignInModal() {
  const open = useAppStore((s) => s.signInModalOpen);
  const close = useAppStore((s) => s.closeSignIn);
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('choose');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const handleGoogle = async () => {
    setBusy(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setErrorMsg(error.message);
      setStage('error');
    }
    setBusy(false);
  };

  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      setStage('error');
      return;
    }
    setStage('magic_sent');
  };

  const handleClose = () => {
    setStage('choose');
    setErrorMsg('');
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[420px] rounded-modal p-6"
        style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              Save your clipboard forever
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Free. No credit card. Sync across all your devices.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {stage === 'magic_sent' ? (
          <div className="mt-5">
            <div
              className="rounded-card p-4 text-sm"
              style={{
                background: 'var(--green-light)',
                border: '0.5px solid var(--green-primary)',
                color: 'var(--green-text)',
              }}
            >
              <div className="font-medium">Check your inbox</div>
              <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                We sent a magic link to <strong>{email}</strong>. Open it on this device to sign in.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStage('choose')}
              className="mt-4 w-full rounded-btn px-3 py-2 text-sm"
              style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              Use a different method
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2c-2 1.5-4.5 2.4-7.3 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.8l6.3 5.2c-.4.4 6.6-4.8 6.6-15 0-1.2-.1-2.3-.4-3.5z" />
              </svg>
              Continue with Google
            </button>

            <div className="my-4 flex items-center gap-2 text-xs text-text-tertiary">
              <div className="flex-1" style={{ borderTop: '0.5px solid var(--border-subtle)' }} />
              or
              <div className="flex-1" style={{ borderTop: '0.5px solid var(--border-subtle)' }} />
            </div>

            <form onSubmit={handleMagic} className="flex flex-col gap-2">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-btn px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--bg-surface)',
                  border: '0.5px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="rounded-btn px-3 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: '#3B6D11' }}
                onMouseEnter={(e) => {
                  if (!busy) e.currentTarget.style.background = '#27500A';
                }}
                onMouseLeave={(e) => {
                  if (!busy) e.currentTarget.style.background = '#3B6D11';
                }}
              >
                {busy ? 'Sending…' : 'Email me a magic link'}
              </button>
            </form>

            {stage === 'error' && errorMsg && (
              <div
                className="mt-3 rounded-btn p-2 text-xs"
                style={{ background: 'var(--red-light)', color: 'var(--red-text)' }}
              >
                {errorMsg}
              </div>
            )}
          </div>
        )}

        <p className="mt-5 text-xs text-text-tertiary">
          By continuing you agree to terms that don't exist yet because this is Phase 3.
        </p>
      </div>
    </div>
  );
}
