// Thin wrapper around the Plausible global. Events queue if the script
// hasn't loaded yet (the inline shim in index.html stores them on a
// queue, then Plausible drains the queue on load).
//
// Privacy contract: only event names and small enum-shaped props.
// NEVER pass clip content, user IDs, emails, room slugs or anything
// that could identify a person.

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

type EventProps = Record<string, string | number | boolean>;

export function trackEvent(name: string, props?: EventProps): void {
  if (typeof window === 'undefined') return;
  try {
    window.plausible?.(name, props ? { props } : undefined);
  } catch {
    // Analytics must never crash the app.
  }
}

// Conversion-funnel event names. Centralised so we don't typo strings
// across files.
export const Events = {
  signinModalOpened: 'signin_modal_opened',
  signinCompleted: 'signin_completed',
  roomCreated: 'room_created',
  clipSent: 'clip_sent',
  proGateHit: 'pro_gate_hit',
  upgradeModalOpened: 'upgrade_modal_opened',
  upgradeClicked: 'upgrade_clicked',
  deviceRegistered: 'device_registered',
  feedbackSubmitted: 'feedback_submitted',
} as const;
