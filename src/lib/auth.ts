import { supabase } from './supabase';
import { getLocalClips, clearLocalClips } from './localStorage';

export async function ensureAnonSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signed.session;
}

// Spec Section 8 — after sign-in, upload any localStorage clips to personal_clips.
// Supabase keeps the same user.id when an anonymous user signs in, so we simply
// copy the local rows across and clear local storage.
export async function migrateLocalToAccount(userId: string): Promise<number> {
  const local = getLocalClips();
  if (!local.length) return 0;

  const rows = local.map((clip) => ({
    user_id: userId,
    type: clip.type,
    content: clip.content,
    language: clip.language ?? null,
    og_title: clip.og_title ?? null,
    og_desc: clip.og_desc ?? null,
    size_bytes: clip.size_bytes ?? null,
  }));

  const { error } = await supabase.from('personal_clips').insert(rows);
  if (error) throw error;
  clearLocalClips();
  return rows.length;
}
