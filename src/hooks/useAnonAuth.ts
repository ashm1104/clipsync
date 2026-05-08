import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ensureAnonSession, migrateLocalToAccount } from '../lib/auth';
import { useAppStore } from '../stores/appStore';
import { Events, trackEvent } from '../lib/analytics';

// `is_anonymous` is on the JWT app_metadata when a user signed in via
// signInAnonymously. The supabase-js types don't surface it yet.
function sessionIsAnonymous(user: { is_anonymous?: boolean; app_metadata?: { provider?: string } } | null | undefined): boolean {
  if (!user) return true;
  if (typeof user.is_anonymous === 'boolean') return user.is_anonymous;
  return !user.app_metadata?.provider || user.app_metadata.provider === 'anonymous';
}

export function useAnonAuth() {
  const setSession = useAppStore((s) => s.setSession);
  const pushToast = useAppStore((s) => s.pushToast);
  const closeSignIn = useAppStore((s) => s.closeSignIn);
  const lastAnonRef = useRef<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    ensureAnonSession().then((session) => {
      if (cancelled) return;
      const isAnon = sessionIsAnonymous(session?.user ?? null);
      setSession(session?.user.id ?? null, isAnon);
      lastAnonRef.current = isAnon;
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAnon = sessionIsAnonymous(session?.user ?? null);
      setSession(session?.user.id ?? null, isAnon);

      // Transition from anonymous → real account — run migration once.
      if (
        event === 'SIGNED_IN' &&
        lastAnonRef.current &&
        !isAnon &&
        session?.user.id
      ) {
        try {
          const count = await migrateLocalToAccount(session.user.id);
          closeSignIn();
          pushToast({
            kind: 'success',
            title: 'Your clipboard is safe',
            body: count > 0 ? `${count} items saved to your account.` : 'Signed in.',
          });
          // Personal Sync may have already fetched its empty list before
          // the migration inserted rows — tell it to refresh.
          window.dispatchEvent(new CustomEvent('pastio.personal.refresh'));
          trackEvent(Events.signinCompleted, { migrated: count });
        } catch {
          pushToast({
            kind: 'error',
            title: 'Signed in, but migration failed',
            body: 'Your anonymous clips stayed on this device.',
          });
        }
      }
      lastAnonRef.current = isAnon;
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [setSession, pushToast, closeSignIn]);
}
