import type { Clip } from '../../hooks/useRoom';

type Props = { clip: Clip; onDelete?: () => void };

const PILLS: Record<string, { bg: string; color: string; label: string }> = {
  text: { bg: 'var(--bg-raised)', color: 'var(--text-secondary)', label: 'text' },
  rich_text: { bg: '#FAEEDA', color: '#633806', label: 'rich text' },
  code: { bg: '#EEEDFE', color: '#3C3489', label: 'code' },
  url: { bg: '#E6F1FB', color: '#185FA5', label: 'url' },
  image: { bg: '#E1F5EE', color: '#085041', label: 'image' },
  file: { bg: 'var(--bg-raised)', color: 'var(--text-secondary)', label: 'file' },
};

export default function TextClip({ clip, onDelete }: Props) {
  const pill = PILLS[clip.type] ?? PILLS.text;
  const mono = clip.type === 'code';

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
          style={{ background: pill.bg, color: pill.color }}
        >
          {pill.label}
          {clip.language && clip.type === 'code' ? ` · ${clip.language}` : ''}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
            style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
          >
            Copy
          </button>
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
      <pre
        className={`whitespace-pre-wrap break-words text-sm ${mono ? 'font-mono' : 'font-sans'}`}
        style={{ color: 'var(--text-primary)', margin: 0 }}
      >
        {clip.content}
      </pre>
    </div>
  );
}
