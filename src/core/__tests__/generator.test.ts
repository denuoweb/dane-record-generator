import { describe, expect, it } from 'vitest';
import { generateBootstrap } from '../bootstrap';
import { normalizeDomain, normalizeHostname, isInBailiwick, synthNameserverName, tlsaOwnerName, validateIpv6 } from '../domain';
import { parseDnskey, dnskeyKeyTag, canonicalNameWire } from '../dnssec';
import { extractSpkiFromPem, generateTlsaRecord } from '../tlsa';

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7Z2aT5FJk4M3UgR6pW/8T4zQIErB
4dTvQ7x/0f9uGVLEh4wmc6Vh+mbXoN3b9nQ7bYrYdK6bskh9lT3mf7m/7Q==
-----END PUBLIC KEY-----`;

describe('domain normalization', () => {
  it('normalizes HNS slash notation', () => {
    expect(normalizeDomain('example/', 'hns')).toBe('example.');
  });

  it('normalizes ICANN domains', () => {
    expect(normalizeDomain('Example.COM', 'icann')).toBe('example.com.');
  });

  it('normalizes IDNA input to DNS ASCII labels', () => {
    expect(normalizeDomain('bücher.example', 'icann')).toBe('xn--bcher-kva.example.');
    expect(normalizeHostname('ns1.bücher.example')).toBe('ns1.xn--bcher-kva.example.');
  });

  it('detects in-bailiwick nameservers', () => {
    expect(isInBailiwick('ns1.example.', 'example.')).toBe(true);
    expect(isInBailiwick('ns1.provider.net.', 'example.')).toBe(false);
  });

  it('builds TLSA owner names', () => {
    expect(tlsaOwnerName('example.', 443, 'tcp')).toBe('_443._tcp.example.');
  });

  it('rejects malformed IPv6', () => {
    expect(validateIpv6('2001:db8::1')).toBe(true);
    expect(validateIpv6(':::')).toBe(false);
  });

  it('encodes HNS SYNTH nameserver names from IP addresses', () => {
    expect(synthNameserverName('45.77.219.32')).toBe('_5l6tm80._synth.');
    expect(synthNameserverName('203.0.113.10')).toBe('_pc0722g._synth.');
  });

  it('exposes verification commands and integrator JSON for delegated HNS', async () => {
    const result = await generateBootstrap({
      domainType: 'hns',
      setupMode: 'delegated',
      domainInput: 'example/',
      nameserverHost: 'ns1.example.',
      nameserverIpv4: '203.0.113.10',
      websiteIpv4: '203.0.113.20',
      port: 443,
      protocol: 'tcp',
      pemInput: PUBLIC_KEY
    });

    expect(result.verificationCommands[0].value).toContain('dig @203.0.113.10 example. SOA');
    expect(result.integrationRecords[0].value).toContain('hns-parent-record-draft');
    expect(result.sections.some((section) => section.id === 'integrator')).toBe(true);
  });

  it('handles parenthesized multiline DNSKEY input', () => {
    const dnskey = parseDnskey(`example. 3600 IN DNSKEY (
      257 3 13 AAAA
    ) ; comment`);
    expect(dnskey.flags).toBe(257);
    expect(dnskey.algorithm).toBe(13);
  });
});

describe('TLSA generation', () => {
  it('extracts SPKI from PUBLIC KEY PEM', () => {
    const spki = extractSpkiFromPem(PUBLIC_KEY);
    expect(spki.length).toBeGreaterThan(32);
  });

  it('generates TLSA 3 1 1 from SPKI', async () => {
    const record = await generateTlsaRecord({
      pemInput: PUBLIC_KEY,
      ownerName: '_443._tcp.example.',
      ttl: 3600
    });
    expect(record).toMatch(/^_443\._tcp\.example\. 3600 IN TLSA 3 1 1 [0-9A-F]{64}$/);
  });
});

describe('DNSSEC helpers', () => {
  it('parses DNSKEY rdata and computes a key tag shape', () => {
    const dnskey = parseDnskey('257 3 13 AAAA');
    expect(dnskey.flags).toBe(257);
    expect(dnskey.protocol).toBe(3);
    expect(dnskey.algorithm).toBe(13);
    expect(dnskeyKeyTag(dnskey.rdata)).toBeGreaterThanOrEqual(0);
  });

  it('parses DNSKEY with owner, ttl, class, and comments', () => {
    const dnskey = parseDnskey('example. 3600 IN DNSKEY 257 3 13 AAAA ; ksk');
    expect(dnskey.flags).toBe(257);
    expect(dnskey.publicKeyBase64).toBe('AAAA');
  });

  it('encodes canonical owner name wire format', () => {
    const wire = canonicalNameWire('example.');
    expect(Array.from(wire)).toEqual([7, 101, 120, 97, 109, 112, 108, 101, 0]);
  });
});

describe('bootstrap generator', () => {
  it('generates HNS delegated wallet and authoritative outputs', async () => {
    const result = await generateBootstrap({
      domainType: 'hns',
      setupMode: 'delegated',
      domainInput: 'example/',
      nameserverHost: 'ns1.example.',
      nameserverIpv4: '203.0.113.10',
      websiteIpv4: '203.0.113.20',
      port: 443,
      protocol: 'tcp',
      pemInput: PUBLIC_KEY
    });

    expect(result.parentRecords.some((line) => line.value.startsWith('GLUE4 ns1.example.'))).toBe(true);
    expect(result.authoritativeRecords.some((line) => line.value.includes(' IN A 203.0.113.20'))).toBe(true);
    expect(result.authoritativeRecords.some((line) => line.value.includes(' IN TLSA 3 1 1 '))).toBe(true);
    expect(result.quickSteps.length).toBeGreaterThan(3);
  });

  it('generates HNS SYNTH nameserver outputs', async () => {
    const result = await generateBootstrap({
      domainType: 'hns',
      setupMode: 'hns-inline',
      domainInput: 'example/',
      nameserverIpv4: '203.0.113.10',
      websiteIpv4: '203.0.113.20',
      port: 443,
      protocol: 'tcp',
      pemInput: PUBLIC_KEY
    });

    expect(result.parentRecords.map((line) => line.value)).toContain('SYNTH4 203.0.113.10');
    expect(result.authoritativeRecords.some((line) => line.value === 'example. 3600 IN NS _pc0722g._synth.')).toBe(true);
    expect(result.authoritativeRecords.some((line) => line.value === 'example. 3600 IN A 203.0.113.20')).toBe(true);
    expect(result.authoritativeRecords.some((line) => line.value.includes(' IN TLSA 3 1 1 '))).toBe(true);
    expect(result.serverPresetRecords.length).toBeGreaterThan(0);
    expect(result.statusChecks.find((item) => item.label === 'Nameserver')?.status).toBe('ok');
    expect(result.statusChecks.find((item) => item.label === 'DS')?.status).toBe('missing');
  });

  it('generates ICANN registrar language', async () => {
    const result = await generateBootstrap({
      domainType: 'icann',
      setupMode: 'delegated',
      domainInput: 'example.com',
      nameserverHost: 'ns1.example.com.',
      nameserverIpv4: '203.0.113.10',
      websiteIpv4: '203.0.113.20',
      port: 443,
      protocol: 'tcp',
      pemInput: PUBLIC_KEY
    });

    expect(result.parentTitle).toContain('registrar');
    expect(result.parentRecords.some((line) => line.value === 'Nameserver: ns1.example.com.')).toBe(true);
    expect(result.parentRecords.some((line) => line.value === 'Glue IPv4: 203.0.113.10')).toBe(true);
  });

  it('generates a BIND starter config', async () => {
    const result = await generateBootstrap({
      domainType: 'hns',
      setupMode: 'delegated',
      domainInput: 'example/',
      nameserverHost: 'ns1.example.',
      nameserverIpv4: '203.0.113.10',
      websiteIpv4: '203.0.113.20',
      port: 443,
      protocol: 'tcp',
      pemInput: PUBLIC_KEY,
      dnsServerPreset: 'bind'
    });

    expect(result.serverPresetTitle).toBe('BIND 9 starter config');
    expect(result.serverPresetRecords[0].value).toContain('named.conf.local');
    expect(result.serverPresetRecords[0].value).toContain('$ORIGIN example.');
  });

  it('generates a hosted DNS provider checklist', async () => {
    const result = await generateBootstrap({
      domainType: 'icann',
      setupMode: 'delegated',
      domainInput: 'bücher.example',
      nameserverHost: 'ns1.provider.example.',
      websiteIpv4: '203.0.113.20',
      port: 443,
      protocol: 'tcp',
      pemInput: PUBLIC_KEY,
      dnsServerPreset: 'hosted-dns'
    });

    expect(result.normalizedDomain).toBe('xn--bcher-kva.example.');
    expect(result.serverPresetTitle).toBe('Hosted DNS provider checklist');
    expect(result.serverPresetRecords[0].value).toContain('Hosted DNS provider panel');
    expect(result.notices.some((item) => item.message.includes('Internationalized domain input'))).toBe(true);
  });

  it('reports missing DS and TLSA status when inputs are omitted', async () => {
    const result = await generateBootstrap({
      domainType: 'hns',
      setupMode: 'delegated',
      domainInput: 'example/',
      nameserverHost: 'ns1.example.',
      nameserverIpv4: '203.0.113.10',
      websiteIpv4: '203.0.113.20',
      port: 443,
      protocol: 'tcp'
    });

    expect(result.statusChecks.find((item) => item.label === 'DS')?.status).toBe('missing');
    expect(result.statusChecks.find((item) => item.label === 'TLSA')?.status).toBe('missing');
  });
});
