#!/usr/bin/env bash
set -Eeuo pipefail

: "${MINIO_ENDPOINT:?MINIO_ENDPOINT is required}"
: "${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY is required}"
: "${MINIO_SECRET_KEY:?MINIO_SECRET_KEY is required}"

mc alias set source "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null
for bucket in secretnairobi-images secretnairobi-previews; do
  count=$(mc find "source/$bucket" --type f --print | wc -l | tr -d ' ')
  bytes=$(mc du --json "source/$bucket" | jq -s 'map(.size // 0) | add // 0')
  printf '%s\t%s\t%s\n' "$bucket" "$count" "$bytes"
done
