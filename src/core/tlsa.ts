import { base64ToBytes, bytesToHex, digestHex } from './crypto';
import { extractSpkiFromCertificateDer } from './der';

interface PemBlock {
  label: string;
  bytes: Uint8Array;
}

export interface TlsaInput {
  pemInput: string;
  ownerName: string;
  ttl: number;
  usage?: number;
  selector?: number;
  matchingType?: number;
}

const PEM_RE = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/gm;

export function parsePemBlocks(input: string): PemBlock[] {
  const blocks: PemBlock[] = [];
  for (const match of input.matchAll(PEM_RE)) {
    blocks.push({
      label: match[1].trim(),
      bytes: base64ToBytes(match[2], `PEM ${match[1].trim()}`)
    });
  }
  return blocks;
}

export function parsePemBlock(input: string): PemBlock {
  const blocks = parsePemBlocks(input);
  if (blocks.length === 0) throw new Error('Expected a PEM CERTIFICATE or PUBLIC KEY block.');
  const privateKey = blocks.find((block) => block.label.includes('PRIVATE KEY'));
  if (privateKey && blocks.every((block) => !['CERTIFICATE', 'PUBLIC KEY'].includes(block.label))) {
    throw new Error('Private keys are not needed. Paste the certificate or PUBLIC KEY instead.');
  }
  const supported = blocks.find((block) => block.label === 'PUBLIC KEY' || block.label === 'CERTIFICATE');
  if (!supported) throw new Error('Use a PEM CERTIFICATE or PUBLIC KEY block.');
  return supported;
}

export function extractSpkiFromPem(input: string): Uint8Array {
  const pem = parsePemBlock(input);
  if (pem.label === 'PUBLIC KEY') return pem.bytes;
  if (pem.label === 'CERTIFICATE') return extractSpkiFromCertificateDer(pem.bytes);
  throw new Error(`Unsupported PEM block: ${pem.label}. Use CERTIFICATE or PUBLIC KEY.`);
}

function validateTlsaParameters(usage: number, selector: number, matchingType: number): void {
  if (!Number.isInteger(usage) || usage < 0 || usage > 3) throw new Error('TLSA usage must be 0, 1, 2, or 3.');
  if (!Number.isInteger(selector) || selector < 0 || selector > 1) throw new Error('TLSA selector must be 0 or 1.');
  if (!Number.isInteger(matchingType) || matchingType < 0 || matchingType > 2) throw new Error('TLSA matching type must be 0, 1, or 2.');
  if (selector !== 1) throw new Error('This app intentionally supports selector 1 only: SubjectPublicKeyInfo.');
}

export async function generateTlsaRecord(input: TlsaInput): Promise<string> {
  const usage = input.usage ?? 3;
  const selector = input.selector ?? 1;
  const matchingType = input.matchingType ?? 1;
  validateTlsaParameters(usage, selector, matchingType);

  const spki = extractSpkiFromPem(input.pemInput);
  let associationData: string;
  if (matchingType === 0) associationData = bytesToHex(spki);
  else if (matchingType === 1) associationData = await digestHex('SHA-256', spki);
  else associationData = await digestHex('SHA-512', spki);

  return `${input.ownerName} ${input.ttl} IN TLSA ${usage} ${selector} ${matchingType} ${associationData}`;
}
