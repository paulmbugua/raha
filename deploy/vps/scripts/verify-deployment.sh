#!/usr/bin/env bash
set -Eeuo pipefail

compose=(docker compose --env-file .env.production -f compose.yml)
release=${RELEASE_ID:-$(git rev-parse --short=12 HEAD)}

"${compose[@]}" ps

for service in postgres redis minio backend web admin backup cloudflared; do
  status=$("${compose[@]}" ps --format json "$service" | jq -r 'if type == "array" then .[0].Health // .[0].State else .Health // .State end')
  [[ "$status" == healthy || "$status" == running ]] || { echo "$service is not healthy: $status" >&2; exit 1; }
done

backend_release=$("${compose[@]}" exec -T backend node -e "fetch('http://127.0.0.1:4008/api/version').then(r=>r.json()).then(v=>process.stdout.write(v.release))")
web_release=$("${compose[@]}" exec -T web node -e "fetch('http://127.0.0.1:3000/version').then(r=>r.json()).then(v=>process.stdout.write(v.release))")
admin_release=$("${compose[@]}" exec -T admin wget -qO- http://127.0.0.1/version.json | jq -r .release)

[[ "$backend_release" == "$release" && "$web_release" == "$release" && "$admin_release" == "$release" ]] || {
  echo "Release mismatch: backend=$backend_release web=$web_release admin=$admin_release expected=$release" >&2
  exit 1
}

published=$("${compose[@]}" ps -q | xargs -r docker inspect --format '{{range $p, $bindings := .NetworkSettings.Ports}}{{if $bindings}}{{$p}}={{json $bindings}} {{end}}{{end}}')
[[ -z "$published" ]] || { echo "Unexpected public Docker port bindings: $published" >&2; exit 1; }

"${compose[@]}" exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
"${compose[@]}" exec -T redis sh -c 'redis-cli -a "$REDIS_PASSWORD" ping' | grep -q PONG
"${compose[@]}" exec -T backup sh -c 'AWS_ACCESS_KEY_ID="$MINIO_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$MINIO_SECRET_KEY" aws --endpoint-url "$MINIO_ENDPOINT" s3api head-bucket --bucket secretnairobi-images' >/dev/null

printf 'Deployment verification passed for release %s.\n' "$release"
