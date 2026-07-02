import type { DsRecord, ParsedDnskey } from './types';
import { base64ToBytes, concatBytes, digestHex } from './crypto';

function tokenizeDnskey(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.replace(/;.*/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/[()]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

export function parseDnskey(input: string): ParsedDnskey {
  const tokens = tokenizeDnskey(input);
  if (tokens.length === 0) throw new Error('DNSKEY input is empty.');

  const dnskeyIndex = tokens.findIndex((token) => token.toUpperCase() === 'DNSKEY');
  const fields = dnskeyIndex >= 0 ? tokens.slice(dnskeyIndex + 1) : tokens;
  if (fields.length < 4) {
    throw new Error('DNSKEY input must contain flags, protocol, algorithm, and public key.');
  }

  const flags = Number(fields[0]);
  const protocol = Number(fields[1]);
  const algorithm = Number(fields[2]);
  const publicKeyBase64 = fields.slice(3).join('');

  if (!Number.isInteger(flags) || flags < 0 || flags > 65535) throw new Error('Invalid DNSKEY flags.');
  if (!Number.isInteger(protocol) || protocol < 0 || protocol > 255) throw new Error('Invalid DNSKEY protocol.');
  if (!Number.isInteger(algorithm) || algorithm < 0 || algorithm > 255) throw new Error('Invalid DNSKEY algorithm.');
  if (!/^[A-Za-z0-9+/=]+$/.test(publicKeyBase64)) throw new Error('DNSKEY public key is not valid base64 text.');

  const publicKey = base64ToBytes(publicKeyBase64);
  if (publicKey.length === 0) throw new Error('DNSKEY public key is empty.');

  const rdata = new Uint8Array(4 + publicKey.length);
  rdata[0] = (flags >> 8) & 0xff;
  rdata[1] = flags & 0xff;
  rdata[2] = protocol & 0xff;
  rdata[3] = algorithm & 0xff;
  rdata.set(publicKey, 4);

  return { flags, protocol, algorithm, publicKeyBase64, rdata };
}

export function dnskeyKeyTag(rdata: Uint8Array): number {
  let ac = 0;
  for (let i = 0; i < rdata.length; i += 1) {
    ac += i & 1 ? rdata[i] : rdata[i] << 8;
  }
  ac += (ac >> 16) & 0xffff;
  return ac & 0xffff;
}

export function canonicalNameWire(name: string): Uint8Array {
  const fqdn = name.endsWith('.') ? name.toLowerCase() : `${name.toLowerCase()}.`;
  const labels = fqdn.split('.');
  const bytes: number[] = [];
  for (const label of labels) {
    if (label.length === 0) {
      bytes.push(0);
      break;
    }
    const encoded = new TextEncoder().encode(label);
    if (encoded.length > 63) throw new Error('DNS label exceeds 63 octets.');
    bytes.push(encoded.length, ...encoded);
  }
  return new Uint8Array(bytes);
}

export async function generateDsRecord(ownerName: string, dnskeyInput: string, digestType: 2 | 4 = 2): Promise<DsRecord> {
  const dnskey = parseDnskey(dnskeyInput);
  const keyTag = dnskeyKeyTag(dnskey.rdata);
  const digestMaterial = concatBytes(canonicalNameWire(ownerName), dnskey.rdata);
  const digestHexValue = digestType === 2
    ? await digestHex('SHA-256', digestMaterial)
    : await digestHex('SHA-384', digestMaterial);

  return {
    keyTag,
    algorithm: dnskey.algorithm,
    digestType,
    digestHex: digestHexValue
  };
}

export function formatDsRecord(ds: DsRecord): string {
  return `DS ${ds.keyTag} ${ds.algorithm} ${ds.digestType} ${ds.digestHex}`;
}

export function dnskeyWarnings(input: string): string[] {
  const warnings: string[] = [];
  const dnskey = parseDnskey(input);
  if (dnskey.protocol !== 3) warnings.push('DNSKEY protocol is normally 3. Check that the DNSKEY line was pasted correctly.');
  if ((dnskey.flags & 0x0001) !== 0x0001) warnings.push('The DNSKEY does not have the SEP/KSK flag. DS records are normally made from the KSK.');
  if ([1, 3, 5, 6, 7, 12].includes(dnskey.algorithm)) {
    warnings.push('This DNSKEY algorithm is not recommended for new DNSSEC signing. Prefer a currently supported algorithm such as 8, 13, or 15 when the DNS server supports it.');
  }
  return warnings;
}
