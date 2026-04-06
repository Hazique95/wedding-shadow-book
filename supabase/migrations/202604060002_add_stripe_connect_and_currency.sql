alter table public.vendors
  add column if not exists stripe_account_id text,
  add column if not exists stripe_account_country text check (stripe_account_country in ('US', 'PK')),
  add column if not exists stripe_onboarding_complete boolean not null default false,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false;

create unique index if not exists vendors_stripe_account_id_idx
on public.vendors (stripe_account_id)
where stripe_account_id is not null;

alter table public.bookings
  add column if not exists currency text not null default 'USD' check (currency in ('USD', 'PKR')),
  add column if not exists planner_currency text not null default 'USD' check (planner_currency in ('USD', 'PKR')),
  add column if not exists vendor_currency text not null default 'USD' check (vendor_currency in ('USD', 'PKR')),
  add column if not exists exchange_rate numeric(12, 6) not null default 1,
  add column if not exists application_fee_amount numeric(10, 2) not null default 0,
  add column if not exists vendor_payout_amount numeric(10, 2) not null default 0,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_payment_status text not null default 'unpaid' check (stripe_payment_status in ('unpaid', 'paid', 'failed', 'expired')),
  add column if not exists paid_at timestamptz;

create unique index if not exists bookings_checkout_session_idx on public.bookings (stripe_checkout_session_id) where stripe_checkout_session_id is not null;
create unique index if not exists bookings_payment_intent_idx on public.bookings (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check check (status in ('pending', 'paid', 'confirmed', 'payment_failed'));

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
  risk_score double precision,
  vendor_currency text
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
    public.risk_score(v.rating, v.total_gigs, v.no_shows) as risk_score,
    coalesce(u.currency, 'USD') as vendor_currency
  from public.vendors v
  left join public.users u on u.id = v.user_id
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