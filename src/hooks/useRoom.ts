import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createUniqueSlug } from '../lib/slug';
import { detectType, detectLanguage, type ClipType } from '../lib/contentDetector';
import { setCurrentRoomSlug, addLocalClip } from '../lib/localStorage';
import { useAppStore } from '../stores/appStore';
import { uploadImageToRoom, uploadFileToRoom } from '../lib/storage';
import { fetchOg } from '../lib/og';
import { Events, trackEvent } from '../lib/analytics';

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
  custom_slug: string | null;
  owner_id: string | null;
  expires_at: string;
  created_at: string;
  password_hash: string | null;
};

import { ANONYMOUS_TTL_MS } from '../lib/timer';
const ANON_TTL_MS = ANONYMOUS_TTL_MS;

export function useRoom(initialSlug?: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState<boolean>(!!initialSlug);
  const [notFound, setNotFound] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .or(`slug.eq.${slug},custom_slug.eq.${slug}`)
      .maybeSingle();
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
      .order('created_at', { ascending: false });
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
          setClips((prev) => (prev.some((c) => c.id === newClip.id) ? prev : [newClip, ...prev]));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'clips',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const oldId = (payload.old as { id?: string } | null)?.id;
          if (!oldId) return;
          setClips((prev) => prev.filter((c) => c.id !== oldId));
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
    trackEvent(Events.roomCreated, { kind: 'anon_auto' });
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

      const uid = useAppStore.getState().userId;
      const { data, error } = await supabase
        .from('clips')
        .insert({
          room_id: r.id,
          user_id: uid,
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
      trackEvent(Events.clipSent, { mode: 'room', type });
      if (data) {
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
      }
    },
    [ensureRoom]
  );

  const sendImage = useCallback(
    async (file: File, onProgress?: (pct: number) => void) => {
      const r = await ensureRoom();

      // Pro gate: free rooms hold 3 images max.
      const state = useAppStore.getState();
      if (state.plan !== 'pro') {
        const imageCount = clips.filter((c) => c.type === 'image').length;
        if (imageCount >= 3) {
          state.pushToast({
            kind: 'warning',
            title: '3 image limit reached',
            body: 'Delete an image from history or upgrade for unlimited.',
          });
          state.openUpgrade('image_limit');
          return;
        }
      }

      const { path, size } = await uploadImageToRoom(file, r.id, onProgress);
      const uid = useAppStore.getState().userId;
      const { data, error } = await supabase
        .from('clips')
        .insert({
          room_id: r.id,
          user_id: uid,
          type: 'image',
          content: path,
          size_bytes: size,
        })
        .select()
        .single();
      if (error) throw error;
      trackEvent(Events.clipSent, { mode: 'room', type: 'image' });
      if (data) {
        addLocalClip({
          id: data.id,
          roomSlug: r.slug,
          type: 'image',
          content: path,
          size_bytes: size,
          createdAt: new Date(data.created_at).getTime(),
        });
      }
      useAppStore.getState().pushToast({
        kind: 'success',
        title: 'Image sent',
        body: 'Your image is in the room history.',
      });
    },
    [ensureRoom, clips]
  );

  const sendFile = useCallback(
    async (file: File, onProgress?: (pct: number) => void) => {
      const r = await ensureRoom();
      const { path, size, name } = await uploadFileToRoom(file, r.id, onProgress);
      const uid = useAppStore.getState().userId;
      const { data, error } = await supabase
        .from('clips')
        .insert({
          room_id: r.id,
          user_id: uid,
          type: 'file',
          content: path,
          og_title: name,
          size_bytes: size,
        })
        .select()
        .single();
      if (error) throw error;
      trackEvent(Events.clipSent, { mode: 'room', type: 'file' });
      if (data) {
        addLocalClip({
          id: data.id,
          roomSlug: r.slug,
          type: 'file',
          content: path,
          og_title: name,
          size_bytes: size,
          createdAt: new Date(data.created_at).getTime(),
        });
      }
      useAppStore.getState().pushToast({
        kind: 'success',
        title: 'File sent',
        body: name,
      });
    },
    [ensureRoom]
  );

  return { room, clips, loading, notFound, ensureRoom, sendText, sendImage, sendFile, loadBySlug };
}
