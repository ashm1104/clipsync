// TESTING MODE — shortened to 10 min total so amber/red states are visible.
// Amber at ≤5m, red at ≤2m, expired at 0.
// RELEASE VALUES (restore before Phase 6): TTL = 4h, amber ≤60m, red ≤15m.
const TESTING = true;

export const ANONYMOUS_TTL_MS = TESTING
  ? 10 * 60 * 1000 // 10 minutes
  : 4 * 60 * 60 * 1000; // 4 hours — spec Section 9

const AMBER_THRESHOLD_MS = TESTING ? 5 * 60 * 1000 : 60 * 60 * 1000;
const RED_THRESHOLD_MS = TESTING ? 2 * 60 * 1000 : 15 * 60 * 1000;

export type TimerState = 'green' | 'amber' | 'red' | 'expired';

export function getTimerState(createdAtMs: number, now = Date.now()): TimerState {
  const remaining = createdAtMs + ANONYMOUS_TTL_MS - now;
  if (remaining <= 0) return 'expired';
  if (remaining <= RED_THRESHOLD_MS) return 'red';
  if (remaining <= AMBER_THRESHOLD_MS) return 'amber';
  return 'green';
}

export function remainingMs(createdAtMs: number, now = Date.now()): number {
  return Math.max(0, createdAtMs + ANONYMOUS_TTL_MS - now);
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'expired';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (mins >= 1) return `${mins}m`;
  return `${secs}s`;
}
