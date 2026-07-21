create extension if not exists pgcrypto;

alter table utamu_models add column if not exists trusted_badge boolean not null default false;
alter table utamu_models add column if not exists verification_tier text not null default 'none';
alter table utamu_models add column if not exists listing_tier text not null default 'free';
alter table utamu_models add column if not exists listing_tier_expires_at timestamptz;
alter table utamu_models add column if not exists gallery_limit integer not null default 8;
alter table utamu_models add column if not exists sidebar_ad boolean not null default false;
alter table utamu_payments add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists utamu_monetization_products (
  id text primary key,
  category text not null,
  name text not null,
  description text not null,
  amount_kes integer not null,
  token_amount integer not null default 0,
  duration_days integer,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists utamu_listing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references utamu_users(id) on delete cascade,
  model_id uuid references utamu_models(id) on delete cascade,
  tier text not null,
  amount_kes integer not null default 0,
  status text not null default 'active',
  gallery_limit integer not null default 8,
  bump_interval_hours integer not null default 168,
  sidebar_ad boolean not null default false,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  payment_id uuid references utamu_payments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists utamu_wallets (
  user_id uuid primary key references utamu_users(id) on delete cascade,
  balance_tokens integer not null default 0,
  lifetime_purchased_tokens integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists utamu_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references utamu_users(id) on delete cascade,
  counterparty_user_id uuid references utamu_users(id) on delete set null,
  model_id uuid references utamu_models(id) on delete set null,
  type text not null,
  amount_tokens integer not null,
  balance_after integer not null,
  commission_tokens integer not null default 0,
  description text,
  payment_id uuid references utamu_payments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists utamu_ai_assistants (
  user_id uuid primary key references utamu_users(id) on delete cascade,
  model_id uuid references utamu_models(id) on delete cascade,
  enabled boolean not null default false,
  plan text not null default 'off',
  monthly_price_kes integer not null default 0,
  tone text not null default 'polite',
  instructions text,
  auto_reply_enabled boolean not null default true,
  expires_at timestamptz,
  payment_id uuid references utamu_payments(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists utamu_client_portal_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references utamu_users(id) on delete cascade,
  status text not null default 'active',
  plan text not null default 'vetted-client',
  amount_kes integer not null default 0,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  payment_id uuid references utamu_payments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists utamu_booking_leads (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid references utamu_users(id) on delete set null,
  provider_user_id uuid references utamu_users(id) on delete set null,
  model_id uuid references utamu_models(id) on delete set null,
  model_slug text,
  model_name text,
  requested_date timestamptz,
  location text,
  budget_kes integer,
  message text not null,
  status text not null default 'new',
  lead_fee_kes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists utamu_tips (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references utamu_users(id) on delete set null,
  recipient_user_id uuid references utamu_users(id) on delete set null,
  model_id uuid references utamu_models(id) on delete set null,
  amount_tokens integer not null,
  commission_tokens integer not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists utamu_listing_subscriptions_model_idx on utamu_listing_subscriptions (model_id, status, expires_at desc);
create index if not exists utamu_wallet_transactions_user_idx on utamu_wallet_transactions (user_id, created_at desc);
create index if not exists utamu_booking_leads_provider_idx on utamu_booking_leads (provider_user_id, created_at desc);
create index if not exists utamu_booking_leads_client_idx on utamu_booking_leads (client_user_id, created_at desc);

insert into utamu_monetization_products (id, category, name, description, amount_kes, token_amount, duration_days, sort_order) values
  ('verification-trusted', 'verification', 'Trusted verification badge', 'Paid ID/document review with a Trusted badge after approval.', 1500, 0, 365, 10),
  ('tier-bronze', 'listing', 'Bronze featured listing', 'Monthly profile bumping, 12 photo slots, and stronger ranking.', 1500, 0, 30, 20),
  ('tier-silver', 'listing', 'Silver featured listing', 'Faster bumping, 20 photo slots, and search priority.', 3000, 0, 30, 30),
  ('tier-gold', 'listing', 'Gold featured listing', 'Top ranking, 30 photo slots, and sidebar ad eligibility.', 6000, 0, 30, 40),
  ('tier-vip', 'listing', 'VIP featured listing', 'VIP homepage priority, 40 photo slots, sidebar ad spot, and strongest bumping.', 10000, 0, 30, 50),
  ('tokens-100', 'wallet', '100 message tokens', 'Credits for paid messages, private unlocks, and tips.', 500, 100, null, 60),
  ('tokens-300', 'wallet', '300 message tokens', 'Best-value client credits for active messaging and tips.', 1200, 300, null, 70),
  ('ai-assistant-monthly', 'ai', 'AI assistant monthly add-on', '24/7 assistant that handles common questions and filters weak leads.', 6500, 0, 30, 80),
  ('client-portal-monthly', 'client_portal', 'Vetted client portal', 'Monthly access to vetted-client-only discovery and matchmaking.', 2500, 0, 30, 90)
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  amount_kes = excluded.amount_kes,
  token_amount = excluded.token_amount,
  duration_days = excluded.duration_days,
  sort_order = excluded.sort_order,
  active = true;
