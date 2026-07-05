#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

generate_zone() {
  config_required

  local zone label ipv4 ipv6 ns tlsa serial zone_file marker
  zone="$(json_get '.hns.zone')"
  label="$(json_get '.hns.label')"
  ipv4="$(json_get '.network.publicIPv4')"
  ipv6="$(json_get '.network.publicIPv6')"
  ns="$(json_get '.nameservers[0].name')"
  tlsa="$(json_get '.tlsa.associationData')"
  [[ -n "$tlsa" && "$tlsa" != "null" ]] || fail "TLSA association data is missing. Run generate-tlsa.sh first."

  serial="$(date -u '+%Y%m%d%H')"
  zone_file="$HNS_DANE_ZONE_DIR/${label}.zone"
  marker="hns-dane-appliance=${HNS_DANE_VERSION}"
  ensure_dir 0755 "$HNS_DANE_ZONE_DIR"

  {
    printf '$ORIGIN %s\n' "$zone"
    printf '$TTL 3600\n\n'
    printf '@ IN SOA %s hostmaster.%s (\n' "$ns" "$zone"
    printf '  %s ; serial\n' "$serial"
    printf '  3600       ; refresh\n'
    printf '  900        ; retry\n'
    printf '  1209600    ; expire\n'
    printf '  3600       ; minimum\n'
    printf ')\n\n'
    printf '@ IN NS %s\n' "$ns"
    printf 'ns1 IN A %s\n' "$ipv4"
    printf '@ IN A %s\n' "$ipv4"
    printf 'www IN A %s\n' "$ipv4"
    if [[ -n "$ipv6" && "$ipv6" != "null" ]]; then
      printf 'ns1 IN AAAA %s\n' "$ipv6"
      printf '@ IN AAAA %s\n' "$ipv6"
      printf 'www IN AAAA %s\n' "$ipv6"
    fi
    printf '_443._tcp IN TLSA 3 1 1 %s\n' "$tlsa"
    printf '@ IN TXT "%s"\n' "$marker"
  } | write_atomic "$zone_file"

  chmod 0644 "$zone_file"
  copy_public_file "$zone_file" "$HNS_DANE_FILES_DIR/zone.txt"
  log "Wrote unsigned source zone to $zone_file"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  generate_zone "$@"
fi
