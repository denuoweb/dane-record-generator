#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

configure_nginx() {
  require_root
  config_required

  local cert key label
  cert="$(json_get '.tls.certificatePath')"
  key="$(json_get '.tls.privateKeyPath')"
  label="$(json_get '.hns.label')"
  [[ -f "$cert" && -f "$key" ]] || fail "TLS material is missing. Run generate-tlsa.sh first."

  ensure_dir 0755 "$(dirname "$HNS_DANE_NGINX_AVAILABLE")"
  cat > "$HNS_DANE_NGINX_AVAILABLE" <<EOF
server {
  listen 443 ssl default_server;
  listen [::]:443 ssl default_server;
  server_name _;
  ssl_reject_handshake on;
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name $label www.$label;
  root $HNS_DANE_WEB;
  index index.html;

  ssl_certificate $cert;
  ssl_certificate_key $key;
  ssl_protocols TLSv1.2 TLSv1.3;

  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer" always;

  location / {
    try_files \$uri \$uri/ =404;
  }
}
EOF

  ln -sfn "$HNS_DANE_NGINX_AVAILABLE" "$HNS_DANE_NGINX_ENABLED"
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t
  safe_systemctl enable nginx >/dev/null 2>&1 || true
  safe_systemctl restart nginx >/dev/null 2>&1 || true
  log "Configured nginx HTTPS endpoint for $label/."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  configure_nginx "$@"
fi
