#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

detect_public_ipv4() {
  if [[ -n "${HNS_DANE_PUBLIC_IPV4:-}" ]]; then
    is_valid_ipv4 "$HNS_DANE_PUBLIC_IPV4" || fail "HNS_DANE_PUBLIC_IPV4 is not a valid IPv4 address."
    printf '%s\n' "$HNS_DANE_PUBLIC_IPV4"
    return 0
  fi

  local value=""
  value="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  if [[ -n "$value" ]] && is_valid_ipv4 "$value"; then
    printf '%s\n' "$value"
    return 0
  fi

  value="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '/ src / {for (i=1; i<=NF; i++) if ($i == "src") {print $(i+1); exit}}')"
  if [[ -n "$value" ]] && is_valid_ipv4 "$value"; then
    printf '%s\n' "$value"
    return 0
  fi

  fail "Could not detect a public IPv4 address. Set HNS_DANE_PUBLIC_IPV4 and rerun."
}

detect_public_ipv6() {
  if [[ -n "${HNS_DANE_PUBLIC_IPV6:-}" ]]; then
    is_valid_ipv6 "$HNS_DANE_PUBLIC_IPV6" || fail "HNS_DANE_PUBLIC_IPV6 is not a valid IPv6 address."
    printf '%s\n' "$HNS_DANE_PUBLIC_IPV6"
    return 0
  fi

  local value=""
  value="$(curl -fsS --max-time 5 https://api64.ipify.org 2>/dev/null || true)"
  if [[ -n "$value" ]] && is_valid_ipv6 "$value"; then
    printf '%s\n' "$value"
    return 0
  fi

  value="$(ip -6 route get 2606:4700:4700::1111 2>/dev/null | awk '/ src / {for (i=1; i<=NF; i++) if ($i == "src") {print $(i+1); exit}}')"
  if [[ -n "$value" ]] && is_valid_ipv6 "$value"; then
    printf '%s\n' "$value"
  fi
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-ipv4}" in
    ipv4) detect_public_ipv4 ;;
    ipv6) detect_public_ipv6 ;;
    *) fail "Usage: detect-ip.sh [ipv4|ipv6]" ;;
  esac
fi
