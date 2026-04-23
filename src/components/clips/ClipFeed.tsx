import type { Clip } from '../../hooks/useRoom';
import TextClip from './TextClip';
import RichClip from './RichClip';
import CodeClip from './CodeClip';
import ImageClip from './ImageClip';
import UrlClip from './UrlClip';

type Props = { clips: Clip[]; emptyLabel?: string };

function renderClip(clip: Clip) {
  switch (clip.type) {
    case 'rich_text':
      return <RichClip key={clip.id} clip={clip} />;
    case 'code':
      return <CodeClip key={clip.id} clip={clip} />;
    case 'image':
      return <ImageClip key={clip.id} clip={clip} />;
    case 'url':
      return <UrlClip key={clip.id} clip={clip} />;
    case 'text':
    case 'file':
    default:
      return <TextClip key={clip.id} clip={clip} />;
  }
}

export default function ClipFeed({ clips, emptyLabel }: Props) {
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
  return <div className="flex flex-col gap-3">{clips.map(renderClip)}</div>;
}
