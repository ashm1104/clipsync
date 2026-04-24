import { useLocalClips } from '../../hooks/useLocalClips';
import { useRoomTimer } from '../../hooks/useTimer';

const TYPE_LABEL: Record<string, string> = {
  text: 'text',
  rich_text: 'rich',
  code: 'code',
  image: 'image',
  url: 'url',
  file: 'file',
};

type Props = { expiresAtMs: number | null };

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

export default function HistoryStrip({ expiresAtMs }: Props) {
  const clips = useLocalClips();
  const { state, label } = useRoomTimer(expiresAtMs);

  const timerColor =
    state === 'red'
      ? 'var(--red-text)'
      : state === 'amber'
      ? 'var(--amber-text)'
      : state === 'expired'
      ? 'var(--text-tertiary)'
      : 'var(--text-tertiary)';

  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-tertiary">History</span>
        {expiresAtMs != null && (
          <span className="text-xs" style={{ color: timerColor }}>
            {state === 'expired' ? 'expired' : label}
          </span>
        )}
      </div>
      {clips.length === 0 ? (
        <div className="text-xs text-text-tertiary">
          Your clips from this browser will show here.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {clips.slice(0, 8).map((c) => {
            const preview =
              c.type === 'image'
                ? '[image]'
                : c.type === 'rich_text'
                ? c.content.replace(/<[^>]+>/g, '').slice(0, 48) || '[rich text]'
                : c.content.slice(0, 48);
            return (
              <li key={c.id} className="flex items-center gap-2 text-xs">
                <Swatch type={c.type} />
                <span
                  className="shrink-0 rounded-pill px-1.5 py-0.5 text-[10px] uppercase"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                >
                  {TYPE_LABEL[c.type] ?? c.type}
                </span>
                <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {preview}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
