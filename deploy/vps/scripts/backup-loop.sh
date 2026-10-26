#!/usr/bin/env bash
set -Eeuo pipefail

interval=${BACKUP_INTERVAL_SECONDS:-86400}
while true; do
  if ! /app/backup.sh; then
    printf 'Backup failed at %s\n' "$(date -u +%FT%TZ)" >&2
  fi
  sleep "$interval"
done
