-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Rooms
create table rooms (
  id            uuid primary key default uuid_generate_v4(),
  slug          varchar(6) unique not null,
  custom_slug   varchar(50) unique,              -- Pro only, null = auto-generated
  owner_id      uuid references auth.users,      -- null = anonymous room
  password_hash text,                             -- null = public room
  expires_at    timestamptz not null,
  created_at    timestamptz default now()
);

-- Clips (items inside a room)
create table clips (
  id          uuid primary key default uuid_generate_v4(),
  room_id     uuid references rooms(id) on delete cascade,
  user_id     uuid references auth.users,        -- null = anonymous
  type        text check (type in ('text', 'rich_text', 'code', 'image', 'file', 'url')),
  content     text,    -- text/rich_text: HTML | code: raw string | image/file: storage path | url: raw URL
  language    text,    -- code type only: 'python', 'javascript', 'sql', etc.
  og_title    text,    -- url type only
  og_desc     text,    -- url type only
  og_image    text,    -- url type only
  size_bytes  bigint,
  created_at  timestamptz default now()
);

-- Personal clipboard (logged-in users only, no room)
create table personal_clips (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  type        text check (type in ('text', 'rich_text', 'code', 'image', 'file', 'url')),
  content     text,
  language    text,
  og_title    text,
  og_desc     text,
  size_bytes  bigint,
  created_at  timestamptz default now()
);

-- User profiles
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  plan          text default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  default_expiry text default '24h' check (default_expiry in ('1h', '24h', '7d')),
  auto_detect_code boolean default true,
  preserve_rich_text boolean default true,
  notify_on_join boolean default true,
  created_at    timestamptz default now()
);

-- RLS policies
alter table rooms enable row level security;
alter table clips enable row level security;
alter table personal_clips enable row level security;
alter table profiles enable row level security;

-- Rooms: public read, owner write
create policy "rooms_read" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);
create policy "rooms_update" on rooms for update using (auth.uid() = owner_id);
create policy "rooms_delete" on rooms for delete using (auth.uid() = owner_id);

-- Clips: public read within room, anyone can insert
create policy "clips_read" on clips for select using (true);
create policy "clips_insert" on clips for insert with check (true);

-- Personal clips: owner only
create policy "personal_clips_all" on personal_clips using (auth.uid() = user_id);

-- Profiles: owner only
create policy "profiles_read" on profiles for select using (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
