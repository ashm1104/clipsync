import { useMemo } from 'react';
import type { Clip } from '../../hooks/useRoom';
import { publicImageUrl } from '../../lib/storage';

export default function ImageClip({ clip }: { clip: Clip }) {
  const src = useMemo(() => (clip.content ? publicImageUrl(clip.content) : ''), [clip.content]);

  const sizeKb = clip.size_bytes ? Math.round(clip.size_bytes / 1024) : null;

  return (
    <div
      className="rounded-card bg-bg-card p-4"
      style={{ border: '0.5px solid var(--border-default)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded-pill px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
          style={{ background: '#E1F5EE', color: '#085041' }}
        >
          image{sizeKb ? ` · ${sizeKb} KB` : ''}
        </span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          Open
        </a>
      </div>
      <div
        className="overflow-hidden rounded-btn"
        style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
      >
        {src ? (
          <img
            src={src}
            alt="Clipboard image"
            className="block h-auto max-h-[420px] w-full object-contain"
          />
        ) : (
          <div className="h-32" />
        )}
      </div>
    </div>
  );
}
