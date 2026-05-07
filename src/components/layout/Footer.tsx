import { Link } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';

export default function Footer() {
  const openFeedback = useAppStore((s) => s.openFeedback);

  return (
    <footer
      className="mt-12 w-full"
      style={{ borderTop: '0.5px solid var(--border-subtle)' }}
    >
      <div className="mx-auto flex max-w-[960px] flex-col items-start gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between md:px-[22px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'var(--text-tertiary)' }}>
          <span className="font-mono" style={{ letterSpacing: '0.05em' }}>
            pastio
          </span>
          <span>© {new Date().getFullYear()}</span>
          <span>·</span>
          <Link to="/privacy" className="transition-colors hover:text-text-primary">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-text-primary">
            Terms
          </Link>
          <Link to="/refunds" className="transition-colors hover:text-text-primary">
            Refunds
          </Link>
          <button
            type="button"
            onClick={openFeedback}
            className="transition-colors hover:text-text-primary"
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            Feedback
          </button>
          <a
            href="https://github.com/ashm1104/clipsync"
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-text-primary"
          >
            GitHub
          </a>
        </div>
        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          Built for the moment between phone and laptop.
        </div>
      </div>
    </footer>
  );
}
