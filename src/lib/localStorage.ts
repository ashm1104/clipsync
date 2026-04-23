import type { ClipType } from './contentDetector';

const KEY = 'clipsync.anon.clips';

export type LocalClip = {
  id: string;
  roomSlug: string;
  type: ClipType;
  content: string;
  language?: string;
  createdAt: number;
};

export function getLocalClips(): LocalClip[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as LocalClip[];
  } catch {
    return [];
  }
}

export function addLocalClip(clip: LocalClip) {
  const all = getLocalClips();
  all.unshift(clip);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)));
}

export function clearLocalClips() {
  localStorage.removeItem(KEY);
}

const ROOM_KEY = 'clipsync.anon.currentRoom';

export function getCurrentRoomSlug(): string | null {
  return localStorage.getItem(ROOM_KEY);
}

export function setCurrentRoomSlug(slug: string) {
  localStorage.setItem(ROOM_KEY, slug);
}

export function clearCurrentRoomSlug() {
  localStorage.removeItem(ROOM_KEY);
}
