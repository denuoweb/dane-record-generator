#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

render_wallet_instructions() {
  config_required
  [[ -f "$HNS_DANE_OUTPUT_DIR/hns-resource.json" ]] || fail "Missing HNS resource JSON. Run generate-hns-resource.sh first."

  local label ns ipv4 ipv6 key_tag algorithm digest_type digest capsule resource_json hsd_wallet_id hsd_account_name account_arg
  label="$(json_get '.hns.label')"
  ns="$(json_get '.nameservers[0].name')"
  ipv4="$(json_get '.network.publicIPv4')"
  ipv6="$(json_get '.network.publicIPv6')"
  key_tag="$(json_get '.dnssec.ds.keyTag')"
  algorithm="$(json_get '.dnssec.ds.algorithm')"
  digest_type="$(json_get '.dnssec.ds.digestType')"
  digest="$(json_get '.dnssec.ds.digest')"
  capsule="$(hns_browser_capsule_from_config)"
  resource_json="$(jq -c . "$HNS_DANE_OUTPUT_DIR/hns-resource.json")"
  hsd_wallet_id="$(json_get '.hns.hsdWalletId')"
  hsd_wallet_id="${hsd_wallet_id:-primary}"
  hsd_account_name="$(json_get '.hns.hsdAccountName')"
  hsd_account_name="${hsd_account_name:-default}"
  account_arg=""
  if [[ -n "$hsd_account_name" ]]; then
    account_arg=" ${hsd_account_name}"
  fi

  ensure_dir 0700 "$HNS_DANE_OUTPUT_DIR"

  {
    printf '# HNS records for %s/\n\n' "$label"
    printf 'Copy these HNS records into your wallet or name resource editor. Submitting this update replaces the current HNS resource; records not listed here are removed. Do not paste wallet seeds or private keys into this appliance.\n\n'
    printf 'NS\n'
    printf '  Nameserver: %s\n\n' "$ns"
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
    printf 'TXT\n'
    printf '  %s\n\n' "$capsule"
    printf 'Raw HNS resource JSON:\n\n```json\n%s\n```\n' "$(jq . "$HNS_DANE_OUTPUT_DIR/hns-resource.json")"
  } > "$HNS_DANE_OUTPUT_DIR/wallet-generic.md"

  {
    printf '# Bob Wallet instructions for %s/\n\n' "$label"
    printf '1. Open Bob Wallet and let it finish syncing.\n'
    printf '2. Open your name: %s/\n' "$label"
    printf '3. Open the DNS or resource records editor.\n'
    printf '4. Add the NS and GLUE records exactly as shown in wallet-generic.md.\n'
    printf '5. Add the DS and TXT records exactly as shown in wallet-generic.md.\n'
    printf '6. Remove any old records that are not in wallet-generic.md.\n'
    printf '7. Submit the update from your wallet.\n'
    printf '8. Return to the appliance dashboard after confirmation and refresh the verification section.\n\n'
    printf 'The appliance does not submit or sign the wallet transaction for you.\n'
  } > "$HNS_DANE_OUTPUT_DIR/wallet-bob.md"

  {
    printf '# hsd-cli / hsw-rpc instructions for %s/\n\n' "$label"
    printf 'Run this only on the wallet machine that owns the registered name. The appliance does not submit or sign the wallet transaction for you.\n\n'
    printf 'These instructions are set for hsd wallet id `%s`' "$hsd_wallet_id"
    if [[ -n "$hsd_account_name" ]]; then
      printf ' and hsd account `%s`' "$hsd_account_name"
    fi
    printf '. Use `primary` and `default` for a normal hsd wallet. Change these only when the owning name is stored in a different local hsd wallet or account.\n\n'
    printf '`hsd-rpc` can check public chain name state, but `sendupdate` is a wallet RPC method and must be run with `hsw-rpc`. For raw wallet RPC methods, select the wallet first; `--id` is used by `hsw-cli` REST helpers but does not select the JSON-RPC wallet context for `sendupdate`.\n\n'
    printf 'First confirm the node sees the registered name:\n\n'
    printf '```bash\n'
    printf 'hsd-rpc getnameinfo %s true\n' "$label"
    printf '```\n\n'
    printf 'Then confirm this wallet tracks and owns the name:\n\n'
    printf '```bash\n'
    printf 'hsw-cli wallets\n'
    printf 'hsw-cli --id %s account list\n' "$hsd_wallet_id"
    printf 'hsw-rpc selectwallet %s\n' "$hsd_wallet_id"
    printf 'hsw-rpc getnameinfo %s\n' "$label"
    printf 'hsw-rpc getnames true\n'
    printf '```\n\n'
    printf 'If the wallet RPC commands say `Auction not found`, this wallet id and account do not have the name state for `%s`. Use the wallet and account that own `%s/`, let hsd sync, or import/rescan the wallet before sending an update.\n\n' "$label" "$label"
    printf 'When the wallet shows the name as owned/registered, submit this resource update:\n\n'
    printf '```bash\n'
    printf 'hsw-rpc selectwallet %s\n' "$hsd_wallet_id"
    printf "hsw-rpc sendupdate %s '%s'%s\n" "$label" "$resource_json" "$account_arg"
    printf '```\n\n'
    printf 'This command spends from your own wallet. Never paste your wallet seed, wallet password, or private key into this appliance.\n'
  } > "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md"

  chmod 0644 "$HNS_DANE_OUTPUT_DIR"/wallet-*.md
  copy_public_file "$(selected_wallet_path)" "$HNS_DANE_FILES_DIR/wallet-instructions.txt"
  log "Wrote wallet instruction files."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  render_wallet_instructions "$@"
fi
