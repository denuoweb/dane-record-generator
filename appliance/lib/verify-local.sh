#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

bool() {
  if "$@" >/dev/null 2>&1; then
    printf 'true'
  else
    printf 'false'
  fi
}

systemd_active() {
  local service="$1"
  command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet "$service"
}

port_listening() {
  local port="$1"
  command -v ss >/dev/null 2>&1 && ss -lntup 2>/dev/null | awk -v p=":${port}" '$0 ~ p {found=1} END {exit found ? 0 : 1}'
}

udp_port_listening() {
  local port="$1"
  command -v ss >/dev/null 2>&1 && ss -lnup 2>/dev/null | awk -v p=":${port}" '$0 ~ p {found=1} END {exit found ? 0 : 1}'
}

dig_local() {
  local name="$1"
  local type="$2"
  command -v dig >/dev/null 2>&1 && dig @127.0.0.1 "$name" "$type" +dnssec +norecurse +time=2 +tries=1 | grep -q 'status: NOERROR'
}

dig_authoritative_public() {
  local server="$1"
  local name="$2"
  local type="$3"
  command -v dig >/dev/null 2>&1 && dig @"$server" "$name" "$type" +dnssec +norecurse +time=2 +tries=1 | grep -q 'status: NOERROR'
}

live_https_spki_matches() {
  config_required
  command -v openssl >/dev/null 2>&1 || return 1
  local host expected live
  host="$(json_get '.network.publicIPv4')"
  expected="$(json_get '.tlsa.associationData')"
  [[ -n "$host" && -n "$expected" ]] || return 1
  live="$(timeout 8 openssl s_client -connect "${host}:443" -servername "$(json_get '.hns.zone' | sed 's/\.$//')" </dev/null 2>/dev/null \
    | openssl x509 -pubkey -noout 2>/dev/null \
    | openssl pkey -pubin -outform DER 2>/dev/null \
    | openssl dgst -sha256 -binary 2>/dev/null \
    | od -An -tx1 \
    | tr -d ' \n' \
    | tr '[:lower:]' '[:upper:]' || true)"
  [[ "$live" == "$expected" ]]
}

verify_local() {
  config_required
  ensure_dir 0755 "$HNS_DANE_FILES_DIR"

  local zone tlsa_owner public_ipv4
  zone="$(json_get '.hns.zone')"
  tlsa_owner="$(json_get '.tlsa.owner')"
  public_ipv4="$(json_get '.network.publicIPv4')"

  local knot nginx tcp53 udp53 tcp80 tcp443 zone_signed dnskey_ok tlsa_ok public_dns_ok https_ok
  knot="$(bool systemd_active knot)"
  nginx="$(bool systemd_active nginx)"
  tcp53="$(bool port_listening 53)"
  udp53="$(bool udp_port_listening 53)"
  tcp80="$(bool port_listening 80)"
  tcp443="$(bool port_listening 443)"
  zone_signed="$(bool dig_local "$zone" SOA)"
  dnskey_ok="$(bool dig_local "$zone" DNSKEY)"
  tlsa_ok="$(bool dig_local "$tlsa_owner" TLSA)"
  public_dns_ok="$(bool dig_authoritative_public "$public_ipv4" "$zone" A)"
  https_ok="$(bool live_https_spki_matches)"

  jq -n \
    --arg checkedAt "$(utc_now)" \
    --argjson knotRunning "$knot" \
    --argjson nginxRunning "$nginx" \
    --argjson dnsPort53Listening "$([[ "$tcp53" == "true" && "$udp53" == "true" ]] && echo true || echo false)" \
    --argjson httpPort80Listening "$tcp80" \
    --argjson httpsPort443Listening "$tcp443" \
    --argjson zoneSigned "$([[ "$zone_signed" == "true" && "$dnskey_ok" == "true" && "$tlsa_ok" == "true" ]] && echo true || echo false)" \
    --argjson publicAuthoritativeReachable "$public_dns_ok" \
    --argjson tlsaMatchesHttpsKey "$https_ok" \
    '{
      checkedAt: $checkedAt,
      local: {
        knotRunning: $knotRunning,
        nginxRunning: $nginxRunning,
        dnsPort53Listening: $dnsPort53Listening,
        httpPort80Listening: $httpPort80Listening,
        httpsPort443Listening: $httpsPort443Listening,
        zoneSigned: $zoneSigned,
        publicAuthoritativeReachable: $publicAuthoritativeReachable,
        tlsaMatchesHttpsKey: $tlsaMatchesHttpsKey
      },
      hns: {
        parentResourceDetected: false,
        dsMatches: null,
        message: "Submit the generated records from your HNS wallet, then re-check."
      }
    }' > "$HNS_DANE_FILES_DIR/status.json"

  chmod 0644 "$HNS_DANE_FILES_DIR/status.json"
  log "Wrote local verification status to $HNS_DANE_FILES_DIR/status.json"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  verify_local "$@"
fi
