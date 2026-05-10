import type { LocalClip } from '../../lib/localStorage';
import type { Clip } from '../../hooks/useRoom';
import TextClip from '../clips/TextClip';
import RichClip from '../clips/RichClip';
import CodeClip from '../clips/CodeClip';
import ImageClip from '../clips/ImageClip';
import UrlClip from '../clips/UrlClip';
import FileClip from '../clips/FileClip';

type Props = {
  clip: LocalClip | null;
  onClose: () => void;
};

// Adapt a LocalClip into the same Clip shape the per-type renderers
// expect. The local mirror has the right fields (id, type, content,
// language, og_*) — we just stub the room-level fields it doesn't carry.
function asClip(local: LocalClip): Clip {
  return {
    id: local.id,
    room_id: '',
    user_id: null,
    type: local.type as Clip['type'],
    content: local.content,
    language: local.language ?? null,
    og_title: local.og_title ?? null,
    og_desc: local.og_desc ?? null,
    og_image: local.og_image ?? null,
    size_bytes: local.size_bytes ?? null,
    created_at: new Date(local.createdAt).toISOString(),
  };
}

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
    case 'file':
      return <FileClip clip={clip} />;
    default:
      return <TextClip clip={clip} />;
  }
}

export default function HistoryPreviewModal({ clip, onClose }: Props) {
  if (!clip) return null;
  const adapted = asClip(clip);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-modal px-4 py-3"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)', borderBottom: 'none' }}
        >
          <span className="text-xs uppercase tracking-wider text-text-tertiary">
            History · {clip.type}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div
          className="rounded-b-modal p-4"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)', borderTop: 'none' }}
        >
          {renderClip(adapted)}
        </div>
      </div>
    </div>
  );
}
