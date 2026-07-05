#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

verify_hns() {
  config_required
  ensure_dir 0755 "$HNS_DANE_FILES_DIR"
  local status_file="$HNS_DANE_FILES_DIR/status.json"
  [[ -f "$status_file" ]] || jq -n '{checkedAt: null, local: {}, hns: {}}' > "$status_file"

  local label message detected
  label="$(json_get '.hns.label')"
  detected=false
  message="Submit the generated records from your HNS wallet, then re-check."

  if command -v hsd-cli >/dev/null 2>&1; then
    if hsd-cli rpc getnameresource "$label" >/tmp/hns-dane-resource.json 2>/dev/null; then
      detected=true
      message="An hsd resource lookup returned data. Compare the DS and GLUE records with this dashboard before relying on it."
    fi
  fi

  local tmp
  tmp="$(mktemp "$HNS_DANE_FILES_DIR/.status.XXXXXX")"
  jq \
    --arg checkedAt "$(utc_now)" \
    --argjson detected "$detected" \
    --arg message "$message" \
    '.checkedAt = $checkedAt | .hns.parentResourceDetected = $detected | .hns.message = $message' \
    "$status_file" > "$tmp"
  mv "$tmp" "$status_file"
  chmod 0644 "$status_file"
  log "Updated HNS verification status."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  verify_hns "$@"
fi
