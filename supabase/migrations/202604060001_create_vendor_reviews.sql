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