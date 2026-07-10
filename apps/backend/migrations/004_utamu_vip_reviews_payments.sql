alter table utamu_payments add column if not exists provider_reference text;
alter table utamu_payments add column if not exists authorization_url text;
alter table utamu_payments add column if not exists purpose text;
alter table utamu_payments add column if not exists paid_at timestamptz;

alter table utamu_reviews add column if not exists model_name text;
alter table utamu_reviews add column if not exists model_image text;
alter table utamu_reviews add column if not exists author_name text;

create index if not exists utamu_payments_reference_idx on utamu_payments (reference);
create index if not exists utamu_payments_provider_reference_idx on utamu_payments (provider_reference) where provider_reference is not null;
create index if not exists utamu_reviews_created_idx on utamu_reviews (created_at desc);
