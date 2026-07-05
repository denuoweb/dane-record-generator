#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

render_wallet_instructions() {
  config_required
  [[ -f "$HNS_DANE_OUTPUT_DIR/hns-resource.json" ]] || fail "Missing HNS resource JSON. Run generate-hns-resource.sh first."

  local label ns ipv4 ipv6 key_tag algorithm digest_type digest resource_json
  label="$(json_get '.hns.label')"
  ns="$(json_get '.nameservers[0].name')"
  ipv4="$(json_get '.network.publicIPv4')"
  ipv6="$(json_get '.network.publicIPv6')"
  key_tag="$(json_get '.dnssec.ds.keyTag')"
  algorithm="$(json_get '.dnssec.ds.algorithm')"
  digest_type="$(json_get '.dnssec.ds.digestType')"
  digest="$(json_get '.dnssec.ds.digest')"
  resource_json="$(jq -c . "$HNS_DANE_OUTPUT_DIR/hns-resource.json")"

  ensure_dir 0700 "$HNS_DANE_OUTPUT_DIR"

  {
    printf '# HNS records for %s/\n\n' "$label"
    printf 'Copy these HNS records into your wallet or name resource editor. Do not paste wallet seeds or private keys into this appliance.\n\n'
    printf 'GLUE4\n'
    printf '  Nameserver: %s\n' "$ns"
    printf '  IPv4: %s\n\n' "$ipv4"
    if [[ -n "$ipv6" && "$ipv6" != "null" ]]; then
      printf 'GLUE6\n'
      printf '  Nameserver: %s\n' "$ns"
      printf '  IPv6: %s\n\n' "$ipv6"
    fi
    printf 'DS\n'
    printf '  Key tag: %s\n' "$key_tag"
    printf '  Algorithm: %s\n' "$algorithm"
    printf '  Digest type: %s\n' "$digest_type"
    printf '  Digest: %s\n\n' "$digest"
    printf 'Raw HNS resource JSON:\n\n```json\n%s\n```\n' "$(jq . "$HNS_DANE_OUTPUT_DIR/hns-resource.json")"
  } > "$HNS_DANE_OUTPUT_DIR/wallet-generic.md"

  {
    printf '# Bob Wallet instructions for %s/\n\n' "$label"
    printf '1. Open Bob Wallet and let it finish syncing.\n'
    printf '2. Open your name: %s/\n' "$label"
    printf '3. Open the DNS or resource records editor.\n'
    printf '4. Add the GLUE record exactly as shown in wallet-generic.md.\n'
    printf '5. Add the DS record exactly as shown in wallet-generic.md.\n'
    printf '6. Submit the update from your wallet.\n'
    printf '7. Return to the appliance dashboard after confirmation and refresh the verification section.\n\n'
    printf 'The appliance does not submit or sign the wallet transaction for you.\n'
  } > "$HNS_DANE_OUTPUT_DIR/wallet-bob.md"

  {
    printf '# hsd-cli / hsw-rpc instructions for %s/\n\n' "$label"
    printf 'Review this command before use. It spends from your own wallet and should be run only on your wallet machine.\n\n'
    printf '```bash\n'
    printf "hsw-rpc sendupdate %q %q\n" "$label" "$resource_json"
    printf '```\n\n'
    printf 'This appliance never receives your wallet seed, wallet password, or private key.\n'
  } > "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md"

  chmod 0644 "$HNS_DANE_OUTPUT_DIR"/wallet-*.md
  copy_public_file "$(selected_wallet_path)" "$HNS_DANE_FILES_DIR/wallet-instructions.txt"
  log "Wrote wallet instruction files."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  render_wallet_instructions "$@"
fi
