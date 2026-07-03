# Onboarding interface

## Product framing

The page is a two-output wizard:

1. `Put this in your HNS wallet / registrar`
2. `Put this on your authoritative DNS server`

Everything else supports those two boxes.

## Default layout

### Header

Fields:

- Language selector

Supported UI languages:

- English
- Spanish
- French
- German
- Portuguese
- Japanese

The selected language localizes the app shell and persists in local browser storage. Generated records and command snippets are not translated.

### 1. Domain

Fields:

- Domain type: HNS or ICANN
- Setup mode: delegated authoritative DNS or HNS SYNTH nameserver
- Domain input: placeholder starts as `dane/` for HNS or `example.com` for ICANN; the field is blank until filled.

Help copy:

> Named mode uses a nameserver hostname. SYNTH mode stores nameserver IPs in HNS. Both modes still use authoritative DNS for website and TLSA records.

Internationalized input:

> Unicode domain input is accepted when it can be converted to IDNA ASCII A-labels. Generated records use `xn--...` labels.

### 2. Server

Fields:

- DNS server preset
- Nameserver hostname
- DNS server IP
- Website IP
- Nameserver IPv6 (optional)
- Website IPv6 (optional)

Help copy for HNS delegated mode:

> If your nameserver is inside the same HNS name, such as `ns1.dane.` for `dane/`, your HNS wallet needs GLUE4 or GLUE6 so resolvers can find that nameserver.

Preset choices:

- Hosted DNS provider panel
- Generic zone file
- PowerDNS Authoritative
- Knot DNS
- BIND 9
- NSD

Preset output must remind self-hosting admins that authoritative service still needs UDP/TCP 53 reachability, recursion disabled, firewall access, SOA serial discipline, DNSSEC signature refresh, authenticated denial records, and validation after parent DS publication.

## Compatibility Matrix

| Domain type | Setup mode | Parent-side output | Authoritative DNS output | DNSSEC + DANE support |
| --- | --- | --- | --- | --- |
| HNS | Delegated authoritative DNS | `NS` or `GLUE4`/`GLUE6`, plus `DS` | `NS`, `A`/`AAAA`, `TLSA`, signed zone | Yes |
| HNS | SYNTH nameserver | `SYNTH4`/`SYNTH6`, plus `DS` | Synthetic `NS`, `A`/`AAAA`, `TLSA`, signed zone | Yes |
| ICANN | Delegated authoritative DNS | Registrar nameserver/glue, plus `DS` | `NS`, `A`/`AAAA`, `TLSA`, signed zone | Yes |
| ICANN | SYNTH nameserver | Not applicable | Falls back to delegated authoritative DNS | Not an ICANN mode |

`SYNTH4` and `SYNTH6` are not website address records. They encode authoritative nameserver IPs and produce synthetic `_..._synth.` nameserver names.

### 3. DANE

Fields:

- HTTPS port (defaults to 443 for normal HTTPS)
- Certificate or PUBLIC KEY
- DNSKEY

Help copy:

> Paste the leaf certificate or a PEM PUBLIC KEY. The output uses TLSA 3 1 1.

Field-level help:

- TLSA certificate or PUBLIC KEY includes a `How to get this` disclosure with OpenSSL examples and private-key warnings. The command uses the current website IP or domain, current HTTPS port, and current normalized domain for SNI.
- DNSKEY includes a `How to get this` disclosure that explains when to enable DNSSEC, where hosted DNS panels expose DNSKEY/DS, and how to query DNSKEY with `dig`. The command uses the current nameserver IP or hostname and current normalized zone name.
- The same disclosures appear in `Needs attention` when the relevant field is blank, including HNS SYNTH mode. This prevents a `TLSA Needed` status from appearing without a nearby TLSA input explanation.
- Generated web notes must warn that TLSA `3 1 1` pins the service public key, key rollover needs current + next TLSA records across TTL windows, and DANE is enforced only by clients that validate DNSSEC and check TLSA.

## Verification behavior

Generated verification commands must separate two checks:

1. Direct authoritative checks with `dig @server ... +norecurse`, which prove the DNS server answers.
2. Chain-validation checks with `delv`, AD-bit checks through a validating recursive resolver, or HNS-aware validating resolver checks, which prove DNSSEC validation.

The UI should explain that `dig +dnssec` alone does not prove validation and that `SERVFAIL` from a validating resolver commonly means a parent DS mismatch, missing DNSKEY/RRSIG/NSEC/NSEC3 data, expired signatures, unsupported algorithms, or authoritative reachability problems.

## Output order

1. Setup status
2. Quick steps
3. Parent-side records
4. Authoritative DNS records
5. Server preset
6. Verify commands
7. Web server note
8. Integrator JSON
9. Warnings
10. Help tips

## Copy policy

Every output box should be copyable. The copied text should be plain text and usable in a wallet, registrar panel, DNS zone file, or server notes without UI decoration.

## Tone policy

Use short operational labels:

- Needed
- OK
- Check
- Parent-side
- Authoritative DNS
- Glue
- DS
- TLSA

Avoid long paragraphs on the main path. Put deeper explanations in collapsible blocks.

## FAQ topics

- Which preset should I pick?
- What goes in the wallet or registrar versus the DNS server?
- When should DNSKEY be pasted?
- Can internationalized domain names be used?
- What must a hosted DNS provider support?
- Does the web server need a DANE plugin?
- How do I get the certificate/PUBLIC KEY and DNSKEY inputs?
- Why does `dig +dnssec` not prove validation?
- What does validating-resolver `SERVFAIL` usually mean?
- How should TLSA current + next key rollover work?
- Which clients actually enforce DANE?
- Do other hostnames and services need separate TLSA records?
