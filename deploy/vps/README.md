# Secret Nairobi HostPinnacle deployment

This directory deploys PostgreSQL 16, Redis, the API, web app, admin SPA,
private S3-compatible SeaweedFS media storage, encrypted backups, and a dedicated Cloudflare
Tunnel. No service publishes a host port; Cloudflare Tunnel is the only public
application ingress.

The existing production database, media buckets, applications, and DNS targets
must remain intact until the owner explicitly authorizes their removal.

## Layout

- `compose.yml`: production services, private networks, health checks, restart
  policies, persistent volumes, and Docker log rotation.
- `*.Dockerfile`: reproducible backend, web, admin, and backup images.
- `scripts/vps-audit.sh`: read-only host and conflict audit.
- `scripts/db-fingerprint.sh`: table and account-state counts.
- `scripts/media-fingerprint.sh`: media object counts and total bytes.
- `scripts/backup.sh`: encrypted database and media backup.
- `scripts/restore-test.sh`: isolated database restore test.
- `scripts/verify-deployment.sh`: health, release, storage, and port checks.
- `scripts/snapshot-public.sh`: public DNS, HTTP, and TLS snapshot.

## Prerequisites

- A dedicated SSH public key authorized for the VPS. Password authentication is
  not required and should remain disabled.
- Docker Engine with Compose v2, Git, `curl`, `jq`, `dig`, and OpenSSL.
- Cloudflare access for the `secretnairobi.co.ke` zone.
- Read-only migration credentials for the source PostgreSQL database and media
  provider.
- An off-server rclone destination and an age recovery identity stored outside
  the VPS.

## 1. Audit before changing the host

Clone the repository into a new project directory. Do not reuse or modify an
unrelated deployment directory.

```bash
cd /srv/secret-nairobi
sudo bash deploy/vps/scripts/vps-audit.sh | sudo tee /root/secret-nairobi-vps-audit.txt
```

Review existing containers, networks, address pools, volumes, listeners,
firewall rules, and Cloudflare services. Resolve only conflicts belonging to
this deployment.

## 2. Runtime secrets

Create the runtime file without printing values to the terminal:

```bash
cd /srv/secret-nairobi/deploy/vps
umask 077
cp .env.production.example .env.production
chmod 600 .env.production
${EDITOR:-vi} .env.production
mkdir -p secrets artifacts
chmod 700 secrets artifacts
```

Use unique random values from a password manager. Never put credentials in a
command argument, Git, chat, build log, or screenshot. `SMTP_USER` must be the
real Zoho mailbox used to authenticate; the configured From address may remain
the approved alias. Configure `RCLONE_REMOTE`; deployment validation rejects a
missing off-server backup destination or any remaining placeholder.

Generate the age identity on a trusted workstation, save the private identity
in the designated off-server recovery location, and place only its public
recipient in `.env.production`:

```bash
age-keygen -o secret-nairobi-backup.agekey
age-keygen -y secret-nairobi-backup.agekey
```

The private identity may be copied temporarily to
`deploy/vps/secrets/backup-age.key` for a restore test, with mode `600`, and
must be removed from the VPS immediately afterward.

## 3. Snapshot production before cutover

```bash
cd /srv/secret-nairobi/deploy/vps
bash scripts/snapshot-public.sh artifacts/pre-cutover
```

Also export from Cloudflare before changing a hostname:

- the complete zone DNS file;
- Worker custom-domain bindings;
- Pages custom domains and routes;
- tunnel routes;
- apex, `www`, `server`, and `admin` records.

Record and protect NS, MX, SPF, DKIM, DMARC, CAA, email-routing, and domain
verification records. An apex change must never replace the zone or remove
protected records.

## 4. Start private data services

```bash
docker compose --env-file .env.production -f compose.yml config --quiet
docker compose --env-file .env.production -f compose.yml up -d postgres redis minio minio-init
docker compose --env-file .env.production -f compose.yml ps
```

The Compose file intentionally has no `ports` entries. PostgreSQL, Redis, and
the S3 media service are reachable only on the internal `data` network.
The stack uses dedicated `10.254.250.0/24`, `10.254.251.0/24`, and
`10.254.252.0/24` bridges; verify they do not overlap host routes during the VPS
audit before deployment. Only the backup service joins the egress bridge so it
can write encrypted off-server backups.

## 5. Database migration

On a trusted workstation or the VPS, create an ignored `.env.migration` file
with mode `600` containing `SOURCE_DATABASE_URL`. Source fingerprints must be
captured before the final dump:

```bash
set -a; source .env.migration; set +a
PGDATABASE="$SOURCE_DATABASE_URL" bash scripts/db-fingerprint.sh > artifacts/source-db.tsv
pg_dump --dbname="$SOURCE_DATABASE_URL" --format=custom --no-owner --no-acl \
  --file=artifacts/source-production.dump
sha256sum artifacts/source-production.dump > artifacts/source-production.dump.sha256
```

Stop source writes briefly for the final dump or put the old application into
maintenance mode. Restore into the private target database:

```bash
sha256sum -c artifacts/source-production.dump.sha256
docker compose --env-file .env.production -f compose.yml cp \
  artifacts/source-production.dump postgres:/tmp/source-production.dump
docker compose --env-file .env.production -f compose.yml exec -T postgres sh -c \
  'pg_restore --no-owner --no-acl --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/source-production.dump'
docker compose --env-file .env.production -f compose.yml exec -T postgres \
  rm -f /tmp/source-production.dump
```

Do not start the backend before this initial restore. On later deployments the
backend migration runner applies each SQL migration once, records its SHA-256
checksum in `schema_migrations`, and rejects changed migration history.

## 6. Media migration

Put source object-storage values in the ignored `.env.migration` file:
`SOURCE_MEDIA_ENDPOINT`, `SOURCE_MEDIA_ACCESS_KEY`,
`SOURCE_MEDIA_SECRET_KEY`, `SOURCE_IMAGES_BUCKET`, and
`SOURCE_PREVIEWS_BUCKET`. Transfer directly between providers without creating
a plaintext media archive:

```bash
set -a; source .env.migration; set +a
docker compose --env-file .env.production -f compose.yml run --rm \
  -e SOURCE_MEDIA_ENDPOINT -e SOURCE_MEDIA_ACCESS_KEY \
  -e SOURCE_MEDIA_SECRET_KEY -e SOURCE_IMAGES_BUCKET \
  -e SOURCE_PREVIEWS_BUCKET --entrypoint /app/migrate-media.sh backup
```

Record source and target object counts and bytes with
`scripts/media-fingerprint.sh`. Every mismatch must be resolved before DNS
cutover.

## 7. Build and deploy

```bash
cd /srv/secret-nairobi
git fetch origin
git checkout main
git pull --ff-only origin main
chmod 0755 deploy/vps/scripts/*.sh deploy/vps/admin-entrypoint.sh
cd deploy/vps
RELEASE_ID=$(git rev-parse --short=12 HEAD) ./scripts/deploy.sh
```

The release identifier must match on:

- API: `https://server.secretnairobi.co.ke/api/version`
- Web: `https://secretnairobi.co.ke/version`
- Admin: `https://admin.secretnairobi.co.ke/version.json`

## 8. Validate restored data

```bash
docker compose --env-file .env.production -f compose.yml exec -T postgres \
  sh -c 'PGUSER="$POSTGRES_USER" PGDATABASE="$POSTGRES_DB" /bin/sh -s' < scripts/db-fingerprint.sh \
  > artifacts/target-db.tsv
bash scripts/compare-fingerprints.sh artifacts/source-db.tsv artifacts/target-db.tsv
docker compose --env-file .env.production -f compose.yml run --rm \
  --entrypoint /app/media-fingerprint.sh backup > artifacts/target-media.tsv
```

Compare all table counts, user roles/statuses, profiles, agencies, payments,
subscriptions, messages, reviews, images, and media totals. Document any
expected migration-only difference.

## 9. Backups and restore test

The backup container runs daily by default. It creates a PostgreSQL custom dump,
mirrors both private media buckets, writes SHA-256 manifests, encrypts the
archive with age, and retains local encrypted backups for at least 14 days.
Configure `RCLONE_REMOTE` and `secrets/rclone.conf` for off-server copies.

Run the first backup and isolated restore test manually:

```bash
docker compose --env-file .env.production -f compose.yml exec -T backup /app/backup.sh
docker compose --env-file .env.production -f compose.yml exec -T \
  -e AGE_IDENTITY_FILE=/run/secrets/backup-age.key backup /app/restore-test.sh
rm -f secrets/backup-age.key
```

Confirm the off-server encrypted object exists before removing the temporary
identity. Run one final encrypted backup after cutover.

## 10. Cloudflare Tunnel and cutover

Create a dedicated locally managed tunnel named `secret-nairobi-hostpinnacle`.
Copy `cloudflared/config.example.yml` to `cloudflared/config.yml`, replace the
tunnel UUID, and store the generated tunnel credential as
`cloudflared/credentials.json`. Both runtime files are ignored and must be mode
`0600`; the container mounts them read-only.

| Hostname | Private service |
| --- | --- |
| `secretnairobi.co.ke` | `http://web:3000` |
| `www.secretnairobi.co.ke` | `http://web:3000` |
| `server.secretnairobi.co.ke` | `http://backend:4008` |
| `admin.secretnairobi.co.ke` | `http://admin:80` |

If a hostname is a Worker custom domain, snapshot and remove only that exact
binding before adding the tunnel route. Keep the Worker deployment for rollback.

Cut over in this strict order: apex, `www`, `server`, then `admin`. After each
hostname, stop and verify DNS, TLS, HTTP, the expected release, tunnel/container
logs, and absence of 522/525/redirect loops. Recompare protected DNS records
after the apex operation. Do not proceed to the next hostname on failure.

## 11. Production verification

Verify all of the following without performing a real payment charge:

- homepage, profiles, public APIs, API health, and all version endpoints;
- CORS preflight from web and admin origins;
- admin login and an existing user login without resetting passwords;
- Google OAuth callback, Zoho SMTP, and Paystack configuration;
- Redis connectivity from the backend;
- upload/read/delete and one migrated-image retrieval;
- admin SPA deep links;
- all container health checks and tunnel connections;
- restart policies and zero public Docker port bindings.

Use `./scripts/verify-deployment.sh`, browser tests, and provider dashboards.

## Rollback

Rollback one hostname at a time in reverse cutover order:

1. Stop only the VPS tunnel: `docker compose --env-file .env.production -f compose.yml stop cloudflared`.
2. Restore the exact old Worker custom-domain binding or old DNS target from the
   pre-cutover snapshot.
3. Verify DNS, TLS, old health/version, login, and uploads before continuing.
4. Keep the VPS database and media volumes intact for investigation.

If users created data after cutover, do not restore or overwrite either database
until writes are stopped and a deliberate reconciliation plan is approved. A
DNS rollback alone does not merge new data.

## Cleanup

After every test passes, securely remove plaintext dumps, `.env.migration`,
source-provider credentials, extracted files, transfer archives, temporary
tunnel credentials, and sensitive logs. Keep runtime `.env.production` at mode
`600`, the public age recipient on the VPS, encrypted local/off-server backups,
and the private age identity only in the off-server recovery location.

Do not remove the old production deployment until the owner explicitly approves
decommissioning it.
