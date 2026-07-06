#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

generate_hns_resource() {
  config_required

  local ns ipv4 ipv6 key_tag algorithm digest_type digest capsule
  ns="$(json_get '.nameservers[0].name')"
  ipv4="$(json_get '.network.publicIPv4')"
  ipv6="$(json_get '.network.publicIPv6')"
  key_tag="$(json_get '.dnssec.ds.keyTag')"
  algorithm="$(json_get '.dnssec.ds.algorithm')"
  digest_type="$(json_get '.dnssec.ds.digestType')"
  digest="$(json_get '.dnssec.ds.digest')"

  [[ -n "$key_tag" && -n "$algorithm" && -n "$digest_type" && -n "$digest" ]] || {
    fail "DNSSEC DS is missing from config. Configure/sign Knot and rerun this script."
  }
  capsule="$(hns_browser_capsule_from_config)"

  ensure_dir 0700 "$HNS_DANE_OUTPUT_DIR"
  ensure_dir 0755 "$HNS_DANE_FILES_DIR"

  jq -n \
    --arg ns "$ns" \
    --arg ipv4 "$ipv4" \
    --arg ipv6 "$ipv6" \
    --arg keyTag "$key_tag" \
    --arg algorithm "$algorithm" \
    --arg digestType "$digest_type" \
    --arg digest "$digest" \
    --arg capsule "$capsule" \
    '{
      records: (
        [
          {type: "NS", ns: $ns},
          {type: "GLUE4", ns: $ns, address: $ipv4}
        ]
        + (if $ipv6 == "" or $ipv6 == "null" then [] else [{type: "GLUE6", ns: $ns, address: $ipv6}] end)
        + [
          {
            type: "DS",
            keyTag: ($keyTag | tonumber),
            algorithm: ($algorithm | tonumber),
            digestType: ($digestType | tonumber),
            digest: $digest
          },
          {
            type: "TXT",
            txt: [$capsule]
          }
        ]
      )
    }' > "$HNS_DANE_OUTPUT_DIR/hns-resource.json"

  chmod 0644 "$HNS_DANE_OUTPUT_DIR/hns-resource.json"
  copy_public_file "$HNS_DANE_OUTPUT_DIR/hns-resource.json" "$HNS_DANE_FILES_DIR/hns-resource.json"

  printf 'DS %s %s %s %s\n' "$key_tag" "$algorithm" "$digest_type" "$digest" > "$HNS_DANE_OUTPUT_DIR/ds.txt"
  chmod 0644 "$HNS_DANE_OUTPUT_DIR/ds.txt"
  copy_public_file "$HNS_DANE_OUTPUT_DIR/ds.txt" "$HNS_DANE_FILES_DIR/ds.txt"

  log "Wrote HNS resource JSON."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  generate_hns_resource "$@"
fi
