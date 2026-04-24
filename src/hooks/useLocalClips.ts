import { useEffect, useState } from 'react';
import { getLocalClips, type LocalClip } from '../lib/localStorage';

export function useLocalClips(): LocalClip[] {
  const [clips, setClips] = useState<LocalClip[]>(() => getLocalClips());

  useEffect(() => {
    const refresh = () => setClips(getLocalClips());
    window.addEventListener('clipsync.local.change', refresh);
    window.addEventListener('storage', refresh);
    // Poll so expired clips drop out on their own.
    const id = setInterval(refresh, 5_000);
    return () => {
      window.removeEventListener('clipsync.local.change', refresh);
      window.removeEventListener('storage', refresh);
      clearInterval(id);
    };
  }, []);

  return clips;
}
