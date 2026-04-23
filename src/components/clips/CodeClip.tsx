import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import type { Clip } from '../../hooks/useRoom';

export default function CodeClip({ clip }: { clip: Clip }) {
  const [html, setHtml] = useState<string>('');
  const lang = clip.language || 'plaintext';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await codeToHtml(clip.content ?? '', {
          lang,
          theme: 'github-light',
        });
        if (!cancelled) setHtml(out);
      } catch {
        if (!cancelled) setHtml('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clip.content, lang]);

  const copy = async () => {
    if (clip.content) await navigator.clipboard.writeText(clip.content);
  };

  return (
    <div
      className="rounded-card bg-bg-card p-4"
      style={{ border: '0.5px solid var(--border-default)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded-pill px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
          style={{ background: '#EEEDFE', color: '#3C3489' }}
        >
          code · {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          Copy
        </button>
      </div>
      {html ? (
        <div
          className="overflow-x-auto rounded-btn p-3 text-[13px]"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          className="overflow-x-auto whitespace-pre rounded-btn p-3 font-mono text-[13px]"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-primary)', margin: 0 }}
        >
          {clip.content}
        </pre>
      )}
    </div>
  );
}
