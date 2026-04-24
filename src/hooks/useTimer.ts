import { useEffect, useState } from 'react';
import { getTimerStateFromRemaining, formatRemaining, type TimerState } from '../lib/timer';

// Takes the room's absolute expiry (ms since epoch). One source of truth for
// everything that counts down — TimerCard, AmberBanner, HistoryStrip.
export function useRoomTimer(expiresAtMs: number | null) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (expiresAtMs == null) return;
    const id = setInterval(() => setTick((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, [expiresAtMs]);

  if (expiresAtMs == null) {
    return { state: 'green' as TimerState, remaining: 0, label: '' };
  }
  const remaining = Math.max(0, expiresAtMs - Date.now());
  const state = getTimerStateFromRemaining(remaining);
  return { state, remaining, label: formatRemaining(remaining) };
}
