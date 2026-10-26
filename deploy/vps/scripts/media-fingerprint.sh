#!/usr/bin/env bash
set -Eeuo pipefail

: "${MINIO_ENDPOINT:?MINIO_ENDPOINT is required}"
: "${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY is required}"
: "${MINIO_SECRET_KEY:?MINIO_SECRET_KEY is required}"

export AWS_ACCESS_KEY_ID=$MINIO_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$MINIO_SECRET_KEY
export AWS_DEFAULT_REGION=us-east-1
for bucket in secretnairobi-images secretnairobi-previews; do
  listing=$(aws --endpoint-url "$MINIO_ENDPOINT" s3api list-objects-v2 --bucket "$bucket" --output json)
  count=$(printf '%s' "$listing" | jq '[.Contents[]?] | length')
  bytes=$(printf '%s' "$listing" | jq '[.Contents[]?.Size] | add // 0')
  printf '%s\t%s\t%s\n' "$bucket" "$count" "$bytes"
done
