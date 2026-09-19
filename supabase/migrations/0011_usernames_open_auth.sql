-- 0011_usernames_open_auth.sql
-- Adds usernames to profiles (random on creation, changeable by the user)
-- and wires open self-registration (the auth flow already supports signUp;
-- this migration only ensures every profile row gets a username).

-- 1. Add the column (nullable first so we can backfill before adding NOT NULL)
alter table public.profiles
  add column if not exists username text;

-- Unique, case-insensitive.  Using a functional index rather than a CHECK
-- so existing rows with mixed-case legacy values survive the migration.
drop index if exists profiles_username_uq;
create unique index profiles_username_uq
  on public.profiles (lower(username));

-- 2. Backfill every existing user with a UUID-derived username.
--    Pattern: user_<first-8-hex-chars-of-UUID> → e.g. "user_a1b2c3d4"
--    Always unique because UUIDs are unique.
update public.profiles
set username = 'user_' || lower(replace(substring(id::text, 1, 8), '-', ''))
where username is null;

-- 3. Enforce NOT NULL now that all rows have a value.
alter table public.profiles
  alter column username set not null;

-- 4. Update handle_new_user to stamp a username on every new signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user_' || lower(replace(substring(new.id::text, 1, 8), '-', ''))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 5. RPC for updating a username safely (enforces format + uniqueness via index).
create or replace function public.update_username(p_username text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  -- 3-30 chars, starts with a letter, only letters/digits/underscores.
  if p_username !~ '^[a-zA-Z][a-zA-Z0-9_]{2,29}$' then
    raise exception 'Username must be 3–30 characters, start with a letter, and contain only letters, numbers, and underscores.';
  end if;
  update public.profiles
  set username = lower(p_username)
  where id = auth.uid();
end;
$$;
