import { useMemo } from 'react';
import { useLocalClips } from '../../hooks/useLocalClips';
import { useAppStore } from '../../stores/appStore';
import { getTimerState, formatRemaining, remainingMs } from '../../lib/timer';

export default function AmberBanner() {
  const isAnon = useAppStore((s) => s.isAnonymous);
  const openSignIn = useAppStore((s) => s.openSignIn);
  const clips = useLocalClips();

  const earliest = useMemo(() => {
    if (!isAnon || !clips.length) return null;
    const amberOrRed = clips.filter((c) => {
      const s = getTimerState(c.createdAt);
      return s === 'amber' || s === 'red';
    });
    if (!amberOrRed.length) return null;
    return amberOrRed.reduce((oldest, c) => (c.createdAt < oldest.createdAt ? c : oldest), amberOrRed[0]);
  }, [clips, isAnon]);

  if (!earliest) return null;

  const label = formatRemaining(remainingMs(earliest.createdAt));

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
        Your clipboard expires in <strong>{label}</strong>. Sign in free to save it forever.
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
