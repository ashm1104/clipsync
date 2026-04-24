import { supabase } from './supabase';
import { createUniqueSlug } from './slug';

export type RoomExpiry = '1h' | '24h' | '7d';

const EXPIRY_MS: Record<RoomExpiry, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

// SHA-256 hex digest. Not bcrypt — strong enough to gate clients but
// room.password_hash is still readable via SELECT, so treat as "obscurity
// lock", not true encryption.
export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type CreateRoomOptions = {
  expiry: RoomExpiry;
  customSlug?: string | null;
  password?: string | null;
};

export async function createRoom(opts: CreateRoomOptions) {
  const slug = opts.customSlug?.trim().toLowerCase() || (await createUniqueSlug());
  if (opts.customSlug) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();
    if (existing) throw new Error(`Code "${slug}" is already in use`);
  }

  const password_hash = opts.password ? await hashPassword(opts.password) : null;
  const expires_at = new Date(Date.now() + EXPIRY_MS[opts.expiry]).toISOString();

  const { data, error } = await supabase
    .from('rooms')
    .insert({ slug, expires_at, password_hash })
    .select()
    .single();
  if (error) throw error;
  return data;
}
