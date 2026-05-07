import { Link } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { supabase } from '../../lib/supabase';
import { clearCurrentRoomSlug, clearLocalClips } from '../../lib/localStorage';
import { getCurrentSessionId } from '../../hooks/useDeviceRegistration';

export default function Navbar() {
  const openSignIn = useAppStore((s) => s.openSignIn);
  const isAnon = useAppStore((s) => s.isAnonymous);
  const userId = useAppStore((s) => s.userId);
  const pushToast = useAppStore((s) => s.pushToast);

  const handleSignOut = async () => {
    // Unregister this browser from the devices list before the JWT goes away.
    if (userId) {
      const sessionId = await getCurrentSessionId();
      if (sessionId) {
        await supabase
          .from('devices')
          .delete()
          .eq('user_id', userId)
          .eq('session_id', sessionId);
      }
    }
    clearLocalClips();
    clearCurrentRoomSlug();
    // Clear per-room password unlocks so a new visitor must re-enter.
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('pastio.unlock.')) sessionStorage.removeItem(k);
    }
    await supabase.auth.signOut();
    pushToast({ kind: 'info', title: 'Signed out' });
    // Full reload: resets room state, current-room slug, clip feed, and
    // re-enters the anon flow cleanly.
    setTimeout(() => {
      window.location.href = '/';
    }, 150);
  };

  return (
    <header
      className="w-full"
      style={{ background: 'var(--bg-page)', borderBottom: '0.5px solid var(--border-subtle)' }}
    >
      <div className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-3 md:px-[22px]">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="font-mono text-base font-medium"
            style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}
          >
            pastio
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAnon || !userId ? (
            <button
              type="button"
              onClick={openSignIn}
              className="rounded-btn px-3 py-1.5 text-sm font-medium text-white transition-colors"
              style={{ background: '#3B6D11' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#27500A')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#3B6D11')}
            >
              Sign in
            </button>
          ) : (
            <>
              <Link
                to="/settings"
                className="rounded-btn px-3 py-1.5 text-sm transition-colors"
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                }}
              >
                Settings
              </Link>
              <button
              type="button"
              onClick={handleSignOut}
              className="rounded-btn px-3 py-1.5 text-sm transition-colors"
              style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              Sign out
            </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
