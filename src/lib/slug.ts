import { supabase } from './supabase';

const CHARS = 'abcdefghijkmnpqrstuvwxyz23456789';

export function generateSlug(length = 6): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => CHARS[b % CHARS.length])
    .join('');
}

export async function createUniqueSlug(): Promise<string> {
  const slug = generateSlug();
  const { data } = await supabase.from('rooms').select('slug').eq('slug', slug);
  if (data?.length) return createUniqueSlug();
  return slug;
}
