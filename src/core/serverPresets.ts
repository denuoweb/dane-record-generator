import type { BootstrapInput, DnsServerPreset, GeneratedLine } from './types';
import { relativeName, zoneNameWithoutRoot } from './domain';

export const DNS_SERVER_PRESETS: DnsServerPreset[] = ['generic-zone', 'hosted-dns', 'bind', 'windows-server', 'powerdns', 'knot', 'nsd'];

export interface ServerPresetInput {
  preset: DnsServerPreset;
  domain: string;
  nameserverHost: string;
  nameserverHosts?: string[];
  nameserverIpv4?: string;
  nameserverIpv6?: string;
  ttl: number;
  websiteIpv4?: string;
  websiteIpv6?: string;
  tlsaRecord?: string;
  tlsaOwner: string;
}

interface NameserverAddressRecord {
  name: string;
  type: 'A' | 'AAAA';
  address: string;
}

function tlsaRdata(input: ServerPresetInput): string {
  return input.tlsaRecord?.split(' IN TLSA ')[1] ?? '3 1 1 <spki-sha256>';
}

function tlsaOwnerRelative(input: ServerPresetInput): string {
  return relativeName(input.tlsaOwner, input.domain);
}

function inZoneNameserverAddressRecordParts(input: ServerPresetInput): NameserverAddressRecord[] {
  const nameservers = input.nameserverHosts?.length ? input.nameserverHosts : [input.nameserverHost];
  return nameservers.flatMap((nameserver) => {
    const name = relativeName(nameserver, input.domain);
    if (name === '@' || name.endsWith('.')) return [];
    return [
      ...(input.nameserverIpv4 ? [{ name, type: 'A' as const, address: input.nameserverIpv4 }] : []),
      ...(input.nameserverIpv6 ? [{ name, type: 'AAAA' as const, address: input.nameserverIpv6 }] : [])
    ];
  });
}

function inZoneNameserverAddressRecords(input: ServerPresetInput, prefix = ''): string[] {
  return inZoneNameserverAddressRecordParts(input).map(({ name, type, address }) => `${prefix}${name} ${input.ttl} IN ${type} ${address}`);
}

function windowsTtl(input: ServerPresetInput): string {
  return `(New-TimeSpan -Seconds ${input.ttl})`;
}

function operationalChecklist(prefix: '#' | ';' = '#'): string[] {
  return [
    `${prefix} Authoritative nameserver operational checks:`,
    `${prefix} - Listen publicly on both UDP/53 and TCP/53.`,
    `${prefix} - Disable recursion on the authoritative service; do not run an open resolver.`,
    `${prefix} - Allow DNS through host firewalls, network firewalls, and provider security groups.`,
    `${prefix} - Increment the SOA serial for every unsigned-source zone change.`,
    `${prefix} - Prefer at least two authoritative nameservers on separate hosts or networks.`,
    `${prefix} - Keep DNSSEC signatures fresh and publish authenticated denial records (NSEC/NSEC3).`,
    `${prefix} - Validate through a DNSSEC-validating resolver after publishing the parent DS.`
  ];
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
    ...inZoneNameserverAddressRecords(input),
    ...(input.websiteIpv4 ? [`@ ${input.ttl} IN A ${input.websiteIpv4}`] : []),
    ...(input.websiteIpv6 ? [`@ ${input.ttl} IN AAAA ${input.websiteIpv6}`] : []),
    `${tlsaOwnerRelative(input)} ${input.ttl} IN TLSA ${tlsaRdata(input)}`,
    '',
    `; Zone name: ${zoneNoRoot}`,
    '; Enable DNSSEC signing in your DNS server, then publish the resulting DS at the parent.',
    ...operationalChecklist(';')
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
    ...inZoneNameserverAddressRecordParts(input).map(({ name, type, address }) => {
      return `${type.padEnd(5)} ${name.padEnd(17)} ${address}`;
    }),
    ...(input.websiteIpv4 ? [`A     @                 ${input.websiteIpv4}`] : []),
    ...(input.websiteIpv6 ? [`AAAA  @                 ${input.websiteIpv6}`] : []),
    `TLSA  ${tlsaOwnerRelative(input).padEnd(17)} ${tlsaRdata(input)}`,
    '',
    '# Turn on provider-managed DNSSEC for the zone.',
    '# Copy the provider DNSKEY or DS back into this tool, then publish DS at the parent.',
    '# Confirm the provider signs TLSA records, serves NSEC/NSEC3 denial records, refreshes RRSIGs, and supports DNSSEC validation checks.'
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
    '# For an authoritative-only BIND service, keep recursion disabled in global options.',
    '# Example global intent: recursion no; allow-recursion { none; };',
    '',
    `# /etc/bind/zones/db.${zoneNoRoot}`,
    makeZoneFile(input),
    '',
    '# After reload, inspect keys/DS with your BIND tooling and paste the DNSKEY/DS into the parent output.'
  ].join('\n');
}

function windowsTlsaRecord(input: ServerPresetInput): string[] {
  const [usage = '3', selector = '1', matchingType = '1', associationData = '<spki-sha256>'] = tlsaRdata(input).split(/\s+/);
  const usageMap: Record<string, string> = {
    '0': 'CAConstraint',
    '1': 'ServiceCertificateConstraint',
    '2': 'TrustAnchorAssertion',
    '3': 'DomainIssuedCertificate'
  };
  const selectorMap: Record<string, string> = {
    '0': 'FullCertificate',
    '1': 'SubjectPublicKeyInfo'
  };
  const matchingTypeMap: Record<string, string> = {
    '0': 'ExactMatch',
    '1': 'Sha256Hash',
    '2': 'Sha512Hash'
  };

  return [
    `Add-DnsServerResourceRecord -TLSA -ZoneName "${zoneNameWithoutRoot(input.domain)}" -Name "${tlsaOwnerRelative(input)}" -CertificateUsage ${usageMap[usage] ?? 'DomainIssuedCertificate'} -Selector ${selectorMap[selector] ?? 'SubjectPublicKeyInfo'} -MatchingType ${matchingTypeMap[matchingType] ?? 'Sha256Hash'} -CertificateAssociationData "${associationData}" -TimeToLive ${windowsTtl(input)}`
  ];
}

function windowsServerPreset(input: ServerPresetInput): string {
  const zoneNoRoot = zoneNameWithoutRoot(input.domain);
  const nameservers = input.nameserverHosts?.length ? input.nameserverHosts : [input.nameserverHost];

  return [
    '# Windows Server DNS PowerShell quick start',
    '# Run in an elevated PowerShell session on the authoritative DNS server.',
    'Install-WindowsFeature DNS -IncludeManagementTools',
    'Set-DnsServerRecursion -Enable $false',
    'New-NetFirewallRule -DisplayName "DNS UDP 53" -Direction Inbound -Protocol UDP -LocalPort 53 -Action Allow',
    'New-NetFirewallRule -DisplayName "DNS TCP 53" -Direction Inbound -Protocol TCP -LocalPort 53 -Action Allow',
    `Add-DnsServerPrimaryZone -Name "${zoneNoRoot}" -ZoneFile "${zoneNoRoot}.dns"`,
    '',
    '# Authoritative zone records',
    ...nameservers.map((nameserver) => `Add-DnsServerResourceRecord -NS -ZoneName "${zoneNoRoot}" -Name "." -NameServer "${nameserver}" -TimeToLive ${windowsTtl(input)}`),
    ...inZoneNameserverAddressRecordParts(input).map(({ name, type, address }) => {
      const cmdlet = type === 'AAAA' ? 'Add-DnsServerResourceRecordAAAA' : 'Add-DnsServerResourceRecordA';
      const addressParam = type === 'AAAA' ? 'IPv6Address' : 'IPv4Address';
      return `${cmdlet} -ZoneName "${zoneNoRoot}" -Name "${name}" -${addressParam} "${address}" -TimeToLive ${windowsTtl(input)}`;
    }),
    ...(input.websiteIpv4 ? [`Add-DnsServerResourceRecordA -ZoneName "${zoneNoRoot}" -Name "." -IPv4Address "${input.websiteIpv4}" -TimeToLive ${windowsTtl(input)}`] : []),
    ...(input.websiteIpv6 ? [`Add-DnsServerResourceRecordAAAA -ZoneName "${zoneNoRoot}" -Name "." -IPv6Address "${input.websiteIpv6}" -TimeToLive ${windowsTtl(input)}`] : []),
    ...windowsTlsaRecord(input),
    '',
    '# If the delegated nameserver hostname is inside this zone, add its A/AAAA address too.',
    '# Example: Add-DnsServerResourceRecordA -ZoneName "' + zoneNoRoot + '" -Name "ns1" -IPv4Address "<nameserver-ipv4>" -TimeToLive ' + windowsTtl(input),
    '# HNS SYNTH mode does not need ns1 glue; the HNS parent stores the nameserver IP as SYNTH4/SYNTH6.',
    '',
    '# Sign the zone for DNSSEC, then publish the resulting DS at the HNS wallet or registrar.',
    `Invoke-DnsServerZoneSign -ZoneName "${zoneNoRoot}" -SignWithDefault -PassThru -Verbose`,
    `Get-DnsServerResourceRecord -ZoneName "${zoneNoRoot}" -RRType DNSKEY`,
    `Get-DnsServerResourceRecord -ZoneName "${zoneNoRoot}" -RRType DS`,
    '',
    '# Verify from outside the server:',
    `# dig @<windows-dns-server-ip> ${input.domain} SOA +dnssec +norecurse`,
    `# dig @<windows-dns-server-ip> ${input.tlsaOwner} TLSA +dnssec +norecurse`
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
    '# Sign the zone outside NSD with your DNSSEC signer, then serve the signed zonefile.',
    '# Re-sign before RRSIG expiration and update the served signed zone after each source-zone change.'
  ].join('\n');
}

function powerDnsPreset(input: ServerPresetInput): string {
  const zoneNoRoot = zoneNameWithoutRoot(input.domain);
  const nameservers = input.nameserverHosts?.length ? input.nameserverHosts : [input.nameserverHost];
  return [
    '# PowerDNS Authoritative records',
    `Zone: ${zoneNoRoot}`,
    ...nameservers.map((nameserver) => `NS   @                 ${nameserver}`),
    ...inZoneNameserverAddressRecordParts(input).map(({ name, type, address }) => {
      return `${type.padEnd(4)} ${name.padEnd(17)} ${address}`;
    }),
    ...(input.websiteIpv4 ? [`A    @                 ${input.websiteIpv4}`] : []),
    ...(input.websiteIpv6 ? [`AAAA @                 ${input.websiteIpv6}`] : []),
    `TLSA ${tlsaOwnerRelative(input).padEnd(17)} ${tlsaRdata(input)}`,
    '',
    '# Then enable DNSSEC for the zone in PowerDNS and publish the resulting DS at the parent.',
    '# Keep authoritative service separate from recursion, validate after DS publication, and monitor RRSIG freshness.',
    ...operationalChecklist('#')
  ].join('\n');
}

export function serverPresetLabel(preset: DnsServerPreset): string {
  switch (preset) {
    case 'bind': return 'BIND 9 starter config';
    case 'hosted-dns': return 'Hosted DNS provider checklist';
    case 'knot': return 'Knot DNS starter config';
    case 'nsd': return 'NSD starter config';
    case 'powerdns': return 'PowerDNS Authoritative records';
    case 'windows-server': return 'Windows Server DNS PowerShell';
    default: return 'Generic zone-file records';
  }
}

export function serverPresetTabLabel(preset: DnsServerPreset): string {
  switch (preset) {
    case 'bind': return 'BIND 9';
    case 'hosted-dns': return 'Hosted DNS';
    case 'knot': return 'Knot';
    case 'nsd': return 'NSD';
    case 'powerdns': return 'PowerDNS';
    case 'windows-server': return 'Windows Server';
    default: return 'Zone file';
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
      case 'windows-server': return windowsServerPreset(input);
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
  if (preset === 'windows-server') return 'Windows Server DNS can host and sign the authoritative zone with DNS Manager or PowerShell.';
  if (preset === 'nsd') return 'NSD is small and reliable, but DNSSEC signing is usually handled by a separate signing step.';
  return 'Generic zone-file output works with BIND, Knot, NSD, and many DNS hosting import tools.';
}
