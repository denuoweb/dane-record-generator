import type { DomainType, TransportProtocol } from './types';

const HOST_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const BASE32HEX = '0123456789abcdefghijklmnopqrstuv';

function stripProtocolAndPath(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^hns:\/\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/:+\d+$/, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function toAsciiHostname(input: string): string {
  try {
    return new URL(`http://${input}/`).hostname;
  } catch {
    return input;
  }
}

export function normalizeDomain(input: string, domainType: DomainType): string {
  let domain = stripProtocolAndPath(input);
  if (!domain) throw new Error('Domain is required.');

  if (domainType === 'hns') {
    domain = domain.replace(/\/$/, '');
    if (!domain.includes('.') && !domain.endsWith('.')) return `${toAsciiHostname(domain)}.`;
  }

  domain = toAsciiHostname(domain);
  return domain.endsWith('.') ? domain : `${domain}.`;
}

export function displayDomain(input: string, domainType: DomainType): string {
  const normalized = normalizeDomain(input, domainType);
  if (domainType === 'hns' && normalized.split('.').filter(Boolean).length === 1) {
    return `${normalized.slice(0, -1)}/`;
  }
  return normalized;
}

export function zoneNameWithoutRoot(domain: string): string {
  return domain.endsWith('.') ? domain.slice(0, -1) : domain;
}

export function normalizeHostname(input: string): string {
  const trimmed = toAsciiHostname(stripProtocolAndPath(input));
  if (!trimmed) throw new Error('Hostname is required.');
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

export function isInBailiwick(hostname: string, zone: string): boolean {
  const host = normalizeHostname(hostname);
  const normalizedZone = zone.endsWith('.') ? zone : `${zone}.`;
  return host === normalizedZone || host.endsWith(`.${normalizedZone}`);
}

export function tlsaOwnerName(domain: string, port: number, protocol: TransportProtocol): string {
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Port must be an integer between 1 and 65535.');
  }
  const cleanProtocol = protocol.toLowerCase().replace(/^_/, '') as TransportProtocol;
  if (!['tcp', 'udp', 'sctp'].includes(cleanProtocol)) {
    throw new Error('Protocol must be tcp, udp, or sctp.');
  }
  return `_${port}._${cleanProtocol}.${domain}`;
}

export function relativeName(ownerName: string, zone: string): string {
  const owner = ownerName.endsWith('.') ? ownerName : `${ownerName}.`;
  const normalizedZone = zone.endsWith('.') ? zone : `${zone}.`;
  if (owner === normalizedZone) return '@';
  if (owner.endsWith(`.${normalizedZone}`)) return owner.slice(0, -normalizedZone.length - 1);
  return owner;
}

function bytesToBase32Hex(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32HEX[(value >> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32HEX[(value << (5 - bits)) & 31];
  return output;
}

function ipv4Bytes(value: string): Uint8Array | null {
  if (!validateIpv4(value)) return null;
  return new Uint8Array(value.trim().split('.').map((part) => Number(part)));
}

function ipv6Bytes(value: string): Uint8Array | null {
  if (!validateIpv6(value)) return null;
  const input = value.trim().toLowerCase();
  const [headText, tailText] = input.split('::');
  const head = headText ? headText.split(':') : [];
  const tail = tailText ? tailText.split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  const groups = [...head, ...Array.from({ length: missing }, () => '0'), ...tail];
  if (groups.length !== 8) return null;
  const bytes = new Uint8Array(16);
  for (let index = 0; index < groups.length; index += 1) {
    const group = Number.parseInt(groups[index], 16);
    if (!Number.isInteger(group) || group < 0 || group > 0xffff) return null;
    bytes[index * 2] = (group >> 8) & 0xff;
    bytes[index * 2 + 1] = group & 0xff;
  }
  return bytes;
}

export function synthNameserverName(address: string): string {
  const bytes = ipv4Bytes(address) ?? ipv6Bytes(address);
  if (!bytes) throw new Error('SYNTH nameserver address must be valid IPv4 or IPv6.');
  return `_${bytesToBase32Hex(bytes)}._synth.`;
}

export function validateIpv4(value: string): boolean {
  const parts = value.trim().split('.');
  return parts.length === 4 && parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

export function validateIpv6(value: string): boolean {
  const v = value.trim();
  if (!v || v.includes('%')) return false;
  try {
    const url = new URL(`http://[${v}]/`);
    return url.hostname.startsWith('[') && url.hostname.endsWith(']');
  } catch {
    return false;
  }
}

export function validateHostname(value: string): boolean {
  let host: string;
  try {
    host = normalizeHostname(value);
  } catch {
    return false;
  }
  if (host.length > 253) return false;
  const labels = host.slice(0, -1).split('.');
  return labels.length > 0 && labels.every((label) => HOST_LABEL_RE.test(label));
}

export function validateDomainName(value: string): boolean {
  return validateHostname(value);
}

export function validateTtl(value: number): boolean {
  return Number.isInteger(value) && value >= 60 && value <= 86400;
}

export function validateMaybeIpv4(value?: string): boolean {
  return !value?.trim() || validateIpv4(value);
}

export function validateMaybeIpv6(value?: string): boolean {
  return !value?.trim() || validateIpv6(value);
}

export function ensureTrailingDot(value: string): string {
  return value.endsWith('.') ? value : `${value}.`;
}
