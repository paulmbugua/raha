#!/usr/bin/env bash
set -Eeuo pipefail

env_file=${1:-.env.production}
[[ -f "$env_file" ]] || { echo "$env_file is missing." >&2; exit 1; }

mode=$(stat -c '%a' "$env_file")
[[ "$mode" == 600 || "$mode" == 400 ]] || {
  echo "$env_file must have mode 600 or 400; current mode is $mode." >&2
  exit 1
}

required=(
  POSTGRES_PASSWORD REDIS_PASSWORD MINIO_ROOT_USER MINIO_ROOT_PASSWORD
  JWT_SECRET CLOUDFLARE_TUNNEL_TOKEN CORS_ALLOWED_ORIGINS SMTP_HOST
  SMTP_USER SMTP_PASS PAYSTACK_SECRET_KEY GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET BACKUP_AGE_RECIPIENT RCLONE_REMOTE
  NEXT_PUBLIC_BACKEND_URL NEXT_PUBLIC_SITE_URL
)

for key in "${required[@]}"; do
  line=$(grep -m1 -E "^${key}=" "$env_file" || true)
  value=${line#*=}
  if [[ -z "$line" || -z "$value" || "$value" == *replace-with* || "$value" == *pending-* ]]; then
    echo "Required production setting is missing or still a placeholder: $key" >&2
    exit 1
  fi
done

printf 'Production environment validation passed.\n'
