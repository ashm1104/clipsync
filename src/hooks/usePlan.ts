import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

// Loads the signed-in user's plan from profiles; creates a row on first
// sign-in if missing. Keeps useAppStore.plan in sync.
export function usePlan() {
  const userId = useAppStore((s) => s.userId);
  const isAnonymous = useAppStore((s) => s.isAnonymous);
  const setPlan = useAppStore((s) => s.setPlan);

  useEffect(() => {
    if (!userId || isAnonymous) {
      setPlan('free');
      return;
    }
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();

      if (!data) {
        // First sign-in — create profile row.
        await supabase.from('profiles').insert({ id: userId, plan: 'free' });
        if (!cancelled) setPlan('free');
        return;
      }
      if (!cancelled) setPlan((data.plan === 'pro' ? 'pro' : 'free'));
    })();

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as { plan?: string }).plan;
          setPlan(next === 'pro' ? 'pro' : 'free');
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, isAnonymous, setPlan]);
}
