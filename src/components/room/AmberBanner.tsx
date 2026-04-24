import { useAppStore } from '../../stores/appStore';
import { useRoomTimer } from '../../hooks/useTimer';

type Props = { expiresAtMs: number | null };

export default function AmberBanner({ expiresAtMs }: Props) {
  const isAnon = useAppStore((s) => s.isAnonymous);
  const openSignIn = useAppStore((s) => s.openSignIn);
  const { state, label } = useRoomTimer(expiresAtMs);

  if (!isAnon || expiresAtMs == null) return null;
  if (state !== 'amber' && state !== 'red') return null;

  return (
    <div
      className="flex flex-col gap-3 rounded-card p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: 'var(--amber-light)',
        border: '0.5px solid var(--amber-border)',
        color: 'var(--amber-text)',
      }}
      role="alert"
    >
      <div className="text-sm">
        Your room expires in <strong>{label}</strong>. Sign in free to save it forever.
      </div>
      <button
        type="button"
        onClick={openSignIn}
        className="shrink-0 rounded-btn px-4 py-[7px] text-sm font-medium text-white transition-colors"
        style={{ background: '#3B6D11' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#27500A')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#3B6D11')}
      >
        Save my clipboard →
      </button>
    </div>
  );
}
