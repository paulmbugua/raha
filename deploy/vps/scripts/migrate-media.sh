#!/usr/bin/env bash
set -Eeuo pipefail

: "${SOURCE_MEDIA_ENDPOINT:?SOURCE_MEDIA_ENDPOINT is required}"
: "${SOURCE_MEDIA_ACCESS_KEY:?SOURCE_MEDIA_ACCESS_KEY is required}"
: "${SOURCE_MEDIA_SECRET_KEY:?SOURCE_MEDIA_SECRET_KEY is required}"
: "${MINIO_ENDPOINT:?MINIO_ENDPOINT is required}"
: "${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY is required}"
: "${MINIO_SECRET_KEY:?MINIO_SECRET_KEY is required}"

source_images=${SOURCE_IMAGES_BUCKET:-secretnairobi-images}
source_previews=${SOURCE_PREVIEWS_BUCKET:-secretnairobi-previews}

mc alias set source "$SOURCE_MEDIA_ENDPOINT" "$SOURCE_MEDIA_ACCESS_KEY" "$SOURCE_MEDIA_SECRET_KEY" >/dev/null
mc alias set target "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null

mc mirror --overwrite --preserve "source/$source_images" target/secretnairobi-images
mc mirror --overwrite --preserve "source/$source_previews" target/secretnairobi-previews

printf 'Media transfer completed without creating a plaintext local archive.\n'
