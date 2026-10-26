#!/bin/sh
set -eu

backend_url=${BACKEND_URL:-https://server.secretnairobi.co.ke}
release_id=${RELEASE_ID:-development}

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__BACKEND_URL__ = "${backend_url}";
EOF

cat > /usr/share/nginx/html/version.json <<EOF
{"service":"secret-nairobi-admin","release":"${release_id}"}
EOF

exec nginx -g 'daemon off;'
