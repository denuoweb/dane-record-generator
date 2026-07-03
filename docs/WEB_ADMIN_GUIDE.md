# Web Admin Guide

This tool answers two questions:

1. What do I put in the wallet or registrar?
2. What do I put on my DNS server?

## Recommended first setup

Use **Delegated authoritative DNS**.

For an HNS name such as `dane/`:

1. Run an authoritative DNS server.
2. Use a nameserver name such as `ns1.dane.`.
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
GLUE4 ns1.dane. 203.0.113.10
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
dane. 3600 IN NS ns1.dane.
dane. 3600 IN A 203.0.113.20
_443._tcp.dane. 3600 IN TLSA 3 1 1 <spki-sha256>
```

## Running your own authoritative nameserver

If you run the nameserver yourself, the generated records are only the zone content. The service still needs normal authoritative-DNS operations:

- Listen publicly on both UDP/53 and TCP/53. DNSSEC responses are often larger, and TCP fallback must work.
- Disable recursion on the authoritative service. Do not expose an open resolver from the same listener.
- Allow DNS through host firewalls, network firewalls, cloud security groups, and upstream provider filters.
- Keep the SOA serial increasing for every zone-source change.
- Prefer at least two authoritative nameservers on separate hosts, networks, or providers.
- Monitor logs and query behavior for lame delegation, refused queries, truncation, and TCP failures.
- Re-sign before RRSIG expiration and ensure the signer publishes DNSKEY, RRSIG, and NSEC or NSEC3 records.

The presets are intentionally starter snippets. They are not complete OS package, service manager, firewall, monitoring, or multi-primary/secondary replication guides.

## DNSSEC lifecycle

DNSSEC needs more than a one-time "enable signing" switch.

Typical key roles:

- **KSK**: key-signing key. This normally has DNSKEY flags `257` and is the key used to create the parent DS.
- **ZSK**: zone-signing key. This normally has DNSKEY flags `256` and signs ordinary zone data.

Some DNS providers and modern servers automate this, but the parent DS still needs to match the child zone's active KSK. Validation fails when the parent and child disagree.

Safe initial DS order:

1. Create the authoritative zone and publish the unsigned records.
2. Enable DNSSEC signing on the child zone.
3. Confirm the child zone serves DNSKEY and RRSIG records.
4. Generate or copy the DS from the active KSK.
5. Publish the DS in the HNS name resource or registrar/parent panel.
6. Validate through a DNSSEC-validating resolver.

Common `SERVFAIL` causes:

- Parent DS points at the wrong DNSKEY.
- DNSKEY was pasted from a different zone.
- RRSIG records expired or the signer stopped refreshing them.
- Signed negative answers are missing or broken because NSEC/NSEC3 is not being served correctly.
- A resolver does not support the chosen DNSSEC algorithm.
- The authoritative server is unreachable over TCP/53 after UDP truncation.

## Validation commands

Direct authoritative queries prove the server answers; they do not prove the DNSSEC chain validates:

```bash
dig @203.0.113.10 example. SOA +norecurse
dig @203.0.113.10 example. A +dnssec +norecurse
dig @203.0.113.10 _443._tcp.example. TLSA +dnssec +norecurse
```

After the parent DS is published, use a validating resolver. For ICANN DNS:

```bash
delv example.com. A
delv _443._tcp.example.com. TLSA
dig @<validating-recursive-resolver> _443._tcp.example.com. TLSA +dnssec
```

In the `dig` response from a validating resolver, check for `status: NOERROR` and the `ad` flag. If validation fails, many validating resolvers return `SERVFAIL`.

For HNS, use an HNS-aware validating resolver after the wallet update confirms:

```bash
dig @<hns-validating-recursive-resolver> example. A +dnssec
dig @<hns-validating-recursive-resolver> _443._tcp.example. TLSA +dnssec
```

## TLSA key rollover

The default TLSA shape is `3 1 1`, which pins the TLS service public key with SHA-256. Certificate renewal is simple only when the server keeps the same keypair. If the key changes before clients can see the new TLSA record, DANE-aware clients can fail authentication.

Safe rollover:

1. Generate the next certificate/keypair.
2. Publish TLSA records for both the current public key and next public key.
3. Wait at least one TTL, and longer if your DNS provider or resolver path caches aggressively.
4. Switch the web server to the next certificate/keypair.
5. Verify the live TLS service matches the new TLSA record.
6. Remove the old TLSA record after another TTL window.

## Web server side

Nginx, Apache, and Caddy do not need a DANE plugin. They serve the normal certificate and private key. DANE-aware clients verify the TLSA record through DNSSEC.

Publishing TLSA does not mean every client enforces DANE. The client must validate DNSSEC and implement DANE/TLSA checking. This matters especially for HTTPS, where mainstream browser enforcement is not uniform. Treat "TLSA is published and signed" and "the application enforces DANE" as separate checks.

## Services and hostnames

The default web flow targets apex HTTPS, such as:

```zone
_443._tcp.example. 3600 IN TLSA 3 1 1 <spki-sha256>
```

Each hostname, service, and port that should use DANE needs its own TLSA owner name. Examples:

```zone
_443._tcp.www.example. 3600 IN TLSA 3 1 1 <spki-sha256>
_25._tcp.mail.example. 3600 IN TLSA 3 1 1 <spki-sha256>
_993._tcp.imap.example. 3600 IN TLSA 3 1 1 <spki-sha256>
```

SMTP DANE uses MX hostnames and is a separate RFC 7672 workflow. This generator does not yet build MX-derived SMTP DANE sets.

## Input correctness checks

The app cannot know whether pasted material came from the live server or the exact signed zone. Before publishing:

- Confirm DNSKEY came from the exact child zone being delegated.
- Prefer the KSK/SEP DNSKEY, usually flags `257`, when deriving parent DS.
- Confirm the parent-side DS matches the active child DNSKEY after signing.
- Confirm the pasted certificate or PUBLIC KEY is the exact public key served for the hostname, port, protocol, and SNI name represented by the TLSA owner.
- Confirm the live TLS service presents the intended certificate chain for the selected TLSA usage.

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

Glue is needed when the nameserver is inside the same zone. For `dane/` using `ns1.dane.`, publish `GLUE4` or `GLUE6` in the HNS wallet. If the nameserver is external, such as a provider nameserver, publish `NS` instead.

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

### Does `dig +dnssec` mean validation succeeded?

No. It means DNSSEC-related records were requested and may be present. Use `delv` for ICANN DNS or a DNSSEC-validating recursive resolver and confirm the `ad` flag. For HNS, use an HNS-aware validating resolver.

### Why did a validating resolver return SERVFAIL?

For a signed zone, `SERVFAIL` often means the DNSSEC chain is broken: wrong DS, missing DNSKEY, expired RRSIGs, unsupported algorithms, broken NSEC/NSEC3 denial records, or authoritative reachability problems.

### Do I need one TLSA record for every service?

Yes, for every TLS service you expect DANE-aware clients to authenticate. Apex HTTPS, `www`, mail MX hosts, IMAP, and SRV-based services have different owner names.
