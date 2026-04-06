-- Wedding Shadow Book bootstrap schema
-- Run this file once in the Supabase SQL editor for a fresh project.
-- It combines the current migrations in dependency order.

create extension if not exists "pgcrypto";
create extension if not exists postgis;

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

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  planner_user_id uuid not null references auth.users (id) on delete cascade,
  venue_label text not null,
  venue geography(Point, 4326) not null,
  venue_lat double precision generated always as (st_y(venue::geometry)) stored,
  venue_lng double precision generated always as (st_x(venue::geometry)) stored,
  event_start_date date not null,
  event_end_date date not null,
  budget integer not null check (budget between 1000 and 100000),
  services text[] not null check (
    coalesce(array_length(services, 1), 0) > 0
    and services <@ array['mehndi', 'catering', 'dj', 'venue', 'photog', 'decorator']::text[]
  ),
  guest_count integer not null check (guest_count between 1 and 5000),
  search_radius_km integer not null default 50 check (search_radius_km between 5 and 150),
  broaden_search_requested boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (event_end_date >= event_start_date)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  planner_user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('primary', 'shadow')),
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  estimated_hours numeric(6, 2) not null check (estimated_hours between 1 and 24),
  hourly_rate_snapshot numeric(10, 2) not null check (hourly_rate_snapshot >= 0),
  escrow_amount numeric(10, 2) not null check (escrow_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, vendor_id, type)
);

create index if not exists events_planner_idx on public.events (planner_user_id, created_at desc);
create index if not exists events_location_idx on public.events using gist (venue);
create index if not exists bookings_planner_idx on public.bookings (planner_user_id, created_at desc);
create index if not exists bookings_event_idx on public.bookings (event_id, created_at desc);
create index if not exists vendors_services_idx on public.vendors using gin (services);

create or replace function public.risk_score(v_rating double precision, v_total_gigs integer, v_no_shows integer)
returns double precision
language sql
immutable
as $$
  select round(
    least(
      5::numeric,
      greatest(
        0::numeric,
        (
          (
            (coalesce(v_rating, 0)::numeric / 5) * 0.5
          )
          + (
            (greatest(coalesce(v_total_gigs, 0) - coalesce(v_no_shows, 0), 0)::numeric / greatest(coalesce(v_total_gigs, 0), 1)) * 0.3
          )
          + (
            (1 - (coalesce(v_no_shows, 0)::numeric / greatest(coalesce(v_total_gigs, 0), 1))) * 0.2
          )
        ) * 5
      )
    ),
    2
  )::double precision;
$$;

create or replace function public.match_event_vendors(
  search_lat double precision,
  search_lng double precision,
  range_start date,
  range_end date,
  service_filter text[],
  radius_meters integer default 50000,
  result_limit integer default 5
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
  distance_meters double precision,
  risk_score double precision
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
    ) as distance_meters,
    public.risk_score(v.rating, v.total_gigs, v.no_shows) as risk_score
  from public.vendors v
  where ST_DWithin(
    v.location,
    ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
    radius_meters
  )
  and (
    coalesce(array_length(service_filter, 1), 0) = 0
    or v.services @> to_jsonb(service_filter)
  )
  and exists (
    select 1
    from jsonb_array_elements_text(coalesce(v.availability -> 'selectedDates', '[]'::jsonb)) as available(day_text)
    where available.day_text::date between range_start and range_end
  )
  order by public.risk_score(v.rating, v.total_gigs, v.no_shows) desc, v.rating desc, distance_meters asc
  limit greatest(result_limit, 1);
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.bookings enable row level security;

create policy "planners can read own events"
on public.events
for select
to authenticated
using (planner_user_id = auth.uid());

create policy "planners can insert own events"
on public.events
for insert
to authenticated
with check (planner_user_id = auth.uid());

create policy "planners can update own events"
on public.events
for update
to authenticated
using (planner_user_id = auth.uid())
with check (planner_user_id = auth.uid());

create policy "planners can delete own events"
on public.events
for delete
to authenticated
using (planner_user_id = auth.uid());

create policy "planners can read own bookings"
on public.bookings
for select
to authenticated
using (planner_user_id = auth.uid());

create policy "vendors can read assigned bookings"
on public.bookings
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_id
      and v.user_id = auth.uid()
  )
);

create policy "planners can insert own bookings"
on public.bookings
for insert
to authenticated
with check (planner_user_id = auth.uid());

create policy "planners can update own bookings"
on public.bookings
for update
to authenticated
using (planner_user_id = auth.uid())
with check (planner_user_id = auth.uid());

create table if not exists public.vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  "text" text not null check (char_length(trim("text")) > 0),
  "date" date not null default current_date,
  sentiment double precision not null default 0 check (sentiment between -1 and 1),
  created_at timestamptz not null default now()
);

create index if not exists vendor_reviews_vendor_date_idx
on public.vendor_reviews (vendor_id, "date" desc);

alter table public.vendor_reviews enable row level security;

create policy "public can read vendor reviews"
on public.vendor_reviews
for select
using (true);

create policy "vendors can manage own reviews"
on public.vendor_reviews
for all
to authenticated
using (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_id
      and v.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_id
      and v.user_id = auth.uid()
  )
);