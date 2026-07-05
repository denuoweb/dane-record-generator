#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

generate_dashboard() {
  config_required
  ensure_dir 0755 "$HNS_DANE_WEB"
  ensure_dir 0755 "$HNS_DANE_FILES_DIR"

  python3 - "$HNS_DANE_CONFIG" "$HNS_DANE_OUTPUT_DIR/hns-resource.json" "$HNS_DANE_FILES_DIR/status.json" > "$HNS_DANE_WEB/index.html" <<'PY'
import html
import json
import pathlib
import sys

config_path, resource_path, status_path = map(pathlib.Path, sys.argv[1:4])
cfg = json.loads(config_path.read_text())
resource = json.loads(resource_path.read_text()) if resource_path.exists() else {"records": []}
status = json.loads(status_path.read_text()) if status_path.exists() else {
    "checkedAt": None,
    "local": {},
    "hns": {"parentResourceDetected": False, "dsMatches": None, "message": "Submit the generated records from your HNS wallet, then re-check."}
}

def e(value):
    return html.escape("" if value is None else str(value), quote=True)

label = cfg["hns"]["label"]
zone = cfg["hns"]["zone"]
title = cfg.get("site", {}).get("title") or "HNS DANE Site"
ipv4 = cfg["network"]["publicIPv4"]
ipv6 = cfg["network"].get("publicIPv6")
ns = cfg["nameservers"][0]["name"]
ds = cfg.get("dnssec", {}).get("ds") or {}
tlsa = cfg.get("tlsa", {})
records = resource.get("records", [])

def record_rows():
    rows = []
    for record in records:
        fields = ", ".join(f"{k}: {v}" for k, v in record.items() if k != "type")
        rows.append(f"<tr><th>{e(record.get('type'))}</th><td><code>{e(fields)}</code></td></tr>")
    return "\n".join(rows) or '<tr><td colspan="2">Records are not ready yet.</td></tr>'

def local_status_cards():
    local = status.get("local", {})
    labels = [
        ("knotRunning", "Knot DNS running"),
        ("nginxRunning", "nginx running"),
        ("dnsPort53Listening", "DNS port 53 listening"),
        ("httpPort80Listening", "HTTP port 80 listening"),
        ("httpsPort443Listening", "HTTPS port 443 listening"),
        ("zoneSigned", "Signed zone answers locally"),
        ("publicAuthoritativeReachable", "Public authoritative DNS answers"),
        ("tlsaMatchesHttpsKey", "HTTPS key matches TLSA"),
    ]
    cards = []
    for key, label_text in labels:
        value = local.get(key)
        klass = "ok" if value is True else "warn" if value is None else "bad"
        text = "Ready" if value is True else "Pending" if value is None else "Needs attention"
        cards.append(f'<section class="card {klass}"><h3>{e(label_text)}</h3><p>{e(text)}</p></section>')
    return "\n".join(cards)

digest = ds.get("digest", "")
wallet_json = json.dumps(resource, indent=2)
status_message = status.get("hns", {}).get("message", "Submit the generated records from your HNS wallet, then re-check.")

print(f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)} - {e(label)}/</title>
  <style>
    :root {{ color-scheme: light dark; --bg: #f7f8fa; --fg: #17202a; --muted: #5b6573; --line: #ccd3dc; --ok: #176b47; --warn: #8a5a00; --bad: #9c2f2f; }}
    body {{ margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--fg); line-height: 1.5; }}
    main {{ max-width: 1120px; margin: 0 auto; padding: 28px 18px 56px; }}
    header {{ border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 24px; }}
    h1 {{ margin: 0 0 8px; font-size: clamp(1.8rem, 4vw, 3rem); }}
    h2 {{ margin-top: 30px; font-size: 1.25rem; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }}
    .card {{ border: 1px solid var(--line); border-left-width: 5px; border-radius: 8px; padding: 14px; background: color-mix(in srgb, canvas 90%, transparent); }}
    .ok {{ border-left-color: var(--ok); }}
    .warn {{ border-left-color: var(--warn); }}
    .bad {{ border-left-color: var(--bad); }}
    code, pre {{ background: color-mix(in srgb, canvasText 8%, transparent); border-radius: 6px; }}
    code {{ padding: 2px 4px; overflow-wrap: anywhere; }}
    pre {{ padding: 12px; overflow-x: auto; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); padding: 10px; }}
    a {{ color: LinkText; }}
    .downloads a {{ display: inline-block; margin: 0 10px 10px 0; }}
  </style>
</head>
<body>
<main>
  <header>
    <h1>{e(label)}/ deployment dashboard</h1>
    <p>{e(title)} is configured as an authoritative DNSSEC + DANE appliance for <code>{e(zone)}</code>.</p>
  </header>

  <section>
    <h2>Server Ready</h2>
    <div class="grid">
      <section class="card ok"><h3>Handshake name</h3><p><code>{e(label)}/</code></p></section>
      <section class="card ok"><h3>Nameserver</h3><p><code>{e(ns)}</code></p></section>
      <section class="card ok"><h3>IPv4</h3><p><code>{e(ipv4)}</code></p></section>
      <section class="card {'ok' if ipv6 else 'warn'}"><h3>IPv6</h3><p><code>{e(ipv6 or 'Not enabled or not detected')}</code></p></section>
    </div>
  </section>

  <section>
    <h2>Preflight</h2>
    <p>Allow TCP 22, UDP 53, TCP 53, TCP 80, and TCP 443 in both UFW and any Linode Cloud Firewall.</p>
    <p><a href="/preflight.html">Open the firewall checklist</a></p>
  </section>

  <section>
    <h2>HNS Wallet Records To Submit</h2>
    <table><tbody>{record_rows()}</tbody></table>
    <pre>{e(wallet_json)}</pre>
  </section>

  <section>
    <h2>DNSSEC / DS Status</h2>
    <p>Parent-facing DNSSEC rollover is disabled by default. Keep this DS in your HNS resource until you intentionally run a guided rollover.</p>
    <pre>DS {e(ds.get('keyTag'))} {e(ds.get('algorithm'))} {e(ds.get('digestType'))} {e(digest)}</pre>
  </section>

  <section>
    <h2>TLSA / DANE Status</h2>
    <p>TLS private-key rotation is frozen by default. Do not replace the HTTPS key unless you also stage a TLSA rollover.</p>
    <pre>{e(tlsa.get('owner'))} 3600 IN TLSA 3 1 1 {e(tlsa.get('associationData'))}</pre>
  </section>

  <section>
    <h2>Status Checks</h2>
    <div class="grid">{local_status_cards()}</div>
    <section class="card warn"><h3>HNS parent update</h3><p>{e(status_message)}</p></section>
  </section>

  <section>
    <h2>Verification Commands</h2>
    <pre>dig @{e(ipv4)} {e(zone)} SOA +dnssec +norecurse
dig @{e(ipv4)} {e(zone)} DNSKEY +dnssec +norecurse
dig @{e(ipv4)} _443._tcp.{e(zone)} TLSA +dnssec +norecurse
openssl s_client -connect {e(ipv4)}:443 -servername {e(zone.rstrip('.'))}</pre>
  </section>

  <section class="downloads">
    <h2>Downloads</h2>
    <a href="/files/hns-resource.json">HNS resource JSON</a>
    <a href="/files/tlsa.txt">TLSA</a>
    <a href="/files/ds.txt">DS</a>
    <a href="/files/wallet-instructions.txt">Wallet instructions</a>
    <a href="/files/status.json">Status JSON</a>
  </section>

  <section>
    <h2>Troubleshooting</h2>
    <p>If DNS tests fail but Knot is running, check the Linode Cloud Firewall before changing DNS records.</p>
    <p>If the DS in HNS does not match this page, copy the DS shown here into your wallet and submit a new HNS update.</p>
  </section>

  <details>
    <summary>Advanced details</summary>
    <pre>{e(json.dumps(cfg, indent=2))}</pre>
  </details>
</main>
</body>
</html>""")
PY

  python3 - > "$HNS_DANE_WEB/preflight.html" <<'PY'
import html
ports = [
    ("TCP 22", "SSH access"),
    ("UDP 53", "authoritative DNS"),
    ("TCP 53", "DNS fallback and large DNSSEC answers"),
    ("TCP 80", "HTTP dashboard"),
    ("TCP 443", "HTTPS test site and DANE endpoint"),
]
rows = "\n".join(f"<tr><th>{html.escape(p)}</th><td>{html.escape(d)}</td></tr>" for p, d in ports)
print(f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Firewall preflight</title>
<style>body{{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:28px 18px;line-height:1.5}}table{{border-collapse:collapse;width:100%}}th,td{{border-bottom:1px solid #ccd3dc;padding:10px;text-align:left}}code{{background:#eef1f5;padding:2px 4px;border-radius:4px}}</style></head>
<body>
<h1>Firewall preflight</h1>
<p>The appliance configures UFW on the server. If you attach a Linode Cloud Firewall, allow the same ports there too.</p>
<table><tbody>{rows}</tbody></table>
<p>If DNS tests fail but the server says Knot is running, check the Linode Cloud Firewall first.</p>
<p><a href="/">Return to dashboard</a></p>
</body></html>""")
PY

  chmod 0644 "$HNS_DANE_WEB/index.html" "$HNS_DANE_WEB/preflight.html"
  log "Wrote dashboard to $HNS_DANE_WEB/index.html"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  generate_dashboard "$@"
fi
