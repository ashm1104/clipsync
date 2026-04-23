import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ensureAnonSession } from '../lib/auth';
import { useAppStore } from '../stores/appStore';

export function useAnonAuth() {
  const setUserId = useAppStore((s) => s.setUserId);

  useEffect(() => {
    let cancelled = false;
    ensureAnonSession()
      .then((session) => {
        if (!cancelled) setUserId(session?.user.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [setUserId]);
}
