import type { Clip } from '../../hooks/useRoom';
import TextClip from './TextClip';
import RichClip from './RichClip';
import CodeClip from './CodeClip';
import ImageClip from './ImageClip';
import UrlClip from './UrlClip';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';

type Props = {
  clips: Clip[];
  emptyLabel?: string;
  // Which table the clip lives in. Default 'clips' (rooms). Personal Sync
  // feeds should pass 'personal_clips' instead.
  source?: 'clips' | 'personal_clips';
  // When set, clips with created_at older than this ms-since-epoch cutoff
  // render in a ghost-blurred state with an Upgrade chip. Used for the
  // 30-day-history Pro gate on free Personal Sync.
  blurOlderThan?: number | null;
};

function renderClip(clip: Clip) {
  switch (clip.type) {
    case 'rich_text':
      return <RichClip clip={clip} />;
    case 'code':
      return <CodeClip clip={clip} />;
    case 'image':
      return <ImageClip clip={clip} />;
    case 'url':
      return <UrlClip clip={clip} />;
    case 'text':
    case 'file':
    default:
      return <TextClip clip={clip} />;
  }
}

function ClipRow({
  clip,
  source,
  blurred,
}: {
  clip: Clip;
  source: 'clips' | 'personal_clips';
  blurred: boolean;
}) {
  const myUserId = useAppStore((s) => s.userId);
  const pushToast = useAppStore((s) => s.pushToast);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const canDelete = !!myUserId && clip.user_id === myUserId;

  const handleDelete = async () => {
    const { error } = await supabase.from(source).delete().eq('id', clip.id);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not delete', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Clip deleted' });
  };

  return (
    <div className="group relative">
      <div
        style={
          blurred
            ? { filter: 'blur(4px) grayscale(0.4)', pointerEvents: 'none', userSelect: 'none' }
            : undefined
        }
      >
        {renderClip(clip)}
      </div>
      {blurred && (
        <button
          type="button"
          onClick={() => openUpgrade('history_30d')}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span
            className="rounded-pill px-3 py-1 text-xs font-medium"
            style={{
              background: 'var(--amber-light, #FAEEDA)',
              color: 'var(--amber-text, #633806)',
              border: '0.5px solid var(--amber-border, #FAC775)',
            }}
          >
            30-day history on Pro · Upgrade →
          </span>
        </button>
      )}
      {canDelete && !blurred && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete clip"
          className="absolute right-2 top-2 rounded-btn px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          Delete
        </button>
      )}
    </div>
  );
}

export default function ClipFeed({ clips, emptyLabel, source = 'clips', blurOlderThan = null }: Props) {
  if (!clips.length) {
    return (
      <div
        className="rounded-card p-6 text-center text-sm text-text-tertiary"
        style={{ background: 'var(--bg-surface)', border: '0.5px dashed var(--border-default)' }}
      >
        {emptyLabel ?? 'Your clips will appear here once you paste.'}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {clips.map((c) => {
        const blurred =
          blurOlderThan != null && new Date(c.created_at).getTime() < blurOlderThan;
        return <ClipRow key={c.id} clip={c} source={source} blurred={blurred} />;
      })}
    </div>
  );
}
