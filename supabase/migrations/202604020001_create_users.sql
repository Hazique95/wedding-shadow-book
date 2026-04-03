create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null check (role in ('planner', 'vendor')),
  full_name text not null,
  location_label text not null,
  location_lat double precision,
  location_lng double precision,
  service text check (service in ('decorator', 'caterer', 'dj', 'venue', 'photog')),
  bio text,
  hourly_rate numeric(10, 2),
  currency text not null default 'PKR' check (currency in ('PKR', 'USD')),
  signup_source_utm jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;

create policy "public can read vendor profiles"
on public.users
for select
using (role = 'vendor');

create policy "authenticated users can read own profile"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "authenticated users can insert own profile"
on public.users
for insert
to authenticated
with check (id = auth.uid());

create policy "authenticated users can update own profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
