export interface DerNode {
  tag: number;
  headerStart: number;
  contentStart: number;
  end: number;
  children: DerNode[];
}

function readLength(bytes: Uint8Array, offset: number): { length: number; next: number } {
  const first = bytes[offset];
  if (first === undefined) throw new Error('Unexpected end of DER length.');
  if ((first & 0x80) === 0) return { length: first, next: offset + 1 };

  const octets = first & 0x7f;
  if (octets === 0 || octets > 4) throw new Error('Unsupported DER length encoding.');
  if (offset + octets >= bytes.length) throw new Error('DER length exceeds input.');

  let length = 0;
  for (let i = 0; i < octets; i += 1) {
    const byte = bytes[offset + 1 + i];
    if (byte === undefined) throw new Error('Unexpected end of DER length.');
    length = (length << 8) | byte;
  }
  return { length, next: offset + 1 + octets };
}

export function parseDerNode(bytes: Uint8Array, offset = 0): DerNode {
  const tag = bytes[offset];
  if (tag === undefined) throw new Error('Unexpected end of DER input.');
  const { length, next } = readLength(bytes, offset + 1);
  const end = next + length;
  if (end > bytes.length) throw new Error('DER object length exceeds input.');

  const constructed = (tag & 0x20) === 0x20;
  const node: DerNode = { tag, headerStart: offset, contentStart: next, end, children: [] };

  if (constructed) {
    let childOffset = next;
    while (childOffset < end) {
      const child = parseDerNode(bytes, childOffset);
      node.children.push(child);
      childOffset = child.end;
    }
    if (childOffset !== end) throw new Error('DER child parsing ended at invalid offset.');
  }

  return node;
}

export function extractSpkiFromCertificateDer(certDer: Uint8Array): Uint8Array {
  const root = parseDerNode(certDer);
  if (root.tag !== 0x30 || root.children.length < 1) {
    throw new Error('Input does not look like an X.509 certificate sequence.');
  }

  const tbsCertificate = root.children[0];
  if (!tbsCertificate || tbsCertificate.tag !== 0x30) {
    throw new Error('Certificate TBSCertificate sequence was not found.');
  }

  const hasExplicitVersion = tbsCertificate.children[0]?.tag === 0xa0;
  const spkiIndex = hasExplicitVersion ? 6 : 5;
  const spki = tbsCertificate.children[spkiIndex];

  if (!spki || spki.tag !== 0x30) {
    throw new Error('SubjectPublicKeyInfo was not found in the certificate.');
  }

  return certDer.slice(spki.headerStart, spki.end);
}
