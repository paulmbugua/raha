alter table utamu_models add column if not exists profile_kind text not null default 'escort';
alter table utamu_models add column if not exists agency_model_id uuid references utamu_models(id) on delete cascade;
alter table utamu_models add column if not exists profile_data jsonb not null default '{}'::jsonb;

create index if not exists utamu_models_agency_roster_idx
  on utamu_models (agency_model_id, status, created_at desc);

update utamu_models
set profile_kind = 'agency'
where lower(category) like '%agency%'
  and profile_kind = 'escort';
