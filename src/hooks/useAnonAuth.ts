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
      const wasAnon = lastAnonRef.current;
      setSession(session?.user.id ?? null, isAnon);
      lastAnonRef.current = isAnon;

      // Run migration on EVERY SIGNED_IN where the user is real. Covers:
      //  - anon → click sign in (transition case)
      //  - magic link landing on a fresh tab where ensureAnonSession
      //    already saw a real session and we never had a 'transition'
      // The function itself is no-op if local clips are empty, so safe
      // to call repeatedly.
      if (event === 'SIGNED_IN' && !isAnon && session?.user.id) {
        try {
          const count = await migrateLocalToAccount(session.user.id);
          // Bump the global revision so usePersonalClipboard tears down
          // and re-runs cleanly — no race with the in-flight initial fetch.
          useAppStore.getState().bumpSyncRevision();
          // Keep the legacy event for any other listener.
          window.dispatchEvent(new CustomEvent('pastio.personal.refresh'));
          // Toast + tracking only on the true anon→auth transition.
          if (wasAnon) {
            closeSignIn();
            pushToast({
              kind: 'success',
              title: 'Your clipboard is safe',
              body: count > 0 ? `${count} items saved to your account.` : 'Signed in.',
            });
            trackEvent(Events.signinCompleted, { migrated: count });
          }
        } catch {
          if (wasAnon) {
            pushToast({
              kind: 'error',
              title: 'Signed in, but migration failed',
              body: 'Your anonymous clips stayed on this device.',
            });
          }
        }
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [setSession, pushToast, closeSignIn]);
}
