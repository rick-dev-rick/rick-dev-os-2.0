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

create index if not exists rick_ai_conversations_owner_updated_idx
  on public.rick_ai_conversations(owner_id, updated_at desc);
create index if not exists rick_ai_messages_conversation_created_idx
  on public.rick_ai_messages(conversation_id, created_at asc);

alter table public.rick_ai_profiles enable row level security;
alter table public.rick_ai_conversations enable row level security;
alter table public.rick_ai_messages enable row level security;

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
