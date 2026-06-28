create extension if not exists pgcrypto;

create table if not exists raha_users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('customer', 'provider', 'admin')),
  full_name text not null,
  email text unique not null,
  phone text,
  password_hash text,
  otp_verified boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists raha_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references raha_users(id) on delete set null,
  business_name text not null,
  slug text unique not null,
  location text not null,
  service_area text not null,
  bio text not null,
  whatsapp_number text not null,
  verification_status text not null default 'pending',
  subscription_tier text not null default 'trial',
  premium boolean not null default false,
  verified boolean not null default false,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  response_rate text,
  profile_completeness integer not null default 0,
  featured_rank integer,
  suspended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists raha_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references raha_providers(id) on delete cascade,
  name text not null,
  duration_minutes integer not null,
  price_kes integer not null,
  description text,
  photo_url text,
  active boolean not null default true
);

create table if not exists raha_provider_media (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references raha_providers(id) on delete cascade,
  url text not null,
  kind text not null default 'gallery',
  sort_order integer not null default 0
);

create table if not exists raha_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references raha_providers(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  unavailable_date date,
  break_start time,
  break_end time
);

create table if not exists raha_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references raha_users(id) on delete set null,
  provider_id uuid not null references raha_providers(id) on delete cascade,
  service_id uuid references raha_services(id) on delete set null,
  booking_date date not null,
  booking_time time not null,
  status text not null default 'pending',
  amount_kes integer not null,
  reference text unique not null,
  whatsapp_unlocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists raha_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references raha_bookings(id) on delete set null,
  provider_id uuid references raha_providers(id) on delete set null,
  amount_kes integer not null,
  method text not null check (method in ('mpesa', 'visa', 'mastercard', 'apple_pay', 'google_pay', 'wallet')),
  status text not null default 'pending',
  provider_reference text,
  receipt_url text,
  created_at timestamptz not null default now()
);

create table if not exists raha_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references raha_providers(id) on delete cascade,
  plan text not null check (plan in ('trial', 'standard', 'premium')),
  amount_kes integer not null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists raha_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references raha_bookings(id) on delete set null,
  provider_id uuid not null references raha_providers(id) on delete cascade,
  customer_id uuid references raha_users(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text,
  anonymous boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists raha_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references raha_users(id) on delete set null,
  amount_kes integer not null,
  kind text not null check (kind in ('credit', 'debit', 'withdrawal', 'refund', 'referral')),
  status text not null default 'posted',
  reference text unique,
  created_at timestamptz not null default now()
);

create table if not exists raha_marketplace_seed (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

insert into raha_marketplace_seed (key, payload) values
('marketplace', '{"providers":[],"bookings":[],"reviews":[],"subscriptionPlans":[]}'::jsonb),
('providers', '[]'::jsonb)
on conflict (key) do nothing;
