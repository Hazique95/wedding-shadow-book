create extension if not exists "pgcrypto";
create extension if not exists postgis;

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  services jsonb not null default '[]'::jsonb,
  rating double precision not null default 5.0 check (rating >= 0 and rating <= 5),
  no_shows integer not null default 0 check (no_shows >= 0),
  total_gigs integer not null default 0 check (total_gigs >= 0),
  location geography(Point, 4326) not null,
  location_label text,
  location_lat double precision generated always as (st_y(location::geometry)) stored,
  location_lng double precision generated always as (st_x(location::geometry)) stored,
  availability jsonb not null default '{"selectedDates": []}'::jsonb,
  portfolio_url text[] not null default '{}',
  primary_image_url text,
  bio text,
  hourly_rate numeric(10, 2) not null check (hourly_rate between 100 and 5000),
  verified boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_location_idx on public.vendors using gist (location);
create index if not exists vendors_rating_idx on public.vendors (rating desc);

create table if not exists public.vendor_gigs (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  vendor_user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null,
  client_name text,
  event_date date not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled', 'no_show')),
  payout_amount numeric(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists vendor_gigs_vendor_user_idx on public.vendor_gigs (vendor_user_id, event_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

alter table public.vendors enable row level security;
alter table public.vendor_gigs enable row level security;

create policy "public can read vendor profiles"
on public.vendors
for select
using (true);

create policy "vendors can insert own profile"
on public.vendors
for insert
to authenticated
with check (user_id = auth.uid());

create policy "vendors can update own profile"
on public.vendors
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "authenticated users can claim unverified vendor profiles"
on public.vendors
for update
to authenticated
using (user_id is null and verified = false)
with check (user_id = auth.uid());

create policy "vendors can read own gigs"
on public.vendor_gigs
for select
to authenticated
using (vendor_user_id = auth.uid());

create policy "vendors can manage own gigs"
on public.vendor_gigs
for all
to authenticated
using (vendor_user_id = auth.uid())
with check (vendor_user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('vendor-media', 'vendor-media', true)
on conflict (id) do nothing;

create policy "public can view vendor media"
on storage.objects
for select
using (bucket_id = 'vendor-media');

create policy "authenticated users can upload vendor media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vendor-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "authenticated users can update own vendor media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'vendor-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'vendor-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "authenticated users can delete own vendor media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vendor-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.find_nearby_vendors(
  search_lat double precision,
  search_lng double precision,
  radius_meters integer default 50000,
  service_filter text[] default null
)
returns table (
  id uuid,
  name text,
  services jsonb,
  rating double precision,
  no_shows integer,
  total_gigs integer,
  location_label text,
  hourly_rate numeric,
  primary_image_url text,
  portfolio_url text[],
  verified boolean,
  distance_meters double precision
)
language sql
stable
as $$
  select
    v.id,
    v.name,
    v.services,
    v.rating,
    v.no_shows,
    v.total_gigs,
    v.location_label,
    v.hourly_rate,
    v.primary_image_url,
    v.portfolio_url,
    v.verified,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) as distance_meters
  from public.vendors v
  where ST_DWithin(
    v.location,
    ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
    radius_meters
  )
  and (
    service_filter is null
    or exists (
      select 1
      from jsonb_array_elements_text(v.services) as service
      where service = any(service_filter)
    )
  )
  order by distance_meters asc, v.rating desc;
$$;
