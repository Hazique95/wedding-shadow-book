alter table public.users
  add column if not exists phone_number text,
  add column if not exists notification_preferences jsonb not null default '{"sms": true, "email": true, "in_app": true}'::jsonb;

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_idx
on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

create policy "users can read own notifications"
on public.user_notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "users can update own notifications"
on public.user_notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

alter publication supabase_realtime add table public.user_notifications;

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete cascade,
  channel text not null check (channel in ('sms', 'email')),
  template_key text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 10),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_jobs_due_idx
on public.notification_jobs (status, next_attempt_at asc);

create index if not exists notification_jobs_user_idx
on public.notification_jobs (user_id, created_at desc);

alter table public.notification_jobs enable row level security;

drop trigger if exists notification_jobs_set_updated_at on public.notification_jobs;
create trigger notification_jobs_set_updated_at
before update on public.notification_jobs
for each row
execute function public.set_updated_at();

alter table public.bookings
  add column if not exists canceled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists refund_amount numeric(10, 2) not null default 0,
  add column if not exists refund_percentage numeric(5, 2) not null default 0,
  add column if not exists refund_status text not null default 'none' check (refund_status in ('none', 'pending', 'succeeded', 'failed')),
  add column if not exists refunded_at timestamptz,
  add column if not exists payout_released_at timestamptz;

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check check (status in ('pending', 'paid', 'confirmed', 'payment_failed', 'cancelled'));