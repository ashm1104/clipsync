import { useState } from 'react';
import { useLocalClips } from '../../hooks/useLocalClips';
import { supabase } from '../../lib/supabase';
import { removeLocalClip, type LocalClip } from '../../lib/localStorage';
import { useAppStore } from '../../stores/appStore';
import HistoryPreviewModal from './HistoryPreviewModal';

const TYPE_LABEL: Record<string, string> = {
  text: 'text',
  rich_text: 'rich',
  code: 'code',
  image: 'image',
  url: 'url',
  file: 'file',
};

type Props = {
  // Slugs the current room is reachable by. Local clips are filtered to
  // those whose roomSlug matches one of these — keeps history scoped to
  // the room you're looking at, even if multiple anon rooms exist in the
  // same browser's localStorage.
  roomSlugs?: (string | null | undefined)[];
};

function Swatch({ type }: { type: string }) {
  const bg =
    type === 'rich_text'
      ? '#FAEEDA'
      : type === 'code'
      ? '#EEEDFE'
      : type === 'image'
      ? '#E1F5EE'
      : type === 'url'
      ? '#E6F1FB'
      : 'var(--bg-raised)';
  return (
    <div
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ background: bg, border: '0.5px solid var(--border-subtle)' }}
    />
  );
}

export default function HistoryStrip({ roomSlugs }: Props) {
  const allClips = useLocalClips();
  const validSlugs = (roomSlugs ?? []).filter(Boolean) as string[];
  // No slug yet (e.g. fresh tab before a room is created): show nothing,
  // not the whole localStorage history. Otherwise filter to this room only.
  const clips = validSlugs.length
    ? allClips.filter((c) => validSlugs.includes(c.roomSlug))
    : [];
  const pushToast = useAppStore((s) => s.pushToast);
  const [preview, setPreview] = useState<LocalClip | null>(null);

  const handleDelete = async (id: string) => {
    removeLocalClip(id);
    const { error } = await supabase.from('clips').delete().eq('id', id);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not delete', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Removed from history' });
  };

  const handleClearAll = async () => {
    const ids = clips.map((c) => c.id);
    if (!ids.length) return;
    ids.forEach(removeLocalClip);
    const { error } = await supabase.from('clips').delete().in('id', ids);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not clear', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'History cleared' });
  };

  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-text-tertiary">History</span>
        <div className="flex items-center gap-2">
          {clips.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] underline-offset-2 transition-colors hover:underline"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {clips.length === 0 ? (
        <div className="text-xs text-text-tertiary">
          Clips you've sent from this browser will appear here.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {clips.slice(0, 8).map((c) => {
            const previewText =
              c.type === 'image'
                ? '[image]'
                : c.type === 'rich_text'
                ? c.content.replace(/<[^>]+>/g, '').slice(0, 48) || '[rich text]'
                : c.content.slice(0, 48);
            return (
              <li key={c.id} className="group flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPreview(c)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-btn px-1 py-0.5 text-left transition-colors hover:bg-bg-surface"
                  title="Click to preview"
                >
                  <Swatch type={c.type} />
                  <span
                    className="shrink-0 rounded-pill px-1.5 py-0.5 text-[10px] uppercase"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                  >
                    {TYPE_LABEL[c.type] ?? c.type}
                  </span>
                  <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                    {previewText}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  aria-label="Remove from history"
                  title="Remove"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-btn text-sm leading-none transition-colors hover:text-text-primary"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '0.5px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <HistoryPreviewModal clip={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
