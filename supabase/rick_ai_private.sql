-- Private data model for Rick IA.
-- Apply to the RICK-DEV Supabase project after review.

create table if not exists public.rick_ai_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.rick_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rick_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.rick_ai_conversations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);

create table if not exists public.rick_ai_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('preference', 'goal', 'decision', 'priority', 'routine', 'project')),
  content text not null check (char_length(content) between 1 and 500),
  normalized_key text not null check (char_length(normalized_key) between 1 and 220),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, normalized_key)
);

create index if not exists rick_ai_conversations_owner_updated_idx
  on public.rick_ai_conversations(owner_id, updated_at desc);
create index if not exists rick_ai_messages_conversation_created_idx
  on public.rick_ai_messages(conversation_id, created_at asc);
create index if not exists rick_ai_messages_owner_idx
  on public.rick_ai_messages(owner_id);
create index if not exists rick_ai_memories_owner_updated_idx
  on public.rick_ai_memories(owner_id, updated_at desc);

alter table public.rick_ai_profiles enable row level security;
alter table public.rick_ai_conversations enable row level security;
alter table public.rick_ai_messages enable row level security;
alter table public.rick_ai_memories enable row level security;

-- New public-schema tables are not assumed to be exposed to the Data API.
-- Grant only authenticated access; RLS below still decides which rows are visible/mutable.
grant select, insert, update, delete on table public.rick_ai_profiles to authenticated;
grant select, insert, update, delete on table public.rick_ai_conversations to authenticated;
grant select, insert, update, delete on table public.rick_ai_messages to authenticated;
grant select, insert, update, delete on table public.rick_ai_memories to authenticated;

revoke all on table public.rick_ai_profiles from anon;
revoke all on table public.rick_ai_conversations from anon;
revoke all on table public.rick_ai_messages from anon;
revoke all on table public.rick_ai_memories from anon;

-- Only authenticated admins of RICK_DEV may access their own Rick IA data.
create policy "rick_ai_profiles_admin_own"
  on public.rick_ai_profiles
  for all
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
  );

create policy "rick_ai_conversations_admin_own"
  on public.rick_ai_conversations
  for all
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
  );

create policy "rick_ai_messages_admin_own"
  on public.rick_ai_messages
  for all
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.rick_ai_conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.rick_ai_conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  );

create policy "rick_ai_memories_admin_own"
  on public.rick_ai_memories
  for all
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.rick_dev_admins a
      where a.user_id = (select auth.uid())
    )
  );
