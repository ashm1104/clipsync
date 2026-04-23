export const ANONYMOUS_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours — spec Section 9

export type TimerState = 'green' | 'amber' | 'red' | 'expired';

export function getTimerState(createdAtMs: number, now = Date.now()): TimerState {
  const remaining = createdAtMs + ANONYMOUS_TTL_MS - now;
  if (remaining <= 0) return 'expired';
  if (remaining <= 15 * 60 * 1000) return 'red';
  if (remaining <= 60 * 60 * 1000) return 'amber';
  return 'green';
}

export function remainingMs(createdAtMs: number, now = Date.now()): number {
  return Math.max(0, createdAtMs + ANONYMOUS_TTL_MS - now);
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'expired';
  const mins = Math.floor(ms / 60000);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.max(1, mins)}m`;
}
