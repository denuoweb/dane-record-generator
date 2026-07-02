# Web Admin Guide

This tool answers two questions:

1. What do I put in the wallet or registrar?
2. What do I put on my DNS server?

## Recommended first setup

Use **Delegated authoritative DNS**.

For an HNS name such as `example/`:

1. Run an authoritative DNS server.
2. Use a nameserver name such as `ns1.example.`.
3. Put that nameserver IP in the HNS wallet as `GLUE4` or `GLUE6`.
4. Put the web server IP and TLSA record in the DNS zone.
5. Enable DNSSEC signing.
6. Publish the DS record in the HNS wallet.

For HNS names, **SYNTH nameserver** is also supported. It stores the authoritative nameserver IP in the HNS resource as `SYNTH4` or `SYNTH6`; the DNS server still publishes the website `A`/`AAAA`, `TLSA`, and signed DNSSEC records.

## Easiest DNS server choice

- **Hosted DNS provider panel**: easiest if the provider supports DNSSEC signing, DS/DNSKEY export, and custom TLSA records.
- **Generic zone file**: best neutral output; works as a base for most DNS servers.
- **PowerDNS Authoritative**: easiest for API/database workflows.
- **Knot DNS**: clean modern authoritative server with good DNSSEC automation.
- **BIND 9**: widely documented and available everywhere; more verbose.
- **NSD**: small authoritative server; signing is usually a separate step.

If you are unsure, start with **Hosted DNS provider panel** when you already use a DNS host. Start with **Generic zone file** when you are running your own authoritative server.

## Wallet / registrar side

Parent-side records only tell resolvers where authority starts.

HNS parent examples:

```zone
GLUE4 ns1.example. 203.0.113.10
DS 12345 13 2 7A1B...F09C
```

ICANN registrar examples:

```text
Nameserver: ns1.example.com.
Glue IPv4: 203.0.113.10
DS: 12345 13 2 7A1B...F09C
```

## DNS server side

The authoritative DNS server publishes the website and DANE records:

```zone
example. 3600 IN NS ns1.example.
example. 3600 IN A 203.0.113.20
_443._tcp.example. 3600 IN TLSA 3 1 1 <spki-sha256>
```

## Web server side

Nginx, Apache, and Caddy do not need a DANE plugin. They serve the normal certificate and private key. DANE-aware clients verify the TLSA record through DNSSEC.

## Internationalized names

Use the Unicode spelling for human-facing notes, but use the generated ASCII `xn--` A-labels in DNS records, wallet fields, registrar fields, server configs, and verification commands.

Examples:

```text
Unicode input: an internationalized domain name
DNS output:    xn--... A-label form
```

The standards tracked by this project are in [Internationalization standards](I18N_STANDARDS.md).

## FAQ

### Do I need glue?

Glue is needed when the nameserver is inside the same zone. For `example/` using `ns1.example.`, publish `GLUE4` or `GLUE6` in the HNS wallet. If the nameserver is external, such as a provider nameserver, publish `NS` instead.

### Is SYNTH the website IP?

No. `SYNTH4` and `SYNTH6` are HNS nameserver referrals. They tell resolvers how to reach the authoritative DNS server. The website IP belongs in the authoritative zone as `A` or `AAAA`.

### When do I paste DNSKEY?

Paste DNSKEY after DNSSEC signing is enabled on the authoritative zone. The app uses the public DNSKEY to generate the parent-side DS record.

### What if my DNS provider cannot create TLSA?

Use a provider or authoritative DNS server that supports custom TLSA records. Without TLSA in the signed zone, the DANE part is not complete.

### What if my DNS provider hides DNSKEY and only gives DS?

Use the provider's DS directly at the parent. This app can generate DS from DNSKEY, but provider-managed DNSSEC sometimes gives you the final DS instead.

### Does this replace DNSSEC signing tools?

No. The DNS server or DNS provider signs the zone. This app only prepares records and checks the parent/server split.
