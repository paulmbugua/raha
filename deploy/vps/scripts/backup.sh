#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

: "${BACKUP_AGE_RECIPIENT:?BACKUP_AGE_RECIPIENT is required}"
: "${MINIO_ENDPOINT:?MINIO_ENDPOINT is required}"
: "${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY is required}"
: "${MINIO_SECRET_KEY:?MINIO_SECRET_KEY is required}"

backup_root=/backups
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
workdir=$(mktemp -d /tmp/secretnairobi-backup.XXXXXX)
archive="${backup_root}/secretnairobi-${timestamp}.tar.age"
retention_days=${BACKUP_RETENTION_DAYS:-14}

cleanup() {
  rm -rf -- "$workdir"
}
trap cleanup EXIT

mkdir -p "$backup_root" "$workdir/media/images" "$workdir/media/previews"

pg_dump --format=custom --no-owner --no-acl --file="$workdir/database.dump"

mc alias set source "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null
mc mirror --overwrite source/secretnairobi-images "$workdir/media/images" >/dev/null
mc mirror --overwrite source/secretnairobi-previews "$workdir/media/previews" >/dev/null

(
  cd "$workdir"
  find database.dump media -type f -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
  printf 'created_at=%s\nrelease=%s\n' "$timestamp" "${RELEASE_ID:-unknown}" > metadata.txt
  tar -cf - database.dump media SHA256SUMS metadata.txt | age -r "$BACKUP_AGE_RECIPIENT" -o "$archive"
)

sha256sum "$archive" > "${archive}.sha256"

if [[ -n "${RCLONE_REMOTE:-}" ]]; then
  rclone copy "$archive" "$RCLONE_REMOTE" --config /run/secrets/rclone.conf
  rclone copy "${archive}.sha256" "$RCLONE_REMOTE" --config /run/secrets/rclone.conf
fi

date +%s > "$backup_root/.last-success"
find "$backup_root" -maxdepth 1 -type f \( -name 'secretnairobi-*.tar.age' -o -name 'secretnairobi-*.tar.age.sha256' \) -mtime "+$retention_days" -delete
printf 'Encrypted backup completed: %s\n' "$(basename "$archive")"
