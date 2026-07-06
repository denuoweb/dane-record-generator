#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

generate_ssh_instructions() {
  config_required
  ensure_dir 0700 "$HNS_DANE_ROOT"

  local label zone dashboard wallet_path readme profile_note ipv4 ipv6 ip_family ipv6_line
  label="$(json_get '.hns.label')"
  zone="$(json_get '.hns.zone')"
  dashboard="$(json_get '.dashboard.publicUrl')"
  wallet_path="$(selected_wallet_path)"
  ipv4="$(json_get '.network.publicIPv4')"
  ipv6="$(json_get '.network.publicIPv6')"
  ip_family="IPv4"
  ipv6_line=""
  if [[ -n "$ipv6" && "$ipv6" != "null" ]]; then
    ip_family="IPv4 and IPv6"
    ipv6_line="  IPv6: ${ipv6}"
  fi
  readme="$HNS_DANE_ROOT/README-FIRST.txt"
  profile_note="${HNS_DANE_PROFILE_NOTE:-/etc/profile.d/hns-dane-appliance.sh}"

  cat > "$readme" <<EOF
HNS DANE appliance is installed for: ${label}/

Open the public dashboard:
  ${dashboard}

The dashboard shows the NS, GLUE, DS, and HNS Browser TXT records to paste into the HNS wallet.
The generated HNS Browser TXT capsule uses this appliance's detected public ${ip_family}:
  IPv4: ${ipv4}
${ipv6_line}

Root-only files:
  Wallet instructions: ${wallet_path}
  HNS resource JSON:   ${HNS_DANE_OUTPUT_DIR}/hns-resource.json
  Private backups:     ${HNS_DANE_BACKUP_DIR}/
  Bootstrap log:       /root/hns-dane-bootstrap.log

Useful commands:
  hns-dane status
  hns-dane verify
  hns-dane print-wallet-instructions
  hns-dane print-hns-resource
  hns-dane backup

Direct DNS checks:
  dig @127.0.0.1 ${zone} SOA +dnssec
  dig @127.0.0.1 _443._tcp.${zone} TLSA +dnssec

If DNS tests fail but Knot is running, check any Linode Cloud Firewall first.
EOF
  chmod 0600 "$readme"

  ensure_dir 0755 "$(dirname "$profile_note")"
  cat > "$profile_note" <<'EOF'
if [ "$(id -u)" = "0" ] && [ -r /root/hns-dane-appliance/README-FIRST.txt ]; then
  printf '\nHNS DANE appliance: see /root/hns-dane-appliance/README-FIRST.txt\n'
  if command -v jq >/dev/null 2>&1 && [ -r /etc/hns-dane-appliance/config.json ]; then
    dashboard="$(jq -r '.dashboard.publicUrl // empty' /etc/hns-dane-appliance/config.json 2>/dev/null)"
    [ -n "$dashboard" ] && printf 'Dashboard: %s\n' "$dashboard"
  fi
  printf '\n'
fi
EOF
  chmod 0644 "$profile_note"
  log "Wrote SSH start-here instructions to $readme"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  generate_ssh_instructions "$@"
fi
