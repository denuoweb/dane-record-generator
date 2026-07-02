# Roadmap

## v0.1: deterministic generator

Completed foundation:

- HNS delegated mode
- HNS SYNTH nameserver mode
- ICANN delegated mode
- TLSA 3 1 1 from PEM PUBLIC KEY
- TLSA 3 1 1 from PEM CERTIFICATE
- DS SHA-256 from DNSKEY
- Copyable output boxes
- Help tips

## v0.2: web-admin onboarding

Current scaffold target:

- Basic/advanced UI split
- Setup status checklist
- Copyable quick steps
- Generic zone-file preset
- PowerDNS Authoritative preset
- Knot DNS preset
- BIND 9 preset
- Docker/static deployment files
- Production deployment notes
- Web-admin guide

## v0.3: live validation

- Fetch live certificate and generate TLSA from host:port
- DNSSEC chain check through a validating resolver
- TLSA live comparison
- HNS parent record lookup
- Expiration and TTL warnings

## v0.4: rollover workflows

- Current + next TLSA output
- Certificate key rollover timeline
- DNSKEY / DS rollover timeline
- TTL-safe migration hints
- CDS/CDNSKEY advisory output

## v0.5: integrations

- Namehold embedded component
- HNS browser diagnostics component
- CLI package
- hsd/name resource JSON export
- Namebase/name-resource JSON export
