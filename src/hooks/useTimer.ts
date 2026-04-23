import { useEffect, useState } from 'react';
import { getTimerState, remainingMs, formatRemaining, type TimerState } from '../lib/timer';

export function useTimer(createdAtMs: number | null) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (createdAtMs == null) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [createdAtMs]);

  if (createdAtMs == null) {
    return { state: 'green' as TimerState, remaining: 0, label: '' };
  }
  const remaining = remainingMs(createdAtMs);
  const state = getTimerState(createdAtMs);
  return { state, remaining, label: formatRemaining(remaining) };
}
