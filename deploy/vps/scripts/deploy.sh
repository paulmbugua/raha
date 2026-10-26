#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")/.."
test -f .env.production || { echo '.env.production is missing.' >&2; exit 1; }
./scripts/validate-env.sh .env.production

export RELEASE_ID=${RELEASE_ID:-$(git rev-parse --short=12 HEAD)}
docker compose --env-file .env.production -f compose.yml config --quiet
docker compose --env-file .env.production -f compose.yml build --pull
docker compose --env-file .env.production -f compose.yml up -d
./scripts/verify-deployment.sh
