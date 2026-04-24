import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { detectType, detectLanguage } from '../lib/contentDetector';
import { uploadImageToRoom } from '../lib/storage';
import { fetchOg } from '../lib/og';
import type { Clip } from './useRoom';

// Personal Sync: signed-in users send directly to personal_clips.
// Realtime broadcasts to every device signed into the same account.
export function usePersonalClipboard() {
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
        .order('created_at', { ascending: true })
        .limit(50);
      if (!cancelled) setClips((data ?? []) as Clip[]);
    })();

    const channel = supabase
      .channel(`personal-feed:${userId}`)
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
          setClips((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, isAnonymous]);

  const sendText = useCallback(
    async (rawText: string, hasHtml: boolean, htmlContent?: string) => {
      const uid = useAppStore.getState().userId;
      if (!uid) return;
      const text = rawText.trim();
      if (!text) return;
      const type = detectType(text, hasHtml);
      const language = type === 'code' ? detectLanguage(text) : null;
      const content = type === 'rich_text' && htmlContent ? htmlContent : text;
      let og: { title: string | null; description: string | null; image: string | null } | null = null;
      if (type === 'url') og = await fetchOg(text);

      const { error } = await supabase.from('personal_clips').insert({
        user_id: uid,
        type,
        content,
        language,
        og_title: og?.title ?? null,
        og_desc: og?.description ?? null,
        og_image: og?.image ?? null,
        size_bytes: new Blob([content]).size,
      });
      if (error) throw error;
    },
    []
  );

  const sendImage = useCallback(
    async (file: File, onProgress?: (pct: number) => void) => {
      const uid = useAppStore.getState().userId;
      if (!uid) return;
      // Reuse storage helper — bucket path scoped by user id instead of room id.
      const { path, size } = await uploadImageToRoom(file, `user-${uid}`, onProgress);
      const { error } = await supabase.from('personal_clips').insert({
        user_id: uid,
        type: 'image',
        content: path,
        size_bytes: size,
      });
      if (error) throw error;
    },
    []
  );

  return { clips, sendText, sendImage };
}
