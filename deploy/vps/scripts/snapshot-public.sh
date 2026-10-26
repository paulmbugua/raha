#!/usr/bin/env bash
set -Eeuo pipefail

out=${1:-artifacts/pre-cutover}
mkdir -p "$out"

for host in secretnairobi.co.ke www.secretnairobi.co.ke server.secretnairobi.co.ke admin.secretnairobi.co.ke; do
  safe=${host//./_}
  : > "$out/${safe}.dns.txt"
  for type in A AAAA CNAME; do
    dig +noall +answer "$host" "$type" >> "$out/${safe}.dns.txt"
  done
  curl -fsSIL --max-time 20 "https://$host" > "$out/${safe}.headers.txt" || true
  openssl s_client -connect "$host:443" -servername "$host" </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates > "$out/${safe}.tls.txt" || true
done

for type in NS MX TXT CAA; do
  dig +noall +answer secretnairobi.co.ke "$type" > "$out/apex-${type}.txt"
done

printf 'Public DNS/HTTP/TLS snapshot saved under %s.\n' "$out"
