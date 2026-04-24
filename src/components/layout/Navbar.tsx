import { Link } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { supabase } from '../../lib/supabase';
import { clearCurrentRoomSlug, clearLocalClips } from '../../lib/localStorage';

export default function Navbar() {
  const openSignIn = useAppStore((s) => s.openSignIn);
  const isAnon = useAppStore((s) => s.isAnonymous);
  const userId = useAppStore((s) => s.userId);
  const pushToast = useAppStore((s) => s.pushToast);

  const handleSignOut = async () => {
    clearLocalClips();
    clearCurrentRoomSlug();
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
      <div className="mx-auto flex max-w-[960px] items-center justify-between px-[22px] py-3">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="font-mono text-base font-medium"
            style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}
          >
            clipsync
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
          )}
        </nav>
      </div>
    </header>
  );
}
