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
- Generated web notes must warn that TLSA `3 1 1` pins the service public key, key rollover needs current + next TLSA records across TTL windows, and DANE is enforced only by clients that validate DNSSEC and check TLSA.

## Field Validation

Validation is shown on the input fields instead of a separate attention card:

- Green fields are valid or already usable.
- Yellow fields are required for the current domain type and setup mode but have not been touched yet.
- Red fields are malformed, or required and still blank after user interaction.
- Optional blank fields stay neutral.
- In delegated mode, Nameserver IPv4/IPv6 is required until the nameserver is known to be external. In-zone delegated nameservers need glue; external delegated nameservers do not.

## Verification behavior

Generated verification commands must separate two checks:

1. Direct authoritative checks with `dig @server ... +norecurse`, which prove the DNS server answers.
2. Chain-validation checks with `delv`, AD-bit checks through a validating recursive resolver, or HNS-aware validating resolver checks, which prove DNSSEC validation.

The UI should explain that `dig +dnssec` alone does not prove validation and that `SERVFAIL` from a validating resolver commonly means a parent DS mismatch, missing DNSKEY/RRSIG/NSEC/NSEC3 data, expired signatures, unsupported algorithms, or authoritative reachability problems.

## Output order

1. Setup summary
2. Setup status
3. Parent-side records
4. Authoritative DNS records with server preset tabs
5. Verify commands
6. Web server note
7. Integrator JSON

## Copy policy

Every output box should be copyable. The copied text should be plain text and usable in a wallet, registrar panel, DNS zone file, or server notes without UI decoration.

Output cards default to collapsed. The heading row expands or collapses the card content, and the Copy action remains available while collapsed.

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

## Field-Level Hint Topics

- Domain type: what goes in the wallet or registrar versus the DNS server.
- Setup mode: delegated nameserver mode versus HNS `SYNTH`.
- Domain: HNS slash form, ICANN DNS names, and IDNA handling.
- DNS server preset: hosted DNS, generic zone file, and server-specific examples.
- Nameserver IPv4: nameserver address use for `SYNTH4` and parent-side `GLUE4`.
- Website IPv4: website `A` records versus nameserver `SYNTH`/glue.
- DANE certificate/PUBLIC KEY: how to fetch or extract the TLSA source material.
- DNSKEY: when to paste DNSKEY and how to query it after DNSSEC signing.
