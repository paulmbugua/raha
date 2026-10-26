#!/usr/bin/env bash
set -Eeuo pipefail

printf '%s\n' '== operating system =='
uname -a
test -r /etc/os-release && cat /etc/os-release

printf '%s\n' '== resources =='
nproc
free -h
df -h /

printf '%s\n' '== container runtime =='
docker version
docker compose version
docker ps -a
docker network ls
docker volume ls
docker info --format '{{json .DefaultAddressPools}}'

printf '%s\n' '== listeners and firewall =='
ss -lntup
if command -v ufw >/dev/null 2>&1; then ufw status verbose; fi
if command -v firewall-cmd >/dev/null 2>&1; then firewall-cmd --list-all; fi

printf '%s\n' '== existing Cloudflare services =='
docker ps -a --filter ancestor=cloudflare/cloudflared
systemctl --no-pager --full status cloudflared 2>/dev/null || true
