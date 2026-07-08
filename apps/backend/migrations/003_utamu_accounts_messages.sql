create extension if not exists pgcrypto;

alter table utamu_users add column if not exists username text;
alter table utamu_users add column if not exists password_hash text;
alter table utamu_users add column if not exists email_verified boolean not null default false;
alter table utamu_users add column if not exists validation_token text;
alter table utamu_users add column if not exists validation_sent_at timestamptz;
alter table utamu_users add column if not exists account_type text not null default 'member';
alter table utamu_users add column if not exists profile jsonb not null default '{}'::jsonb;
alter table utamu_users add column if not exists last_login_at timestamptz;

create unique index if not exists utamu_users_username_lower_idx on utamu_users (lower(username)) where username is not null;
create unique index if not exists utamu_users_validation_token_idx on utamu_users (validation_token) where validation_token is not null;

create table if not exists utamu_profile_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references utamu_users(id) on delete cascade,
  model_id uuid references utamu_models(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists utamu_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references utamu_users(id) on delete set null,
  recipient_user_id uuid references utamu_users(id) on delete set null,
  model_id uuid references utamu_models(id) on delete set null,
  model_slug text,
  model_name text,
  sender_name text not null,
  sender_email text not null,
  subject text not null default 'Profile enquiry',
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists utamu_messages_recipient_idx on utamu_messages (recipient_user_id, created_at desc);
create index if not exists utamu_messages_sender_idx on utamu_messages (sender_user_id, created_at desc);

create table if not exists utamu_blacklisted_clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references utamu_users(id) on delete cascade,
  client_name text not null,
  client_email text,
  reason text,
  created_at timestamptz not null default now()
);