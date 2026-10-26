FROM postgres:16-alpine

ARG TARGETARCH
RUN apk add --no-cache age bash coreutils curl findutils jq rclone tar && \
    case "$TARGETARCH" in amd64) mc_arch=amd64 ;; arm64) mc_arch=arm64 ;; *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; esac && \
    curl -fsSL "https://dl.min.io/client/mc/release/linux-${mc_arch}/mc" -o /usr/local/bin/mc && \
    chmod 0755 /usr/local/bin/mc

COPY deploy/vps/scripts/backup.sh /app/backup.sh
COPY deploy/vps/scripts/backup-loop.sh /app/backup-loop.sh
COPY deploy/vps/scripts/restore-test.sh /app/restore-test.sh
COPY deploy/vps/scripts/db-fingerprint.sh /app/db-fingerprint.sh
COPY deploy/vps/scripts/media-fingerprint.sh /app/media-fingerprint.sh
COPY deploy/vps/scripts/migrate-media.sh /app/migrate-media.sh
RUN chmod 0755 /app/*.sh

ENTRYPOINT ["/app/backup-loop.sh"]
