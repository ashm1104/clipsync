import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

const HEARTBEAT_MS = 60_000;

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
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  return { name: `${browser} on ${os}`, ua };
}

// Registers the current browser session against the signed-in user.
// All devices register — the 2-device free cap is enforced by RLS at the
// personal_clips layer, not by hiding the row. Heartbeats keep last_seen
// fresh so a freshly-active browser displaces an idle one out of top-2.
export function useDeviceRegistration() {
  const userId = useAppStore((s) => s.userId);
  const isAnonymous = useAppStore((s) => s.isAnonymous);

  useEffect(() => {
    if (!userId || isAnonymous) return;
    let cancelled = false;
    let cachedSessionId: string | null = null;

    (async () => {
      const sessionId = await getSessionId();
      if (cancelled || !sessionId) return;
      cachedSessionId = sessionId;
      const { name, ua } = describeDevice();

      await supabase
        .from('devices')
        .upsert(
          {
            user_id: userId,
            session_id: sessionId,
            name,
            user_agent: ua,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,session_id' }
        );
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
  }, [userId, isAnonymous]);
}

// Helper for components that need to know "am I one of the active devices?"
export async function getCurrentSessionId(): Promise<string | null> {
  return getSessionId();
}
