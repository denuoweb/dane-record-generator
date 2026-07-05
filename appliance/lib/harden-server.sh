#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

harden_server() {
  require_root

  if command -v unattended-upgrade >/dev/null 2>&1 || [[ -d /etc/apt/apt.conf.d ]]; then
    cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
  fi

  cat > /etc/sysctl.d/90-hns-dane-appliance.conf <<'EOF'
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
EOF
  sysctl --system >/dev/null || true

  cat > /etc/logrotate.d/hns-dane-appliance <<EOF
$HNS_DANE_LOG_DIR/*.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
}
EOF

  ensure_dir 0700 "$HNS_DANE_ETC"
  ensure_dir 0700 "$HNS_DANE_TLS_DIR"
  ensure_dir 0700 "$HNS_DANE_ROOT"
  ensure_dir 0700 "$HNS_DANE_BACKUP_DIR"
  chmod 0700 "$HNS_DANE_TLS_DIR" "$HNS_DANE_ROOT" "$HNS_DANE_BACKUP_DIR" 2>/dev/null || true
  find "$HNS_DANE_TLS_DIR" -type f -name '*.key' -exec chmod 0600 {} + 2>/dev/null || true

  safe_systemctl enable fail2ban >/dev/null 2>&1 || true
  safe_systemctl restart fail2ban >/dev/null 2>&1 || true
  log "Applied conservative server hardening."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  harden_server "$@"
fi
