import { supabase } from './supabase';

// Spec Section 6 says the bucket is public-read.
export function publicImageUrl(path: string): string {
  const { data } = supabase.storage.from('clips').getPublicUrl(path);
  return data.publicUrl;
}

// Free bucket cap (Supabase free plan = 50MB global). Pro cap is capped to
// 50MB until Supabase upgrade — see spec conflict notes in Phase 0 hand-off.
export const MAX_IMAGE_SIZE_FREE = 10 * 1024 * 1024;
export const MAX_IMAGE_SIZE_PRO = 50 * 1024 * 1024;

export async function uploadImageToRoom(
  file: File,
  roomId: string,
  onProgress?: (pct: number) => void
): Promise<{ path: string; size: number }> {
  // Phase 2: no Pro-tier detection yet; enforce free cap for all anon users.
  if (file.size > MAX_IMAGE_SIZE_FREE) {
    throw new Error('FILE_TOO_LARGE');
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${roomId}/${crypto.randomUUID()}.${ext}`;

  onProgress?.(10);
  const { error } = await supabase.storage.from('clips').upload(path, file, {
    upsert: false,
    contentType: file.type || 'image/png',
  });
  onProgress?.(100);
  if (error) throw error;

  return { path, size: file.size };
}

// Generic file upload (Pro). Accepts PDFs, ZIPs, anything. Bucket is the
// same `clips` bucket; only the content type / extension differ.
export async function uploadFileToRoom(
  file: File,
  roomId: string,
  onProgress?: (pct: number) => void
): Promise<{ path: string; size: number; name: string }> {
  if (file.size > MAX_IMAGE_SIZE_PRO) throw new Error('FILE_TOO_LARGE');
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${roomId}/${crypto.randomUUID()}.${ext}`;
  onProgress?.(10);
  const { error } = await supabase.storage.from('clips').upload(path, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });
  onProgress?.(100);
  if (error) throw error;
  return { path, size: file.size, name: file.name };
}
