import type { Clip } from '../../hooks/useRoom';
import { publicImageUrl } from '../../lib/storage';

export default function FileClip({ clip }: { clip: Clip }) {
  const href = clip.content ? publicImageUrl(clip.content) : '';
  const name = clip.og_title || clip.content?.split('/').pop() || 'file';
  const sizeKb = clip.size_bytes ? Math.round(clip.size_bytes / 1024) : null;

  return (
    <div
      className="rounded-card bg-bg-card p-4"
      style={{ border: '0.5px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="rounded-pill px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
            style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
          >
            file{sizeKb ? ` · ${sizeKb} KB` : ''}
          </span>
          <span
            className="truncate text-sm"
            style={{ color: 'var(--text-primary)' }}
            title={name}
          >
            {name}
          </span>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          download={name}
          className="shrink-0 rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          Download
        </a>
      </div>
    </div>
  );
}
