#!/bin/sh
set -eu
set -o pipefail

tab=$(printf '\t')

printf 'section\tname\tcount\n'
psql -X -v ON_ERROR_STOP=1 -Atqc "
  select format(
    'select ''table'' as section, %L as name, count(*)::text as count from %I.%I;',
    schemaname || '.' || relname,
    schemaname,
    relname
  )
  from pg_stat_user_tables
  order by schemaname, relname;
" | psql -X -v ON_ERROR_STOP=1 -AtF "$tab"

if psql -X -Atqc "select to_regclass('public.utamu_users') is not null" | grep -qx t; then
  psql -X -v ON_ERROR_STOP=1 -AtF "$tab" -c "
    select 'user_role', coalesce(role, '<null>'), count(*)::text
    from utamu_users group by role order by role;
    select 'user_status', coalesce(status, '<null>'), count(*)::text
    from utamu_users group by status order by status;
    select 'account_type', coalesce(account_type, '<null>'), count(*)::text
    from utamu_users group by account_type order by account_type;
  "
fi

if psql -X -Atqc "select to_regclass('public.utamu_models') is not null" | grep -qx t; then
  psql -X -v ON_ERROR_STOP=1 -AtF "$tab" -c "
    select 'model_status', coalesce(status, '<null>'), count(*)::text
    from utamu_models group by status order by status;
    select 'model_kind', coalesce(profile_kind, '<null>'), count(*)::text
    from utamu_models group by profile_kind order by profile_kind;
  "
fi
