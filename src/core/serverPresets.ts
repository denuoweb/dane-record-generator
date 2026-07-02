import type { BootstrapInput, DnsServerPreset, GeneratedLine } from './types';
import { relativeName, zoneNameWithoutRoot } from './domain';

export interface ServerPresetInput {
  preset: DnsServerPreset;
  domain: string;
  nameserverHost: string;
  nameserverHosts?: string[];
  ttl: number;
  websiteIpv4?: string;
  websiteIpv6?: string;
  tlsaRecord?: string;
  tlsaOwner: string;
}

function tlsaRdata(input: ServerPresetInput): string {
  return input.tlsaRecord?.split(' IN TLSA ')[1] ?? '3 1 1 <spki-sha256>';
}

function tlsaOwnerRelative(input: ServerPresetInput): string {
  return relativeName(input.tlsaOwner, input.domain);
}

function makeZoneFile(input: ServerPresetInput): string {
  const zone = input.domain;
  const zoneNoRoot = zoneNameWithoutRoot(zone);
  const serial = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '01';
  const nameservers = input.nameserverHosts?.length ? input.nameserverHosts : [input.nameserverHost];
  const lines = [
    `$ORIGIN ${zone}`,
    `$TTL ${input.ttl}`,
    `@ ${input.ttl} IN SOA ${input.nameserverHost} hostmaster.${zone} (`,
    `  ${serial} ; serial`,
    '  3600       ; refresh',
    '  900        ; retry',
    '  1209600    ; expire',
    `  ${input.ttl}       ; minimum`,
    ')',
    ...nameservers.map((nameserver) => `@ ${input.ttl} IN NS ${nameserver}`),
    ...(input.websiteIpv4 ? [`@ ${input.ttl} IN A ${input.websiteIpv4}`] : []),
    ...(input.websiteIpv6 ? [`@ ${input.ttl} IN AAAA ${input.websiteIpv6}`] : []),
    `${tlsaOwnerRelative(input)} ${input.ttl} IN TLSA ${tlsaRdata(input)}`,
    '',
    `; Zone name: ${zoneNoRoot}`,
    '; Enable DNSSEC signing in your DNS server, then publish the resulting DS at the parent.'
  ];
  return lines.join('\n');
}

function hostedDnsPreset(input: ServerPresetInput): string {
  const nameservers = input.nameserverHosts?.length ? input.nameserverHosts : [input.nameserverHost];
  return [
    '# Hosted DNS provider panel',
    '# Create or edit the authoritative zone, then add these records.',
    `Zone: ${zoneNameWithoutRoot(input.domain)}`,
    ...nameservers.map((nameserver) => `NS    @                 ${nameserver}`),
    ...(input.websiteIpv4 ? [`A     @                 ${input.websiteIpv4}`] : []),
    ...(input.websiteIpv6 ? [`AAAA  @                 ${input.websiteIpv6}`] : []),
    `TLSA  ${tlsaOwnerRelative(input).padEnd(17)} ${tlsaRdata(input)}`,
    '',
    '# Turn on provider-managed DNSSEC for the zone.',
    '# Copy the provider DNSKEY or DS back into this tool, then publish DS at the parent.'
  ].join('\n');
}

function bindPreset(input: ServerPresetInput): string {
  const zoneNoRoot = zoneNameWithoutRoot(input.domain);
  return [
    '# BIND 9 named.conf.local',
    `zone "${zoneNoRoot}" {`,
    '  type primary;',
    `  file "/etc/bind/zones/db.${zoneNoRoot}";`,
    '  dnssec-policy default;',
    '  inline-signing yes;',
    '};',
    '',
    `# /etc/bind/zones/db.${zoneNoRoot}`,
    makeZoneFile(input),
    '',
    '# After reload, inspect keys/DS with your BIND tooling and paste the DNSKEY/DS into the parent output.'
  ].join('\n');
}

function knotPreset(input: ServerPresetInput): string {
  const zoneNoRoot = zoneNameWithoutRoot(input.domain);
  return [
    '# Knot DNS knot.conf excerpt',
    'policy:',
    '  - id: default',
    '    algorithm: ed25519',
    '',
    'zone:',
    `  - domain: ${input.domain}`,
    `    file: "/var/lib/knot/zones/${zoneNoRoot}.zone"`,
    '    dnssec-signing: on',
    '    dnssec-policy: default',
    '',
    `# /var/lib/knot/zones/${zoneNoRoot}.zone`,
    makeZoneFile(input)
  ].join('\n');
}

function nsdPreset(input: ServerPresetInput): string {
  const zoneNoRoot = zoneNameWithoutRoot(input.domain);
  return [
    '# NSD zone declaration',
    'zone:',
    `  name: "${zoneNoRoot}"`,
    `  zonefile: "${zoneNoRoot}.zone.signed"`,
    '',
    `# Unsigned source zone: ${zoneNoRoot}.zone`,
    makeZoneFile(input),
    '',
    '# Sign the zone outside NSD with your DNSSEC signer, then serve the signed zonefile.'
  ].join('\n');
}

function powerDnsPreset(input: ServerPresetInput): string {
  const zoneNoRoot = zoneNameWithoutRoot(input.domain);
  const nameservers = input.nameserverHosts?.length ? input.nameserverHosts : [input.nameserverHost];
  return [
    '# PowerDNS Authoritative records',
    `Zone: ${zoneNoRoot}`,
    ...nameservers.map((nameserver) => `NS   @                 ${nameserver}`),
    ...(input.websiteIpv4 ? [`A    @                 ${input.websiteIpv4}`] : []),
    ...(input.websiteIpv6 ? [`AAAA @                 ${input.websiteIpv6}`] : []),
    `TLSA ${tlsaOwnerRelative(input).padEnd(17)} ${tlsaRdata(input)}`,
    '',
    '# Then enable DNSSEC for the zone in PowerDNS and publish the resulting DS at the parent.'
  ].join('\n');
}

export function serverPresetLabel(preset: DnsServerPreset): string {
  switch (preset) {
    case 'bind': return 'BIND 9 starter config';
    case 'hosted-dns': return 'Hosted DNS provider checklist';
    case 'knot': return 'Knot DNS starter config';
    case 'nsd': return 'NSD starter config';
    case 'powerdns': return 'PowerDNS Authoritative records';
    default: return 'Generic zone-file records';
  }
}

export function generateServerPreset(input: ServerPresetInput): GeneratedLine[] {
  const zoneText = (() => {
    switch (input.preset) {
      case 'bind': return bindPreset(input);
      case 'hosted-dns': return hostedDnsPreset(input);
      case 'knot': return knotPreset(input);
      case 'nsd': return nsdPreset(input);
      case 'powerdns': return powerDnsPreset(input);
      default: return makeZoneFile(input);
    }
  })();

  return [{
    value: zoneText,
    explanation: 'Server-side starter snippet. Create the zone, publish NS/A/AAAA/TLSA, enable DNSSEC signing, then publish DS at the parent.'
  }];
}

export function recommendedPresetTip(preset: BootstrapInput['dnsServerPreset']): string {
  if (preset === 'hosted-dns') return 'Hosted DNS is the shortest path if your provider supports DNSSEC, DS or DNSKEY export, and TLSA records.';
  if (preset === 'powerdns') return 'PowerDNS is a short path when you want an admin API or database-backed DNS.';
  if (preset === 'knot') return 'Knot DNS is a clean modern authoritative server with simple DNSSEC automation.';
  if (preset === 'bind') return 'BIND 9 is widely documented and package-manager friendly, but its config is more verbose.';
  if (preset === 'nsd') return 'NSD is small and reliable, but DNSSEC signing is usually handled by a separate signing step.';
  return 'Generic zone-file output works with BIND, Knot, NSD, and many DNS hosting import tools.';
}
