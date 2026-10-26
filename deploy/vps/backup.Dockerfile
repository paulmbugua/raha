FROM postgres:16-alpine

RUN apk add --no-cache age aws-cli bash coreutils findutils jq rclone tar

COPY deploy/vps/scripts/backup.sh /app/backup.sh
COPY deploy/vps/scripts/backup-loop.sh /app/backup-loop.sh
COPY deploy/vps/scripts/restore-test.sh /app/restore-test.sh
COPY deploy/vps/scripts/db-fingerprint.sh /app/db-fingerprint.sh
COPY deploy/vps/scripts/media-fingerprint.sh /app/media-fingerprint.sh
COPY deploy/vps/scripts/migrate-media.sh /app/migrate-media.sh
RUN chmod 0755 /app/*.sh

ENTRYPOINT ["/app/backup-loop.sh"]
