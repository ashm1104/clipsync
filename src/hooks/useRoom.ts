import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createUniqueSlug } from '../lib/slug';
import { detectType, detectLanguage, type ClipType } from '../lib/contentDetector';
import { setCurrentRoomSlug, addLocalClip } from '../lib/localStorage';
import { useAppStore } from '../stores/appStore';
import { uploadImageToRoom } from '../lib/storage';
import { fetchOg } from '../lib/og';

export type Clip = {
  id: string;
  room_id: string;
  user_id: string | null;
  type: ClipType | 'file';
  content: string | null;
  language: string | null;
  og_title: string | null;
  og_desc: string | null;
  og_image: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type Room = {
  id: string;
  slug: string;
  owner_id: string | null;
  expires_at: string;
  created_at: string;
};

const ANON_TTL_MS = 24 * 60 * 60 * 1000;

export function useRoom(initialSlug?: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState<boolean>(!!initialSlug);
  const [notFound, setNotFound] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    const { data } = await supabase.from('rooms').select('*').eq('slug', slug).maybeSingle();
    if (!data) {
      setNotFound(true);
      setLoading(false);
      return null;
    }
    setRoom(data as Room);
    const { data: clipRows } = await supabase
      .from('clips')
      .select('*')
      .eq('room_id', data.id)
      .order('created_at', { ascending: true });
    setClips((clipRows ?? []) as Clip[]);
    setLoading(false);
    return data as Room;
  }, []);

  useEffect(() => {
    if (initialSlug) {
      loadBySlug(initialSlug);
    }
  }, [initialSlug, loadBySlug]);

  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room:${room.slug}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clips',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newClip = payload.new as Clip;
          setClips((prev) => (prev.some((c) => c.id === newClip.id) ? prev : [...prev, newClip]));
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room]);

  const ensureRoom = useCallback(async (): Promise<Room> => {
    if (room) return room;
    const slug = await createUniqueSlug();
    const expires_at = new Date(Date.now() + ANON_TTL_MS).toISOString();
    const { data, error } = await supabase
      .from('rooms')
      .insert({ slug, expires_at })
      .select()
      .single();
    if (error) throw error;
    setRoom(data as Room);
    setCurrentRoomSlug(slug);
    return data as Room;
  }, [room]);

  const sendText = useCallback(
    async (rawText: string, hasHtml: boolean, htmlContent?: string) => {
      const text = rawText.trim();
      if (!text) return;
      const r = await ensureRoom();
      const type = detectType(text, hasHtml);
      const language = type === 'code' ? detectLanguage(text) : null;
      const content = type === 'rich_text' && htmlContent ? htmlContent : text;

      let og: { title: string | null; description: string | null; image: string | null } | null = null;
      if (type === 'url') {
        og = await fetchOg(text);
      }

      const { data, error } = await supabase
        .from('clips')
        .insert({
          room_id: r.id,
          type,
          content,
          language,
          og_title: og?.title ?? null,
          og_desc: og?.description ?? null,
          og_image: og?.image ?? null,
          size_bytes: new Blob([content]).size,
        })
        .select()
        .single();
      if (error) throw error;
      const state = useAppStore.getState();
      if (state.isAnonymous && data) {
        addLocalClip({
          id: data.id,
          roomSlug: r.slug,
          type,
          content,
          language,
          og_title: og?.title ?? null,
          og_desc: og?.description ?? null,
          og_image: og?.image ?? null,
          size_bytes: data.size_bytes ?? null,
          createdAt: new Date(data.created_at).getTime(),
        });
      } else if (!state.isAnonymous && state.userId && data) {
        await supabase.from('personal_clips').insert({
          user_id: state.userId,
          type,
          content,
          language,
          og_title: og?.title ?? null,
          og_desc: og?.description ?? null,
          og_image: og?.image ?? null,
          size_bytes: data.size_bytes ?? null,
        });
      }
    },
    [ensureRoom]
  );

  const sendImage = useCallback(
    async (file: File, onProgress?: (pct: number) => void) => {
      const r = await ensureRoom();
      const { path, size } = await uploadImageToRoom(file, r.id, onProgress);
      const { data, error } = await supabase
        .from('clips')
        .insert({
          room_id: r.id,
          type: 'image',
          content: path,
          size_bytes: size,
        })
        .select()
        .single();
      if (error) throw error;
      if (useAppStore.getState().isAnonymous && data) {
        addLocalClip({
          id: data.id,
          roomSlug: r.slug,
          type: 'image',
          content: path,
          size_bytes: size,
          createdAt: new Date(data.created_at).getTime(),
        });
      }
    },
    [ensureRoom]
  );

  return { room, clips, loading, notFound, ensureRoom, sendText, sendImage, loadBySlug };
}
