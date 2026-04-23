import { useEffect, useState } from 'react';
import { getLocalClips, type LocalClip } from '../lib/localStorage';

export function useLocalClips(): LocalClip[] {
  const [clips, setClips] = useState<LocalClip[]>(() => getLocalClips());

  useEffect(() => {
    const refresh = () => setClips(getLocalClips());
    window.addEventListener('clipsync.local.change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('clipsync.local.change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return clips;
}
