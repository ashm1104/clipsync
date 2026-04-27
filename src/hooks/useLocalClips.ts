import { useEffect, useState } from 'react';
import { getLocalClips, type LocalClip } from '../lib/localStorage';

// When `roomSlug` is provided, only clips for that slug are returned.
// This keeps history scoped to the room you're currently in — so a
// new tab / new room / expired room doesn't show clips from a
// previous session.
export function useLocalClips(roomSlug?: string | null): LocalClip[] {
  const [clips, setClips] = useState<LocalClip[]>(() => {
    const all = getLocalClips();
    return roomSlug ? all.filter((c) => c.roomSlug === roomSlug) : all;
  });

  useEffect(() => {
    const refresh = () => {
      const all = getLocalClips();
      setClips(roomSlug ? all.filter((c) => c.roomSlug === roomSlug) : all);
    };
    refresh();
    window.addEventListener('clipsync.local.change', refresh);
    window.addEventListener('storage', refresh);
    const id = setInterval(refresh, 5_000);
    return () => {
      window.removeEventListener('clipsync.local.change', refresh);
      window.removeEventListener('storage', refresh);
      clearInterval(id);
    };
  }, [roomSlug]);

  return clips;
}
