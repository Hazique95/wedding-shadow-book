create extension if not exists "pgcrypto";
create extension if not exists postgis;

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