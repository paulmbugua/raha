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

export RCLONE_CONFIG_SOURCE_TYPE=s3
export RCLONE_CONFIG_SOURCE_PROVIDER=Cloudflare
export RCLONE_CONFIG_SOURCE_ACCESS_KEY_ID=$SOURCE_MEDIA_ACCESS_KEY
export RCLONE_CONFIG_SOURCE_SECRET_ACCESS_KEY=$SOURCE_MEDIA_SECRET_KEY
export RCLONE_CONFIG_SOURCE_ENDPOINT=$SOURCE_MEDIA_ENDPOINT
export RCLONE_CONFIG_TARGET_TYPE=s3
export RCLONE_CONFIG_TARGET_PROVIDER=Other
export RCLONE_CONFIG_TARGET_ACCESS_KEY_ID=$MINIO_ACCESS_KEY
export RCLONE_CONFIG_TARGET_SECRET_ACCESS_KEY=$MINIO_SECRET_KEY
export RCLONE_CONFIG_TARGET_ENDPOINT=$MINIO_ENDPOINT
export RCLONE_CONFIG_TARGET_REGION=us-east-1
export RCLONE_CONFIG_TARGET_FORCE_PATH_STYLE=true

rclone sync "source:$source_images" target:secretnairobi-images --checksum --fast-list
rclone sync "source:$source_previews" target:secretnairobi-previews --checksum --fast-list

printf 'Media transfer completed without creating a plaintext local archive.\n'
