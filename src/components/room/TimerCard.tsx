import { useTimer } from '../../hooks/useTimer';

type Props = { createdAtMs: number | null };

const PALETTE = {
  green: {
    bg: 'var(--bg-card)',
    border: 'var(--border-default)',
    color: 'var(--text-secondary)',
    pulse: false,
  },
  amber: {
    bg: 'var(--amber-light)',
    border: 'var(--amber-border)',
    color: 'var(--amber-text)',
    pulse: true,
  },
  red: {
    bg: 'var(--red-light)',
    border: 'var(--red-text)',
    color: 'var(--red-text)',
    pulse: true,
  },
  expired: {
    bg: 'var(--bg-surface)',
    border: 'var(--border-default)',
    color: 'var(--text-tertiary)',
    pulse: false,
  },
} as const;

export default function TimerCard({ createdAtMs }: Props) {
  const { state, label } = useTimer(createdAtMs);
  const pal = PALETTE[state];

  let main = '';
  if (state === 'green') main = `deletes in ${label}`;
  else if (state === 'amber') main = `deletes in ${label}`;
  else if (state === 'red') main = `deletes in ${label} · Save now`;
  else main = 'This was here. Sign in so it never disappears.';

  return (
    <div
      className="rounded-card p-4"
      style={{
        background: pal.bg,
        border: `0.5px solid ${pal.border}`,
        color: pal.color,
      }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: pal.color,
            animation: pal.pulse ? 'breathe 2s ease-in-out infinite' : undefined,
          }}
        />
        Clipboard timer
      </div>
      <div className="mt-1 text-sm font-medium">{main}</div>
      {createdAtMs == null && (
        <div className="mt-1 text-xs opacity-70">
          Countdown starts when you send your first clip.
        </div>
      )}
    </div>
  );
}
