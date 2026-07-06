#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

configure_firewall() {
  require_root
  command -v ufw >/dev/null 2>&1 || fail "ufw is not installed."
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow OpenSSH
  ufw allow 53/tcp
  ufw allow 53/udp
  ufw allow 443/tcp
  ufw --force enable
  log "Configured UFW for SSH, authoritative DNS, and HTTPS."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  configure_firewall "$@"
fi
