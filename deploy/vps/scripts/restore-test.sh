#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

: "${AGE_IDENTITY_FILE:?AGE_IDENTITY_FILE must point to the mounted recovery identity}"
archive=${1:-$(find /backups -maxdepth 1 -name 'secretnairobi-*.tar.age' -type f | sort | tail -1)}
[[ -n "$archive" && -f "$archive" ]] || { echo 'No encrypted backup found.' >&2; exit 1; }

workdir=$(mktemp -d /tmp/secretnairobi-restore.XXXXXX)
test_db="restore_test_$(date +%s)"

cleanup() {
  dropdb --if-exists "$test_db" >/dev/null 2>&1 || true
  rm -rf -- "$workdir"
}
trap cleanup EXIT

sha256sum -c "${archive}.sha256"
age -d -i "$AGE_IDENTITY_FILE" "$archive" | tar -xf - -C "$workdir"
(
  cd "$workdir"
  sha256sum -c SHA256SUMS
)

createdb "$test_db"
pg_restore --no-owner --no-acl --exit-on-error --dbname="$test_db" "$workdir/database.dump"
PGDATABASE="$test_db" /app/db-fingerprint.sh > "$workdir/restore-fingerprint.tsv"

printf 'Isolated restore test passed for %s\n' "$(basename "$archive")"
