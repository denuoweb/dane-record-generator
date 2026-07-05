#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
# shellcheck source=generate-zone.sh
source "$SCRIPT_DIR/generate-zone.sh"

parse_ds_line_to_config() {
  local ds_line="$1"
  local key_tag algorithm digest_type digest
  key_tag="$(awk '{for (i=1; i<=NF; i++) if ($i == "DS") {print $(i+1); exit}}' <<< "$ds_line")"
  if [[ -z "$key_tag" ]]; then
    key_tag="$(awk '{print $1}' <<< "$ds_line")"
    algorithm="$(awk '{print $2}' <<< "$ds_line")"
    digest_type="$(awk '{print $3}' <<< "$ds_line")"
    digest="$(awk '{print $4}' <<< "$ds_line")"
  else
    algorithm="$(awk '{for (i=1; i<=NF; i++) if ($i == "DS") {print $(i+2); exit}}' <<< "$ds_line")"
    digest_type="$(awk '{for (i=1; i<=NF; i++) if ($i == "DS") {print $(i+3); exit}}' <<< "$ds_line")"
    digest="$(awk '{for (i=1; i<=NF; i++) if ($i == "DS") {print $(i+4); exit}}' <<< "$ds_line")"
  fi
  [[ -n "$key_tag" && -n "$algorithm" && -n "$digest_type" && -n "$digest" ]] || return 1
  json_set \
    --argjson keyTag "$key_tag" \
    --argjson algorithm "$algorithm" \
    --argjson digestType "$digest_type" \
    --arg digest "$digest" \
    '.dnssec.ds = {keyTag: $keyTag, algorithm: $algorithm, digestType: $digestType, digest: $digest}'
}

knot_keymgr() {
  if id knot >/dev/null 2>&1 && command -v runuser >/dev/null 2>&1 && [[ "${HNS_DANE_TEST:-0}" != "1" ]]; then
    runuser -u knot -- keymgr -c "$HNS_DANE_KNOT_CONF" "$@"
  else
    keymgr -c "$HNS_DANE_KNOT_CONF" "$@"
  fi
}

configure_knot() {
  require_root
  config_required
  generate_zone

  local zone label zone_file storage
  zone="$(json_get '.hns.zone')"
  label="$(json_get '.hns.label')"
  zone_file="$HNS_DANE_ZONE_DIR/${label}.zone"
  storage="$HNS_DANE_ZONE_DIR"

  ensure_dir 0755 "$(dirname "$HNS_DANE_KNOT_CONF")"
  cat > "$HNS_DANE_KNOT_CONF" <<EOF
server:
  listen: 0.0.0.0@53
  listen: ::@53

log:
  - target: syslog
    any: info

policy:
  - id: hns-dane-manual
    manual: on
    algorithm: ECDSAP256SHA256

zone:
  - domain: ${zone}
    storage: ${storage}
    file: $(basename "$zone_file")
    dnssec-signing: on
    dnssec-policy: hns-dane-manual
    semantic-checks: on
EOF

  chown -R knot:knot "$HNS_DANE_ZONE_DIR" 2>/dev/null || true
  chmod -R go-rwx /var/lib/knot/keys /var/lib/knot/kasp 2>/dev/null || true

  if command -v keymgr >/dev/null 2>&1; then
    if ! knot_keymgr "$zone" list 2>/dev/null | awk 'NF {found=1} END {exit found ? 0 : 1}'; then
      knot_keymgr "$zone" generate algorithm=ECDSAP256SHA256 ksk=yes zsk=yes
      log "Generated initial Knot DNSSEC key for $zone"
    else
      log "Keeping existing Knot DNSSEC key material for $zone"
    fi
  fi

  safe_systemctl enable knot >/dev/null 2>&1 || true
  safe_systemctl restart knot >/dev/null 2>&1 || true
  if command -v knotc >/dev/null 2>&1; then
    knotc reload >/dev/null 2>&1 || true
    knotc zone-reload "$zone" >/dev/null 2>&1 || true
  fi

  if command -v keymgr >/dev/null 2>&1; then
    local ds_line
    ds_line="$(knot_keymgr "$zone" ds 2>/dev/null | awk '
      {
        for (i = 1; i <= NF; i++) {
          if ($i == "DS" && $(i + 3) == 2) { print; exit }
        }
        if (NF >= 4 && $3 == 2) { print; exit }
      }
    ' || true)"
    if [[ -z "$ds_line" ]]; then
      ds_line="$(knot_keymgr "$zone" ds 2>/dev/null | awk 'NF {print; exit}' || true)"
    fi
    if [[ -n "$ds_line" ]]; then
      parse_ds_line_to_config "$ds_line" || fail "Could not parse DS from keymgr output: $ds_line"
      printf '%s\n' "$ds_line" > "$HNS_DANE_OUTPUT_DIR/ds.txt"
      chmod 0644 "$HNS_DANE_OUTPUT_DIR/ds.txt"
      copy_public_file "$HNS_DANE_OUTPUT_DIR/ds.txt" "$HNS_DANE_FILES_DIR/ds.txt"
    else
      log "Knot keymgr did not return a DS yet; run hns-dane verify after Knot signs the zone."
    fi
  fi

  log "Configured Knot authoritative DNS."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  configure_knot "$@"
fi
