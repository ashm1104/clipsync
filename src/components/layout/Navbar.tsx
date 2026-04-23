import { Link } from 'react-router-dom';

export default function Navbar() {
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
          <button
            type="button"
            disabled
            className="rounded-btn px-3 py-1.5 text-sm text-text-tertiary"
            style={{ border: '0.5px solid var(--border-subtle)' }}
            title="Sign-in arrives in Phase 3"
          >
            Sign in
          </button>
        </nav>
      </div>
    </header>
  );
}
