import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import type { Clip } from './useRoom';

export function usePersonalSync() {
  const userId = useAppStore((s) => s.userId);
  const isAnonymous = useAppStore((s) => s.isAnonymous);
  const [clips, setClips] = useState<Clip[]>([]);

  useEffect(() => {
    if (!userId || isAnonymous) {
      setClips([]);
      return;
    }
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('personal_clips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!cancelled) setClips((data ?? []) as Clip[]);
    })();

    const channel = supabase
      .channel(`personal:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'personal_clips',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Clip;
          setClips((prev) => (prev.some((c) => c.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, isAnonymous]);

  return clips;
}
