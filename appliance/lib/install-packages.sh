#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

install_packages() {
  require_root
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y \
    ca-certificates \
    curl \
    dnsutils \
    fail2ban \
    jq \
    knot \
    knot-dnsutils \
    nginx \
    openssl \
    python3 \
    tar \
    ufw \
    unattended-upgrades
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  install_packages "$@"
fi
