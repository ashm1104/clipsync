import type { Clip } from '../../hooks/useRoom';
import TextClip from './TextClip';

type Props = { clips: Clip[]; emptyLabel?: string };

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
  return (
    <div className="flex flex-col gap-3">
      {clips.map((c) => (
        <TextClip key={c.id} clip={c} />
      ))}
    </div>
  );
}
