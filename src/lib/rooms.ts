import { supabase } from './supabase';
import { createUniqueSlug } from './slug';
import { Events, trackEvent } from './analytics';

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
  const slug = await createUniqueSlug();
  const custom_slug = opts.customSlug?.trim().toLowerCase() || null;

  if (custom_slug) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .or(`slug.eq.${custom_slug},custom_slug.eq.${custom_slug}`)
      .maybeSingle();
    if (existing) throw new Error(`Code "${custom_slug}" is already taken`);
  }

  const password_hash = opts.password ? await hashPassword(opts.password) : null;
  const expires_at = new Date(Date.now() + EXPIRY_MS[opts.expiry]).toISOString();

  const { data: auth } = await supabase.auth.getUser();
  const owner_id = auth.user?.id ?? null;

  const { data, error } = await supabase
    .from('rooms')
    .insert({ slug, custom_slug, expires_at, password_hash, owner_id })
    .select()
    .single();
  if (error) throw error;
  trackEvent(Events.roomCreated, {
    kind: 'modal',
    expiry: opts.expiry,
    has_password: !!password_hash,
    has_custom_slug: !!custom_slug,
  });
  return data;
}
