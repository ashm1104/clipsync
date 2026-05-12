import { useMemo, useState } from 'react';
import type { Clip } from '../../hooks/useRoom';
import { useAppStore } from '../../stores/appStore';

function hostname(url: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function faviconUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain=${u.hostname}`;
  } catch {
    return null;
  }
}

export default function UrlClip({ clip, onDelete }: { clip: Clip; onDelete?: () => void }) {
  const host = useMemo(() => hostname(clip.content), [clip.content]);
  const favicon = useMemo(() => faviconUrl(clip.content), [clip.content]);
  const hasPreview = !!(clip.og_title || clip.og_desc || clip.og_image);
  const [copied, setCopied] = useState(false);

  const href = clip.content ?? '#';

  const pushToast = useAppStore((s) => s.pushToast);
  const copyUrl = async () => {
    if (!clip.content) return;
    await navigator.clipboard.writeText(clip.content);
    setCopied(true);
    pushToast({ kind: 'success', title: 'URL copied to clipboard' });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="rounded-card bg-bg-card p-4"
      style={{ border: '0.5px solid var(--border-default)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded-pill px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
          style={{ background: '#E6F1FB', color: '#185FA5' }}
        >
          url
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyUrl}
            className="rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
            style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
          >
            {copied ? 'Copied' : 'Copy URL'}
          </button>
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
            style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
          >
            Open link
          </a>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete clip"
              title="Delete"
              className="flex h-[26px] w-[26px] items-center justify-center rounded-btn text-sm leading-none text-text-tertiary transition-colors hover:text-text-primary"
              style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {hasPreview ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="block overflow-hidden rounded-btn"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          {clip.og_image && (
            <img
              src={clip.og_image}
              alt=""
              className="block max-h-[180px] w-full object-cover"
              onError={(e) => ((e.currentTarget.style.display = 'none'))}
            />
          )}
          <div className="p-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {favicon && <img src={favicon} alt="" className="h-4 w-4 rounded-sm" />}
              <span>{host}</span>
            </div>
            {clip.og_title && (
              <div className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                {clip.og_title}
              </div>
            )}
            {clip.og_desc && (
              <div className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {clip.og_desc}
              </div>
            )}
            <div
              className="mt-2 truncate font-mono text-[11px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {clip.content}
            </div>
          </div>
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-btn p-3"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          {favicon ? (
            <img src={favicon} alt="" className="h-6 w-6 rounded-sm" />
          ) : (
            <div className="h-6 w-6 rounded-sm" style={{ background: 'var(--bg-raised)' }} />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
              {clip.content}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              no preview available · click to open
            </div>
          </div>
        </a>
      )}
    </div>
  );
}
