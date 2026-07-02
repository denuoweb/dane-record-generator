# DANE Record Generator

A focused web app for producing the few records a domain owner needs to connect an HNS or ICANN domain to authoritative DNS, DNSSEC, and DANE/TLSA.

The app keeps the workflow simple:

1. Enter domain, nameserver, server IP, and certificate/public key.
2. Send generated records to the HNS wallet or ICANN registrar.
3. Copy zone records onto the authoritative DNS server.
4. Enable DNSSEC on the zone and publish the DS at the parent.
5. Verify with the generated `dig`/`delv` commands.

## Main outputs

- **Do these steps**: short ordered setup path.
- **HNS wallet / registrar**: NS, GLUE, DS, SYNTH records as appropriate.
- **Authoritative DNS server**: NS, A, AAAA, and TLSA records.
- **Server preset**: compact starter config for hosted DNS panels, Generic zone file, PowerDNS, Knot, BIND, or NSD.
- **Verify commands**: `dig`/`delv` checks.
- **Integrator JSON**: optional machine-readable output for wallets and future APIs.

## Supported modes

### HNS delegated DNS mode

Full DNSSEC + DANE path for a Handshake name:

```zone
# HNS wallet / name resource
GLUE4 ns1.example. 203.0.113.10
DS 12345 13 2 7A1B...F09C

# Authoritative DNS server
example. 3600 IN NS ns1.example.
example. 3600 IN A 203.0.113.20
_443._tcp.example. 3600 IN TLSA 3 1 1 9B2C...A811
```

### HNS inline IP mode

Simplest HNS-to-IP pointer:

```zone
SYNTH4 203.0.113.20
```

Use delegated mode for DNSSEC and DANE.

### ICANN delegated DNSSEC mode

Normal registrar + DNSSEC setup:

```text
# Registrar / parent-zone panel
Nameserver: ns1.example.com.
Glue IPv4: 203.0.113.10
DS: 12345 13 2 7A1B...F09C

# Authoritative DNS server
example.com. 3600 IN NS ns1.example.com.
example.com. 3600 IN A 203.0.113.20
_443._tcp.example.com. 3600 IN TLSA 3 1 1 9B2C...A811
```

## TLSA behavior

Default TLSA output:

```zone
TLSA 3 1 1 <sha256-of-spki>
```

Input accepted:

- PEM `PUBLIC KEY`
- PEM `CERTIFICATE`

Private keys are not needed. The app extracts or accepts SubjectPublicKeyInfo and hashes it locally in the browser.

## DNSSEC behavior

Paste the zone DNSKEY after the authoritative DNS server signs the zone. The app computes DS digest type 2 by default:

```zone
DS <keytag> <algorithm> 2 <sha256-digest>
```

The app does not sign zones and does not store private keys. DNSSEC signing remains the DNS server’s job.

## Internationalized domain names

Unicode domain input is accepted when the browser can convert it through IDNA processing. Generated DNS, wallet, registrar, server, and verification output uses ASCII A-labels such as `xn--bcher-kva.example.`.

The app shell includes English, Spanish, French, German, Portuguese, and Japanese UI localization. The language selector translates the interface; generated records and command snippets are unchanged.

See [Internationalization standards](docs/I18N_STANDARDS.md) for the UI localization policy plus IDNA, Punycode, UTS #46, and future email internationalization references.

## New web-admin FAQ

### Which preset should I start with?

Use **Hosted DNS provider panel** if your provider supports DNSSEC signing, DS or DNSKEY export, and custom TLSA records. Use **Generic zone file** when adapting records into another authoritative server. Use **PowerDNS** when you want API/database-backed DNS.

### What goes in the wallet or registrar?

Only parent-side delegation material: nameserver, glue when needed, and DS. TLSA goes on the authoritative DNS server, not in the wallet or registrar.

### When do I paste DNSKEY?

After the authoritative zone is signed. Paste the public DNSKEY into this app to generate the DS record for the parent.

### Does the web server need a DANE plugin?

No. Nginx, Apache, and Caddy serve the normal certificate and private key. DANE-aware clients verify TLSA through DNSSEC.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

Static output goes to `dist/`.

Docker:

```bash
docker build -t hns-dane-bootstrap-generator .
docker run --rm -p 8080:80 hns-dane-bootstrap-generator
```

## Core library

```ts
import { generateBootstrap } from './core/bootstrap';

const result = await generateBootstrap({
  domainType: 'hns',
  setupMode: 'delegated',
  domainInput: 'example/',
  nameserverHost: 'ns1.example.',
  nameserverIpv4: '203.0.113.10',
  websiteIpv4: '203.0.113.20',
  port: 443,
  protocol: 'tcp',
  pemInput: '-----BEGIN PUBLIC KEY-----...',
  dnsServerPreset: 'generic-zone'
});
```

## Design rules

- **DRY**: one generator core feeds the UI, docs examples, tests, and integrator JSON.
- **KISS**: no wallet broadcasting, registrar automation, DNS hosting panel, or live resolver dependency.
- **SOLID**: domain normalization, DNSSEC, TLSA, server presets, and UI rendering are separate modules.

## Standards anchors

- DNSSEC: RFC 4034, RFC 4509.
- DANE/TLSA: RFC 6698, RFC 7671.
- DNSSEC algorithm guidance: RFC 8624, RFC 9905.
- IDNA/i18n: RFC 5890-5894, RFC 3492, Unicode UTS #46.
- Future email i18n scope: RFC 6530-6533.
- Handshake resources: HNS `NS`, `DS`, `GLUE4`, `GLUE6`, `SYNTH4`, `SYNTH6`.

## Donation

Donation: [hs1q5997733eq7f4yyk2vq2z8gz3yqyvpz422ypggh](handshake:hs1q5997733eq7f4yyk2vq2z8gz3yqyvpz422ypggh)
