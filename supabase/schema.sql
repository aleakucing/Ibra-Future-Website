-- Run this file once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_name text not null check (char_length(trim(from_name)) between 1 and 24),
  to_name text not null check (char_length(trim(to_name)) between 1 and 24),
  body text not null check (char_length(trim(body)) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

alter table public.messages enable row level security;

drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages"
  on public.messages
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can submit valid messages" on public.messages;
create policy "Anyone can submit valid messages"
  on public.messages
  for insert
  to anon, authenticated
  with check (
    char_length(trim(from_name)) between 1 and 24
    and char_length(trim(to_name)) between 1 and 24
    and char_length(trim(body)) between 1 and 280
  );

revoke all on public.messages from anon, authenticated;
grant select, insert on public.messages to anon, authenticated;

create table if not exists public.visitor_counters (
  page_key text primary key,
  visitor_count bigint not null default 0 check (visitor_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.visitor_counters enable row level security;
revoke all on public.visitor_counters from anon, authenticated;

create or replace function public.increment_visitor(p_page_key text default 'home')
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count bigint;
begin
  insert into public.visitor_counters (page_key, visitor_count, updated_at)
  values (p_page_key, 1, now())
  on conflict (page_key) do update
    set visitor_count = public.visitor_counters.visitor_count + 1,
        updated_at = now()
  returning visitor_count into next_count;

  return next_count;
end;
$$;

create or replace function public.get_visitor_count(p_page_key text default 'home')
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select visitor_count from public.visitor_counters where page_key = p_page_key),
    0
  );
$$;

revoke all on function public.increment_visitor(text) from public;
revoke all on function public.get_visitor_count(text) from public;
grant execute on function public.increment_visitor(text) to anon, authenticated;
grant execute on function public.get_visitor_count(text) to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
