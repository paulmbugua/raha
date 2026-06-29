create extension if not exists pgcrypto;

create table if not exists utamu_users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('client', 'model', 'admin')),
  full_name text not null,
  email text unique,
  phone text unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists utamu_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references utamu_users(id) on delete set null,
  display_name text not null,
  slug text unique not null,
  city text not null,
  county text not null,
  category text not null,
  age integer,
  height text,
  bio text,
  verified boolean not null default false,
  elite boolean not null default false,
  online boolean not null default false,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  price_from_kes integer not null default 0,
  response_time text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists utamu_model_media (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references utamu_models(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0
);

create table if not exists utamu_rates (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references utamu_models(id) on delete cascade,
  label text not null,
  duration text not null,
  price_kes integer not null
);

create table if not exists utamu_verifications (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references utamu_models(id) on delete cascade,
  status text not null default 'pending',
  risk text not null default 'low',
  id_document_url text,
  selfie_url text,
  mpesa_phone text,
  notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists utamu_payments (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references utamu_models(id) on delete set null,
  user_id uuid references utamu_users(id) on delete set null,
  amount_kes integer not null,
  method text not null default 'mpesa',
  status text not null default 'pending',
  reference text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists utamu_reviews (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references utamu_models(id) on delete cascade,
  user_id uuid references utamu_users(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text,
  anonymous boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists utamu_seed (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

insert into utamu_seed (key, payload) values ('directory', '{"models":[],"bookings":[],"reviews":[],"verificationCases":[],"analytics":{}}'::jsonb) on conflict (key) do nothing;
