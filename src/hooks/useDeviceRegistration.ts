import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

const HEARTBEAT_MS = 60_000;
const FREE_SLOTS = 2;

// Decode the session_id claim from the current JWT. Realtime + PostgREST
// both carry this claim, so it's the right key for our device gate.
async function getSessionId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload?.session_id as string | undefined) ?? null;
  } catch {
    return null;
  }
}

function describeDevice(): { name: string; ua: string } {
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  return { name: `${browser} on ${os}`, ua };
}

// Sticky-slots model: every signed-in browser registers a device row.
// is_active is set on first arrival only if the user has a free slot
// (Pro = always; Free = if fewer than 2 actives exist). After that, only
// the user's explicit "Use this device for sync" / "Pause" actions move
// is_active. Heartbeats touch last_seen_at for cosmetic recency only.
export function useDeviceRegistration() {
  const userId = useAppStore((s) => s.userId);
  const isAnonymous = useAppStore((s) => s.isAnonymous);
  const plan = useAppStore((s) => s.plan);

  useEffect(() => {
    if (!userId || isAnonymous) return;
    let cancelled = false;
    let cachedSessionId: string | null = null;

    (async () => {
      const sessionId = await getSessionId();
      if (cancelled || !sessionId) return;
      cachedSessionId = sessionId;
      const { name, ua } = describeDevice();
      const nowIso = new Date().toISOString();

      // Is this device already registered? Don't re-decide is_active on
      // a returning visit; we only set is_active on first registration.
      const { data: existing } = await supabase
        .from('devices')
        .select('id,is_active')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('devices')
          .update({ last_seen_at: nowIso, name, user_agent: ua })
          .eq('id', existing.id);
        return;
      }

      // First registration: claim a slot if one is free.
      let claim = plan === 'pro';
      if (!claim) {
        const { count } = await supabase
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true);
        claim = (count ?? 0) < FREE_SLOTS;
      }

      await supabase.from('devices').insert({
        user_id: userId,
        session_id: sessionId,
        name,
        user_agent: ua,
        last_seen_at: nowIso,
        is_active: claim,
      });

      // Free user signing in on a 3rd browser — show the upgrade nudge.
      if (!claim) {
        const { pushToast, openUpgrade } = useAppStore.getState();
        pushToast({
          kind: 'warning',
          title: 'Pro syncs unlimited devices',
          body: 'Free accounts use 2 sync slots. Upgrade or pick this device manually.',
        });
        openUpgrade('third_device');
      }
    })();

    const id = setInterval(() => {
      if (!cachedSessionId) return;
      supabase
        .from('devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('session_id', cachedSessionId)
        .then(() => undefined);
    }, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId, isAnonymous, plan]);
}

// Helper for components that need the current session_id.
export async function getCurrentSessionId(): Promise<string | null> {
  return getSessionId();
}
