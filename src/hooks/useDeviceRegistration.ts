import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

const CLIENT_ID_KEY = 'clipsync.clientId';
const HEARTBEAT_MS = 60_000;

export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
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

// Registers the current browser as a "device" against the signed-in user.
// Heartbeats last_seen_at so DevicesPanel can show recency. Does nothing
// for anonymous sessions.
export function useDeviceRegistration() {
  const userId = useAppStore((s) => s.userId);
  const isAnonymous = useAppStore((s) => s.isAnonymous);
  const plan = useAppStore((s) => s.plan);
  const pushToast = useAppStore((s) => s.pushToast);
  const openUpgrade = useAppStore((s) => s.openUpgrade);

  useEffect(() => {
    if (!userId || isAnonymous) return;
    let cancelled = false;
    const clientId = getClientId();
    const { name, ua } = describeDevice();

    (async () => {
      // Free users get a soft cap of 2 devices. Don't register the 3rd, but
      // also don't block — show the Pro nudge.
      if (plan !== 'pro') {
        const { count } = await supabase
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        const { data: existing } = await supabase
          .from('devices')
          .select('id')
          .eq('user_id', userId)
          .eq('client_id', clientId)
          .maybeSingle();
        if (!existing && (count ?? 0) >= 2) {
          if (!cancelled) {
            pushToast({
              kind: 'warning',
              title: 'Pro syncs unlimited devices',
              body: 'Free accounts sync up to 2 devices. Upgrade for the whole setup.',
            });
            openUpgrade('third_device');
          }
          return;
        }
      }

      await supabase
        .from('devices')
        .upsert(
          {
            user_id: userId,
            client_id: clientId,
            name,
            user_agent: ua,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,client_id' }
        );
    })();

    const id = setInterval(() => {
      supabase
        .from('devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .then(() => undefined);
    }, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId, isAnonymous, plan, pushToast, openUpgrade]);
}
