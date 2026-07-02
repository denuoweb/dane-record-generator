import type { BootstrapInput, BootstrapNotice, BootstrapResult, DnsServerPreset, DsRecord, GeneratedLine, HnsParentRecordDraft, OutputSection, StatusCheck } from './types';
import { displayDomain, isInBailiwick, normalizeDomain, normalizeHostname, synthNameserverName, tlsaOwnerName, validateDomainName, validateHostname, validateIpv4, validateIpv6, validateTtl } from './domain';
import { dnskeyWarnings, formatDsRecord, generateDsRecord } from './dnssec';
import { generateServerPreset, recommendedPresetTip, serverPresetLabel } from './serverPresets';
import { generateTlsaRecord } from './tlsa';

function optionalLine(condition: boolean, line: GeneratedLine): GeneratedLine[] {
  return condition ? [line] : [];
}

function check(label: string, status: StatusCheck['status'], detail: string): StatusCheck {
  return { label, status, detail };
}

function notice(severity: BootstrapNotice['severity'], message: string): BootstrapNotice {
  return { severity, message };
}

function nonEmpty(value?: string): value is string {
  return Boolean(value?.trim());
}

function containsNonAscii(value?: string): boolean {
  return Boolean(value && /[^\x00-\x7F]/.test(value));
}

function stripRecordPrefix(record: string, prefix: string): string {
  return record.startsWith(prefix) ? record.slice(prefix.length) : record;
}

function estimateHnsResourceSize(records: HnsParentRecordDraft[]): number {
  return new TextEncoder().encode(JSON.stringify({ records })).length;
}

function dsToDraft(ds: DsRecord): HnsParentRecordDraft {
  return {
    type: 'DS',
    keyTag: ds.keyTag,
    algorithm: ds.algorithm,
    digestType: ds.digestType,
    digest: ds.digestHex
  };
}

function validateInputs(input: BootstrapInput, domain: string): BootstrapNotice[] {
  const notices: BootstrapNotice[] = [];

  if (!validateDomainName(domain)) notices.push(notice('error', 'Domain format is not valid for DNS output.'));
  if (containsNonAscii(input.domainInput) || containsNonAscii(input.nameserverHost)) {
    notices.push(notice('info', 'Internationalized domain input is converted to DNS ASCII A-labels such as xn--... in generated records.'));
  }
  if (!validateTtl(input.ttl ?? 3600)) notices.push(notice('warning', 'TTL should normally be between 60 and 86400 seconds.'));

  if (input.setupMode === 'hns-inline' && input.domainType !== 'hns') {
    notices.push(notice('warning', 'SYNTH nameserver mode is HNS-only. ICANN output uses named DNS delegation.'));
  }

  if (nonEmpty(input.websiteIpv4) && !validateIpv4(input.websiteIpv4)) notices.push(notice('error', 'Website IPv4 address is not valid.'));
  if (nonEmpty(input.websiteIpv6) && !validateIpv6(input.websiteIpv6)) notices.push(notice('error', 'Website IPv6 address is not valid.'));
  if (nonEmpty(input.nameserverIpv4) && !validateIpv4(input.nameserverIpv4)) notices.push(notice('error', 'Nameserver IPv4 address is not valid.'));
  if (nonEmpty(input.nameserverIpv6) && !validateIpv6(input.nameserverIpv6)) notices.push(notice('error', 'Nameserver IPv6 address is not valid.'));

  if (input.setupMode === 'delegated') {
    if (!nonEmpty(input.nameserverHost)) notices.push(notice('error', 'Delegated mode needs a nameserver hostname.'));
    else if (!validateHostname(input.nameserverHost)) notices.push(notice('error', 'Nameserver hostname is not valid.'));
  }

  if (input.setupMode === 'hns-inline' && input.domainType === 'hns' && !nonEmpty(input.nameserverIpv4) && !nonEmpty(input.nameserverIpv6)) {
    notices.push(notice('error', 'HNS SYNTH mode needs at least one nameserver IP address.'));
  }

  if (!nonEmpty(input.websiteIpv4) && !nonEmpty(input.websiteIpv6)) notices.push(notice('error', 'No website A or AAAA address was supplied.'));

  if (input.setupMode === 'delegated' && nonEmpty(input.nameserverHost) && isInBailiwick(input.nameserverHost, domain) && !nonEmpty(input.nameserverIpv4) && !nonEmpty(input.nameserverIpv6)) {
    notices.push(notice('error', 'The nameserver is inside the same zone, so glue is required. Add at least one nameserver IP address.'));
  }

  if (nonEmpty(input.dnskeyInput)) {
    try {
      dnskeyWarnings(input.dnskeyInput).forEach((message) => notices.push(notice('warning', message)));
    } catch {
      // DS generation will produce the exact parser message.
    }
  }

  if (!nonEmpty(input.dnskeyInput) && nonEmpty(input.pemInput) && ['delegated', 'hns-inline'].includes(input.setupMode)) {
    notices.push(notice('warning', 'TLSA is generated, but DNSSEC is incomplete until you publish a parent-side DS record.'));
  }

  if (input.tlsaUsage !== undefined && input.tlsaUsage !== 3) {
    notices.push(notice('warning', 'TLSA usage 3 is the default for this onboarding flow. Other usages are advanced and depend on CA/TA handling.'));
  }

  return notices;
}

function rootless(name: string): string {
  return name.endsWith('.') ? name.slice(0, -1) : name;
}

function defaultHelpTips(domainType: BootstrapInput['domainType'], setupMode: BootstrapInput['setupMode'], preset: DnsServerPreset, domain: string, nameserver: string): string[] {
  const tips = [
    'Fastest reliable path: create the authoritative zone, enable DNSSEC signing, paste DNSKEY here, then copy the generated DS to the wallet or registrar.',
    recommendedPresetTip(preset),
    'TLSA 3 1 1 pins the service public key with SHA-256. Certificate renewal can be easy if the server keeps the same keypair.',
    'Parent records and server records are different. The wallet or registrar delegates. The DNS server publishes the site records and TLSA.',
    'Internationalized names are accepted as input, but DNS records use IDNA A-labels such as xn--bcher-kva.example.'
  ];

  if (domainType === 'hns' && setupMode === 'delegated') {
    tips.push(`For HNS delegated mode, GLUE4/GLUE6 is needed when the nameserver lives under the HNS name itself, such as ${nameserver} for ${rootless(domain)}/.`);
  }

  if (setupMode === 'hns-inline') {
    tips.push('HNS SYNTH mode stores nameserver IPs in the HNS resource. Website A/AAAA and TLSA records still live on the authoritative DNS server.');
  }

  return tips;
}

function buildQuickSteps(input: BootstrapInput, effectiveMode: BootstrapInput['setupMode'], hasDs: boolean, hasTlsa: boolean): GeneratedLine[] {
  if (effectiveMode === 'hns-inline') {
    return [
      { value: '1. Put the server records on the authoritative DNS server.', explanation: 'SYNTH points resolvers to nameserver IPs; the zone still serves A/AAAA/TLSA.' },
      { value: '2. Enable DNSSEC signing on the zone.', explanation: 'The DNS server should manage the signing keys and signed zone.' },
      { value: hasDs ? '3. Send SYNTH and DS records to the HNS wallet.' : '3. Paste the DNSKEY here, then send SYNTH and DS records to the HNS wallet.', explanation: 'SYNTH is the parent-side referral; DS connects DNSSEC to the signed zone.' },
      { value: hasTlsa ? '4. Serve the matching HTTPS certificate/key.' : '4. Paste the leaf certificate or PUBLIC KEY to generate TLSA.', explanation: 'TLSA goes on the authoritative DNS server.' }
    ];
  }

  return [
    { value: '1. Put the server records on the authoritative DNS server.', explanation: 'Use the selected server preset or the generic zone-file output.' },
    { value: '2. Enable DNSSEC signing on the zone.', explanation: 'The DNS server should manage the signing keys and signed zone.' },
    { value: hasDs ? '3. Copy the DS into the wallet or registrar.' : '3. Paste the DNSKEY here, then copy the generated DS into the wallet or registrar.', explanation: 'The DS connects the parent layer to the signed child zone.' },
    { value: hasTlsa ? '4. Serve the matching HTTPS certificate/key.' : '4. Paste the leaf certificate or PUBLIC KEY to generate TLSA.', explanation: 'TLSA goes on the authoritative DNS server.' },
    { value: input.domainType === 'hns' ? '5. Submit the HNS name-resource update.' : '5. Save registrar nameserver, glue, and DS settings.', explanation: 'This activates the parent-side delegation path.' }
  ];
}

function buildStatusChecks(input: BootstrapInput, effectiveMode: BootstrapInput['setupMode'], inBailiwickNameserver: boolean, hasDs: boolean, hasTlsa: boolean): StatusCheck[] {
  const checks: StatusCheck[] = [
    check('Domain', input.domainInput.trim() ? 'ok' : 'missing', input.domainInput.trim() ? 'Domain is normalized for DNS output.' : 'Enter the HNS name or ICANN domain.'),
    check('Website IP', nonEmpty(input.websiteIpv4) || nonEmpty(input.websiteIpv6) ? 'ok' : 'missing', nonEmpty(input.websiteIpv4) || nonEmpty(input.websiteIpv6) ? 'A/AAAA output can be generated.' : 'Add at least one website IPv4 or IPv6 address.')
  ];

  if (effectiveMode === 'hns-inline') {
    checks.push(check('Nameserver', nonEmpty(input.nameserverIpv4) || nonEmpty(input.nameserverIpv6) ? 'ok' : 'missing', nonEmpty(input.nameserverIpv4) || nonEmpty(input.nameserverIpv6) ? 'SYNTH nameserver IP can be generated.' : 'Add at least one nameserver IPv4 or IPv6 address.'));
    checks.push(check('DS', hasDs ? 'ok' : 'missing', hasDs ? 'Parent-side DS is generated from DNSKEY.' : 'Paste DNSKEY after signing the authoritative zone.'));
    checks.push(check('TLSA', hasTlsa ? 'ok' : 'missing', hasTlsa ? 'TLSA is generated from certificate/public key.' : 'Paste a certificate or PUBLIC KEY to generate TLSA.'));
    return checks;
  }

  checks.push(check('Nameserver', nonEmpty(input.nameserverHost) ? 'ok' : 'missing', nonEmpty(input.nameserverHost) ? 'Delegation target is present.' : 'Add the authoritative nameserver hostname.'));
  checks.push(check('Glue', inBailiwickNameserver ? (nonEmpty(input.nameserverIpv4) || nonEmpty(input.nameserverIpv6) ? 'ok' : 'missing') : 'ok', inBailiwickNameserver ? 'Nameserver is inside the zone, so glue must be in the parent records.' : 'Nameserver is external, so glue is handled by its own parent.'));
  checks.push(check('DS', hasDs ? 'ok' : 'missing', hasDs ? 'Parent-side DS is generated from DNSKEY.' : 'Paste DNSKEY after signing the authoritative zone.'));
  checks.push(check('TLSA', hasTlsa ? 'ok' : 'missing', hasTlsa ? 'TLSA is generated from certificate/public key.' : 'Paste a certificate or PUBLIC KEY to generate TLSA.'));

  return checks;
}

function buildVerificationCommands(input: BootstrapInput, effectiveMode: BootstrapInput['setupMode'], domain: string, ns: string, owner: string): GeneratedLine[] {
  if (effectiveMode === 'hns-inline') {
    return [{
      value: [
        `dig @${input.nameserverIpv4 || input.nameserverIpv6 || '<nameserver-ip>'} ${domain} SOA +norecurse`,
        ...(input.websiteIpv4 ? [`dig @${input.nameserverIpv4 || input.nameserverIpv6 || '<nameserver-ip>'} ${domain} A +dnssec +norecurse`] : []),
        ...(input.websiteIpv6 ? [`dig @${input.nameserverIpv4 || input.nameserverIpv6 || '<nameserver-ip>'} ${domain} AAAA +dnssec +norecurse`] : []),
        `dig @${input.nameserverIpv4 || input.nameserverIpv6 || '<nameserver-ip>'} ${owner} TLSA +dnssec +norecurse`,
        '# After the HNS update confirms, test full-chain resolution with an HNS-aware resolver/browser.'
      ].join('\n'),
      explanation: 'Commands to check that the SYNTH-addressed authoritative server answers before and after the HNS update.'
    }];
  }

  const atServer = input.nameserverIpv4 || input.nameserverIpv6 || ns;
  const lines = [
    `dig @${atServer} ${domain} SOA +norecurse`,
    ...(input.websiteIpv4 ? [`dig @${atServer} ${domain} A +dnssec +norecurse`] : []),
    ...(input.websiteIpv6 ? [`dig @${atServer} ${domain} AAAA +dnssec +norecurse`] : []),
    `dig @${atServer} ${owner} TLSA +dnssec +norecurse`,
    input.domainType === 'icann'
      ? `delv ${domain} A`
      : `# For HNS full-chain tests, query through your HNS-aware resolver after the wallet update confirms.`
  ];

  return [{
    value: lines.join('\n'),
    explanation: 'Commands to check that the authoritative server answers before and after parent-side delegation.'
  }];
}

function buildIntegrationRecord(parentDraft: HnsParentRecordDraft[], input: BootstrapInput, effectiveMode: BootstrapInput['setupMode'], parentRecords: GeneratedLine[], authoritativeRecords: GeneratedLine[]): GeneratedLine[] {
  const payload = input.domainType === 'hns'
    ? {
      type: 'hns-parent-record-draft',
      note: 'Use this as an integration schema. Confirm exact wallet/SDK field names before broadcasting.',
      records: parentDraft
    }
    : {
      type: 'icann-parent-record-summary',
      note: 'Registrar panels vary. Use the human-readable parent box for actual entry.',
      records: parentRecords.map((record) => record.value)
    };

  return [{
    value: JSON.stringify({
      mode: effectiveMode,
      parent: payload,
      authoritative: authoritativeRecords.map((record) => record.value)
    }, null, 2),
    explanation: 'Machine-readable output for wallets, future APIs, or integration tests. It is not automatically submitted anywhere.'
  }];
}

function buildSections(result: Omit<BootstrapResult, 'sections'>): OutputSection[] {
  const sections: OutputSection[] = [
    { id: 'steps', title: 'Do these steps', audience: 'verify', lines: result.quickSteps, compact: true },
    { id: 'parent', title: result.parentTitle, audience: 'parent', lines: result.parentRecords },
    { id: 'authoritative', title: result.authoritativeTitle, audience: 'authoritative', lines: result.authoritativeRecords }
  ];

  if (result.serverPresetRecords.length) sections.push({ id: 'server', title: result.serverPresetTitle, audience: 'server', lines: result.serverPresetRecords });
  sections.push({ id: 'verify', title: result.verificationTitle, audience: 'verify', lines: result.verificationCommands, compact: true });
  sections.push({ id: 'web', title: 'Web server note', audience: 'web', lines: result.webServerNotes, compact: true });
  sections.push({ id: 'integrator', title: result.integrationTitle, audience: 'integrator', lines: result.integrationRecords });
  return sections;
}

export async function generateBootstrap(input: BootstrapInput): Promise<BootstrapResult> {
  const ttl = input.ttl ?? 3600;
  const preset = input.dnsServerPreset ?? 'generic-zone';
  const normalizedDomain = normalizeDomain(input.domainInput, input.domainType);
  const readableDomain = displayDomain(input.domainInput, input.domainType);
  const effectiveMode = input.domainType === 'icann' && input.setupMode === 'hns-inline' ? 'delegated' : input.setupMode;
  const owner = tlsaOwnerName(normalizedDomain, input.port, input.protocol);
  const notices = validateInputs({ ...input, setupMode: effectiveMode, ttl }, normalizedDomain);

  const parentRecords: GeneratedLine[] = [];
  const authoritativeRecords: GeneratedLine[] = [];
  const parentDraft: HnsParentRecordDraft[] = [];
  const webServerNotes: GeneratedLine[] = [];

  let tlsaRecord: string | undefined;
  let dsRecordText: string | undefined;
  let dsRecord: DsRecord | undefined;
  let inBailiwickNameserver = false;
  let ns = 'ns1.example.';
  let authoritativeNsHosts: string[] = [];

  if (nonEmpty(input.pemInput)) {
    try {
      tlsaRecord = await generateTlsaRecord({
        pemInput: input.pemInput,
        ownerName: owner,
        ttl,
        usage: input.tlsaUsage ?? 3,
        selector: input.tlsaSelector ?? 1,
        matchingType: input.tlsaMatchingType ?? 1
      });
    } catch (error) {
      notices.push(notice('error', error instanceof Error ? error.message : 'Unable to generate TLSA record.'));
    }
  }

  if (nonEmpty(input.dnskeyInput)) {
    try {
      dsRecord = await generateDsRecord(normalizedDomain, input.dnskeyInput, input.dsDigestType ?? 2);
      dsRecordText = formatDsRecord(dsRecord);
    } catch (error) {
      notices.push(notice('error', error instanceof Error ? error.message : 'Unable to generate DS record from DNSKEY input.'));
    }
  }

  if (effectiveMode === 'hns-inline') {
    if (nonEmpty(input.nameserverIpv4) && validateIpv4(input.nameserverIpv4)) {
      parentRecords.push({ value: `SYNTH4 ${input.nameserverIpv4}`, explanation: 'HNS wallet-side synthetic IPv4 nameserver referral.' });
      parentDraft.push({ type: 'SYNTH4', address: input.nameserverIpv4 });
      authoritativeNsHosts.push(synthNameserverName(input.nameserverIpv4));
    }
    if (nonEmpty(input.nameserverIpv6) && validateIpv6(input.nameserverIpv6)) {
      parentRecords.push({ value: `SYNTH6 ${input.nameserverIpv6}`, explanation: 'HNS wallet-side synthetic IPv6 nameserver referral.' });
      parentDraft.push({ type: 'SYNTH6', address: input.nameserverIpv6 });
      authoritativeNsHosts.push(synthNameserverName(input.nameserverIpv6));
    }
    ns = authoritativeNsHosts[0] ?? ns;
    if (dsRecord && dsRecordText) {
      parentRecords.push({ value: dsRecordText, explanation: 'HNS wallet-side DNSSEC delegation signer record derived from the child-zone DNSKEY.' });
      parentDraft.push(dsToDraft(dsRecord));
    } else {
      parentRecords.push({ value: 'DS <keytag> <algorithm> 2 <sha256-digest>', explanation: 'Placeholder: paste your authoritative-zone DNSKEY to generate the exact parent-side DS record.' });
    }
  } else {
    ns = input.nameserverHost ? normalizeHostname(input.nameserverHost) : `ns1.${normalizedDomain}`;
    inBailiwickNameserver = input.nameserverHost ? isInBailiwick(ns, normalizedDomain) : true;
    authoritativeNsHosts = [ns];

    if (input.domainType === 'hns') {
      if (inBailiwickNameserver) {
        if (nonEmpty(input.nameserverIpv4)) {
          parentRecords.push({ value: `GLUE4 ${ns} ${input.nameserverIpv4}`, explanation: 'HNS wallet-side glue record for the IPv4 address of your in-name authoritative nameserver.' });
          parentDraft.push({ type: 'GLUE4', ns, address: input.nameserverIpv4 });
        }
        if (nonEmpty(input.nameserverIpv6)) {
          parentRecords.push({ value: `GLUE6 ${ns} ${input.nameserverIpv6}`, explanation: 'HNS wallet-side glue record for the IPv6 address of your in-name authoritative nameserver.' });
          parentDraft.push({ type: 'GLUE6', ns, address: input.nameserverIpv6 });
        }
      } else {
        parentRecords.push({ value: `NS ${ns}`, explanation: 'HNS wallet-side delegation record pointing the name at an external authoritative nameserver.' });
        parentDraft.push({ type: 'NS', ns });
      }
      if (dsRecord && dsRecordText) {
        parentRecords.push({ value: dsRecordText, explanation: 'HNS wallet-side DNSSEC delegation signer record derived from the child-zone DNSKEY.' });
        parentDraft.push(dsToDraft(dsRecord));
      } else {
        parentRecords.push({ value: 'DS <keytag> <algorithm> 2 <sha256-digest>', explanation: 'Placeholder: paste your authoritative-zone DNSKEY to generate the exact parent-side DS record.' });
      }
    } else {
      parentRecords.push({ value: `Nameserver: ${ns}`, explanation: 'Registrar-side nameserver delegation.' });
      parentRecords.push(
        ...optionalLine(inBailiwickNameserver && nonEmpty(input.nameserverIpv4), {
          value: `Glue IPv4: ${input.nameserverIpv4}`,
          explanation: 'Registrar-side glue is needed because the nameserver is inside the delegated domain.'
        }),
        ...optionalLine(inBailiwickNameserver && nonEmpty(input.nameserverIpv6), {
          value: `Glue IPv6: ${input.nameserverIpv6}`,
          explanation: 'Registrar-side IPv6 glue is needed because the nameserver is inside the delegated domain.'
        })
      );
      parentRecords.push({
        value: dsRecordText ? `DS: ${stripRecordPrefix(dsRecordText, 'DS ')}` : 'DS: <keytag> <algorithm> 2 <sha256-digest>',
        explanation: dsRecordText ? 'Registrar-side DS record derived from the child-zone DNSKEY.' : 'Placeholder: paste your authoritative-zone DNSKEY to generate the exact registrar-side DS record.'
      });
    }

  }

  if (effectiveMode === 'delegated' || effectiveMode === 'hns-inline') {
    authoritativeNsHosts.forEach((nameserver) => {
      authoritativeRecords.push({ value: `${normalizedDomain} ${ttl} IN NS ${nameserver}`, explanation: 'Authoritative-zone NS record naming a server responsible for this zone.' });
    });
    authoritativeRecords.push(
      ...optionalLine(nonEmpty(input.websiteIpv4), {
        value: `${normalizedDomain} ${ttl} IN A ${input.websiteIpv4}`,
        explanation: 'Authoritative-zone IPv4 address for the website apex.'
      }),
      ...optionalLine(nonEmpty(input.websiteIpv6), {
        value: `${normalizedDomain} ${ttl} IN AAAA ${input.websiteIpv6}`,
        explanation: 'Authoritative-zone IPv6 address for the website apex.'
      })
    );

    if (tlsaRecord) authoritativeRecords.push({ value: tlsaRecord, explanation: 'Authoritative-zone DANE/TLSA record for the TLS service.' });
    else authoritativeRecords.push({ value: `${owner} ${ttl} IN TLSA 3 1 1 <spki-sha256>`, explanation: 'Placeholder: paste a PEM certificate or PUBLIC KEY to generate the exact TLSA association data.' });
  }

  webServerNotes.push({
    value: 'Serve the certificate whose public key matches the TLSA SPKI hash.',
    explanation: 'If the certificate key changes, publish the new TLSA record before switching the web server to the new key.'
  });
  webServerNotes.push({
    value: 'Nginx/Apache/Caddy do not need a DANE plugin; DANE lives in DNS.',
    explanation: 'The TLS server serves a normal certificate. A DANE-aware client verifies the DNSSEC-protected TLSA record.'
  });

  const serverPresetRecords = effectiveMode === 'delegated' || effectiveMode === 'hns-inline'
    ? generateServerPreset({
      preset,
      domain: normalizedDomain,
      nameserverHost: ns,
      nameserverHosts: authoritativeNsHosts,
      ttl,
      websiteIpv4: input.websiteIpv4,
      websiteIpv6: input.websiteIpv6,
      tlsaRecord,
      tlsaOwner: owner
    })
    : [];

  const hasDs = Boolean(dsRecordText);
  const hasTlsa = Boolean(tlsaRecord);
  const statusChecks = buildStatusChecks(input, effectiveMode, inBailiwickNameserver, hasDs, hasTlsa);
  const quickSteps = buildQuickSteps(input, effectiveMode, hasDs, hasTlsa);
  const verificationCommands = buildVerificationCommands(input, effectiveMode, normalizedDomain, ns, owner);
  const integrationRecords = buildIntegrationRecord(parentDraft, input, effectiveMode, parentRecords, authoritativeRecords);
  const hnsResourceSizeBytes = input.domainType === 'hns' ? estimateHnsResourceSize(parentDraft) : undefined;

  if (input.domainType === 'hns' && hnsResourceSizeBytes !== undefined && hnsResourceSizeBytes > 512) {
    notices.push(notice('warning', `Estimated HNS parent-resource draft is ${hnsResourceSizeBytes} bytes. Keep HNS name resources small.`));
  }

  const resultWithoutSections: Omit<BootstrapResult, 'sections'> = {
    normalizedDomain,
    displayDomain: readableDomain,
    tlsaOwner: owner,
    parentTitle: input.domainType === 'hns' ? 'Put this in your HNS wallet / name resource' : 'Put this at your registrar / parent zone',
    parentRecords,
    authoritativeTitle: 'Put this on your authoritative DNS server',
    authoritativeRecords,
    serverPresetTitle: serverPresetLabel(preset),
    serverPresetRecords,
    verificationTitle: 'Verify with these commands',
    verificationCommands,
    integrationTitle: 'Integrator JSON',
    integrationRecords,
    webServerNotes,
    quickSteps,
    notices,
    warnings: notices.filter((item) => item.severity !== 'info').map((item) => item.message),
    helpTips: defaultHelpTips(input.domainType, effectiveMode, preset, normalizedDomain, ns),
    statusChecks,
    diagnostics: {
      inBailiwickNameserver,
      needsGlue: inBailiwickNameserver && effectiveMode === 'delegated',
      hasTlsa,
      hasDs,
      mode: effectiveMode,
      dnsServerPreset: preset,
      parentRecordCount: parentRecords.length,
      hnsResourceSizeBytes
    }
  };

  return {
    ...resultWithoutSections,
    sections: buildSections(resultWithoutSections)
  };
}
