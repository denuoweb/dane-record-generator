export type DomainType = 'hns' | 'icann';
export type SetupMode = 'delegated' | 'hns-inline';
export type TransportProtocol = 'tcp' | 'udp' | 'sctp';
export type DnsServerPreset = 'generic-zone' | 'hosted-dns' | 'powerdns' | 'knot' | 'bind' | 'nsd';
export type CheckStatus = 'ok' | 'warn' | 'missing';
export type Severity = 'info' | 'warning' | 'error';
export type OutputAudience = 'parent' | 'authoritative' | 'server' | 'web' | 'verify' | 'integrator';
export type HnsWalletOptionId = 'cli' | 'bob' | 'shake';

export interface BootstrapInput {
  domainType: DomainType;
  setupMode: SetupMode;
  domainInput: string;
  nameserverHost?: string;
  nameserverIpv4?: string;
  nameserverIpv6?: string;
  websiteIpv4?: string;
  websiteIpv6?: string;
  port: number;
  protocol: TransportProtocol;
  pemInput?: string;
  dnskeyInput?: string;
  ttl?: number;
  tlsaUsage?: number;
  tlsaSelector?: number;
  tlsaMatchingType?: number;
  dnsServerPreset?: DnsServerPreset;
  dsDigestType?: 2 | 4;
}

export interface GeneratedLine {
  value: string;
  explanation: string;
  presentation?: {
    kind: 'hns-wallet-option';
    tabId: HnsWalletOptionId;
    tabLabel: string;
    defaultSelected?: boolean;
  };
}

export interface StatusCheck {
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface BootstrapNotice {
  severity: Severity;
  message: string;
}

export interface OutputSection {
  id: string;
  title: string;
  audience: OutputAudience;
  lines: GeneratedLine[];
  compact?: boolean;
}

export interface BootstrapResult {
  normalizedDomain: string;
  displayDomain: string;
  tlsaOwner: string;
  parentTitle: string;
  parentRecords: GeneratedLine[];
  authoritativeTitle: string;
  authoritativeRecords: GeneratedLine[];
  serverPresetTitle: string;
  serverPresetRecords: GeneratedLine[];
  verificationTitle: string;
  verificationCommands: GeneratedLine[];
  integrationTitle: string;
  integrationRecords: GeneratedLine[];
  webServerNotes: GeneratedLine[];
  quickSteps: GeneratedLine[];
  notices: BootstrapNotice[];
  warnings: string[];
  helpTips: string[];
  statusChecks: StatusCheck[];
  sections: OutputSection[];
  diagnostics: {
    inBailiwickNameserver: boolean;
    needsGlue: boolean;
    hasTlsa: boolean;
    hasDs: boolean;
    mode: SetupMode;
    dnsServerPreset: DnsServerPreset;
    parentRecordCount: number;
    hnsResourceSizeBytes?: number;
  };
}

export interface ParsedDnskey {
  flags: number;
  protocol: number;
  algorithm: number;
  publicKeyBase64: string;
  rdata: Uint8Array;
}

export interface DsRecord {
  keyTag: number;
  algorithm: number;
  digestType: 2 | 4;
  digestHex: string;
}

export interface HnsParentRecordDraft {
  type: 'NS' | 'GLUE4' | 'GLUE6' | 'DS' | 'SYNTH4' | 'SYNTH6';
  ns?: string;
  address?: string;
  keyTag?: number;
  algorithm?: number;
  digestType?: 2 | 4;
  digest?: string;
}
