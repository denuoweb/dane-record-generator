#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

spki_sha256_from_cert() {
  local cert="$1"
  openssl x509 -in "$cert" -pubkey -noout \
    | openssl pkey -pubin -outform DER \
    | openssl dgst -sha256 -binary \
    | od -An -tx1 \
    | tr -d ' \n' \
    | tr '[:lower:]' '[:upper:]'
}

ensure_tls_material() {
  config_required
  require_cmd openssl

  local key cert zone cn
  key="$(json_get '.tls.privateKeyPath')"
  cert="$(json_get '.tls.certificatePath')"
  zone="$(json_get '.hns.zone')"
  cn="${zone%.}"

  ensure_dir 0700 "$(dirname "$key")"

  if [[ -f "$cert" && ! -f "$key" ]]; then
    fail "TLS certificate exists but private key is missing: $key"
  fi

  if [[ ! -f "$key" ]]; then
    log "Generating local TLS private key at $key"
    openssl ecparam -name prime256v1 -genkey -noout -out "$key"
    chmod 0600 "$key"
  else
    log "Keeping existing TLS private key at $key"
  fi

  if [[ ! -f "$cert" ]]; then
    log "Generating local self-signed HTTPS certificate at $cert"
    openssl req -new -x509 -sha256 -days 3650 \
      -key "$key" \
      -out "$cert" \
      -subj "/CN=${cn}" \
      -addext "subjectAltName=DNS:${cn},DNS:www.${cn}"
    chmod 0644 "$cert"
  else
    log "Keeping existing TLS certificate at $cert"
  fi

  local digest owner tlsa_record
  digest="$(spki_sha256_from_cert "$cert")"
  owner="$(json_get '.tlsa.owner')"
  tlsa_record="${owner} 3600 IN TLSA 3 1 1 ${digest}"

  json_set \
    --arg digest "$digest" \
    '.tls.spkiSha256 = $digest | .tlsa.associationData = $digest'

  ensure_dir 0700 "$HNS_DANE_OUTPUT_DIR"
  ensure_dir 0755 "$HNS_DANE_FILES_DIR"
  printf '%s\n' "$tlsa_record" > "$HNS_DANE_OUTPUT_DIR/tlsa.txt"
  chmod 0644 "$HNS_DANE_OUTPUT_DIR/tlsa.txt"
  copy_public_file "$HNS_DANE_OUTPUT_DIR/tlsa.txt" "$HNS_DANE_FILES_DIR/tlsa.txt"
  log "Wrote TLSA 3 1 1 record."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  ensure_tls_material "$@"
fi
