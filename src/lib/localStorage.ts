import type { ClipType } from './contentDetector';
import { ANONYMOUS_TTL_MS } from './timer';

const KEY = 'pastio.anon.clips';
const ROOM_KEY = 'pastio.anon.currentRoom';

export type LocalClip = {
  id: string;
  roomSlug: string;
  type: ClipType | 'file';
  content: string;
  language?: string | null;
  og_title?: string | null;
  og_desc?: string | null;
  og_image?: string | null;
  size_bytes?: number | null;
  createdAt: number;
};

function read(): LocalClip[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as LocalClip[];
  } catch {
    return [];
  }
}

function write(clips: LocalClip[]) {
  localStorage.setItem(KEY, JSON.stringify(clips.slice(0, 100)));
}

export function getLocalClips(): LocalClip[] {
  const all = read();
  const cutoff = Date.now() - ANONYMOUS_TTL_MS;
  const fresh = all.filter((c) => c.createdAt > cutoff);
  if (fresh.length !== all.length) {
    write(fresh);
    // Fire in a microtask so consumers reading during render don't loop.
    queueMicrotask(() => window.dispatchEvent(new CustomEvent('pastio.local.change')));
  }
  return fresh;
}

export function addLocalClip(clip: LocalClip) {
  const all = read();
  if (all.some((c) => c.id === clip.id)) return;
  all.unshift(clip);
  write(all);
  window.dispatchEvent(new CustomEvent('pastio.local.change'));
}

export function removeLocalClip(id: string) {
  const all = read();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return;
  write(next);
  window.dispatchEvent(new CustomEvent('pastio.local.change'));
}

export function clearLocalClips() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent('pastio.local.change'));
}

export function getCurrentRoomSlug(): string | null {
  return localStorage.getItem(ROOM_KEY);
}
export function setCurrentRoomSlug(slug: string) {
  localStorage.setItem(ROOM_KEY, slug);
}
export function clearCurrentRoomSlug() {
  localStorage.removeItem(ROOM_KEY);
}
