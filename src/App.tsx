import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BootstrapInput, BootstrapNotice, BootstrapResult, DnsServerPreset, DomainType, GeneratedLine, OutputSection, SetupMode, StatusCheck } from './core/types';
import { generateBootstrap } from './core/bootstrap';
import { guidanceForIntent, type HandoffGuidance } from './handoffGuidance';
import { isLanguageCode, languageOptions, localeText, type LanguageCode, type LocaleText } from './i18n';
import { localizeBootstrapResult } from './resultLocalization';
import { readUrlPrefill } from './urlPrefill';

const HNS_EXAMPLE_DOMAIN = 'example/';
const ICANN_EXAMPLE_DOMAIN = 'example.com';
const HNS_EXAMPLE_NAMESERVER = 'ns1.example.';
const ICANN_EXAMPLE_NAMESERVER = 'ns1.example.com.';
const EXAMPLE_NAMESERVER_IPV4 = '203.0.113.10';
const EXAMPLE_WEBSITE_IPV4 = '203.0.113.20';
const DONATION_ADDRESS = 'hs1q5997733eq7f4yyk2vq2z8gz3yqyvpz422ypggh';
const DONATION_URI = `handshake:${DONATION_ADDRESS}`;
const GITHUB_REPOSITORY_URL = 'https://github.com/denuoweb/dane-record-generator';
const CERTIFICATE_PLACEHOLDER = `-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----

or

-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----`;

interface HowToContext {
  certConnectTarget: string;
  certServerName: string;
  dnskeyQueryServer: string;
  dnskeyZone: string;
}

function withoutRootDot(value: string): string {
  return value.endsWith('.') ? value.slice(0, -1) : value;
}

function ensureRootDot(value: string): string {
  return value.endsWith('.') ? value : `${value}.`;
}

function asciiHost(value: string): string {
  try {
    return new URL(`http://${withoutRootDot(value)}/`).hostname;
  } catch {
    return value;
  }
}

function hostPort(host: string, port: number): string {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]:${port}` : `${host}:${port}`;
}

function Field(props: { label: string; help?: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{props.label}</span>
      {props.help && <span className="field-help">{props.help}</span>}
      {props.children}
    </div>
  );
}

function CertificateHowTo(props: { attention?: boolean; context: HowToContext; summaryLabel?: string; t: LocaleText }) {
  return (
    <details className={props.attention ? 'attention-howto' : 'field-howto'}>
      <summary>{props.summaryLabel ?? props.t.howTo.summary}</summary>
      <p>{props.t.howTo.certIntro}</p>
      <p>{props.t.howTo.certFetch}</p>
      <pre className="inline-code">{`openssl s_client -connect ${props.context.certConnectTarget} -servername ${props.context.certServerName} -showcerts </dev/null 2>/dev/null | openssl x509 -outform PEM`}</pre>
      <p>{props.t.howTo.certFile}</p>
      <pre className="inline-code">openssl x509 -in fullchain.pem -pubkey -noout</pre>
    </details>
  );
}

function DnskeyHowTo(props: { attention?: boolean; context: HowToContext; summaryLabel?: string; t: LocaleText }) {
  return (
    <details className={props.attention ? 'attention-howto' : 'field-howto'}>
      <summary>{props.summaryLabel ?? props.t.howTo.summary}</summary>
      <p>{props.t.howTo.dnskeyIntro}</p>
      <p>{props.t.howTo.dnskeyHosted}</p>
      <p>{props.t.howTo.dnskeyQuery}</p>
      <pre className="inline-code">{`dig @${props.context.dnskeyQueryServer} ${props.context.dnskeyZone} DNSKEY +dnssec +multi`}</pre>
    </details>
  );
}

function CopyButton(props: { text: string; t: LocaleText }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(props.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return <button type="button" onClick={copy}>{copied ? props.t.copy.copied : props.t.copy.copy}</button>;
}

function lineText(lines: GeneratedLine[]): string {
  return lines.map((line) => line.value).join('\n\n');
}

function isHnsWalletOption(line: GeneratedLine): line is GeneratedLine & { presentation: NonNullable<GeneratedLine['presentation']> } {
  return line.presentation?.kind === 'hns-wallet-option';
}

function localizedSectionTitle(section: OutputSection, result: BootstrapResult, t: LocaleText): string {
  if (section.id === 'parent') return result.normalizedDomain && result.parentTitle.includes('HNS') ? t.output.parentHns : t.output.parentIcann;
  if (section.id === 'authoritative') return t.output.authoritative;
  if (section.id === 'steps') return t.output.steps;
  if (section.id === 'verify') return t.output.verify;
  if (section.id === 'web') return t.output.web;
  if (section.id === 'integrator') return t.output.integrator;
  if (section.id === 'server') return `${t.output.server}: ${section.title}`;
  return section.title;
}

function OutputBox(props: { section: OutputSection; result: BootstrapResult; t: LocaleText }) {
  const walletOptions = props.section.lines.filter(isHnsWalletOption);
  const recordLines = walletOptions.length > 0 ? props.section.lines.filter((line) => !isHnsWalletOption(line)) : props.section.lines;
  const defaultWalletTab = walletOptions.find((line) => line.presentation.defaultSelected)?.presentation.tabId ?? walletOptions[0]?.presentation.tabId ?? '';
  const [activeWalletTab, setActiveWalletTab] = useState(defaultWalletTab);
  const activeWalletOption = walletOptions.find((line) => line.presentation.tabId === activeWalletTab) ?? walletOptions[0];
  const recordText = lineText(recordLines);
  const text = walletOptions.length > 0 && activeWalletOption ? [recordText, activeWalletOption.value].filter(Boolean).join('\n\n') : lineText(props.section.lines);

  useEffect(() => {
    if (walletOptions.length === 0) return;
    if (!walletOptions.some((line) => line.presentation.tabId === activeWalletTab)) setActiveWalletTab(defaultWalletTab);
  }, [activeWalletTab, defaultWalletTab, walletOptions]);

  return (
    <section className={`output-card audience-${props.section.audience}`}>
      <div className="output-heading">
        <div>
          <p className="section-tag">{props.t.output.audiences[props.section.audience]}</p>
          <h2>{localizedSectionTitle(props.section, props.result, props.t)}</h2>
        </div>
        <CopyButton text={text} t={props.t} />
      </div>
      <pre className={props.section.compact ? 'compact-pre' : undefined}>{recordText || props.t.copy.nothing}</pre>
      {!props.section.compact && (
        <div className="line-notes">
          {recordLines.map((line) => (
            <details key={line.value}>
              <summary>{line.value.split('\n')[0]}</summary>
              <p>{line.explanation}</p>
            </details>
          ))}
        </div>
      )}
      {walletOptions.length > 0 && activeWalletOption && (
        <div className="wallet-entry-options">
          <div className="wallet-tab-list" role="tablist" aria-label="HNS wallet entry method">
            {walletOptions.map((line) => {
              const selected = line.presentation.tabId === activeWalletOption.presentation.tabId;
              return (
                <button
                  type="button"
                  className={`wallet-tab-button${selected ? ' active' : ''}`}
                  role="tab"
                  aria-selected={selected}
                  key={line.presentation.tabId}
                  onClick={() => setActiveWalletTab(line.presentation.tabId)}
                >
                  {line.presentation.tabLabel}
                </button>
              );
            })}
          </div>
          <div className="wallet-tab-panel" role="tabpanel">
            <pre>{activeWalletOption.value}</pre>
            <p>{activeWalletOption.explanation}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusList(props: { checks: StatusCheck[]; t: LocaleText }) {
  return (
    <section className="status-card">
      <h2>{props.t.status.title}</h2>
      <div className="status-list">
        {props.checks.map((item) => (
          <div className={`status-pill ${item.status}`} key={item.label} title={item.detail}>
            <strong>{props.t.status.labels[item.label as keyof typeof props.t.status.labels] ?? item.label}</strong>
            <span>{item.status === 'ok' ? props.t.status.ok : item.status === 'warn' ? props.t.status.warn : props.t.status.missing}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Notices(props: { notices: BootstrapNotice[]; hasHelp?: boolean; children?: ReactNode; t: LocaleText }) {
  if (!props.notices.length && !props.hasHelp) return null;
  return (
    <section className="notice-card">
      <h2>{props.t.notices.title}</h2>
      <ul>
        {props.notices.map((item) => (
          <li className={item.severity} key={`${item.severity}-${item.message}`}>{item.message}</li>
        ))}
        {props.children}
      </ul>
    </section>
  );
}

function SetupSummary(props: { result: BootstrapResult; t: LocaleText }) {
  const mode = props.result.diagnostics.mode === 'hns-inline' ? props.t.summary.hnsInline : props.t.summary.delegated;
  const glue = props.result.diagnostics.needsGlue ? props.t.summary.glueRequired : props.t.summary.externalNameserver;
  const ds = props.result.diagnostics.hasDs ? props.t.summary.dsReady : props.t.summary.dsPlaceholder;
  const tlsa = props.result.diagnostics.hasTlsa ? props.t.summary.tlsaReady : props.t.summary.tlsaPlaceholder;
  return (
    <section className="summary-strip" aria-label={props.t.summary.aria}>
      <span>{props.result.displayDomain}</span>
      <span>{mode}</span>
      {props.result.diagnostics.mode === 'delegated' && <span>{glue}</span>}
      {props.result.diagnostics.mode === 'delegated' && <span>{ds}</span>}
      {props.result.diagnostics.mode === 'delegated' && <span>{tlsa}</span>}
    </section>
  );
}

function HandoffCard(props: { guidance: HandoffGuidance | null }) {
  if (!props.guidance) return null;
  return (
    <section className="handoff-card" aria-label="Report handoff">
      <p className="section-tag">{props.guidance.badge}</p>
      <h2>{props.guidance.title}</h2>
      <p>{props.guidance.body}</p>
      <ul>
        {props.guidance.next.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function App() {
  const urlPrefill = useMemo(() => readUrlPrefill(), []);
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem('hns-dane-language');
    return isLanguageCode(saved) ? saved : 'en';
  });
  const [domainType, setDomainType] = useState<DomainType>(urlPrefill.domainType);
  const [setupMode, setSetupMode] = useState<SetupMode>(urlPrefill.setupMode);
  const [domainInput, setDomainInput] = useState(urlPrefill.domainInput);
  const [nameserverHost, setNameserverHost] = useState(urlPrefill.nameserverHost);
  const [nameserverIpv4, setNameserverIpv4] = useState(urlPrefill.nameserverIpv4);
  const [nameserverIpv6, setNameserverIpv6] = useState(urlPrefill.nameserverIpv6);
  const [websiteIpv4, setWebsiteIpv4] = useState(urlPrefill.websiteIpv4);
  const [websiteIpv6, setWebsiteIpv6] = useState(urlPrefill.websiteIpv6);
  const [port, setPort] = useState(urlPrefill.port);
  const [pemInput, setPemInput] = useState(urlPrefill.pemInput);
  const [dnskeyInput, setDnskeyInput] = useState(urlPrefill.dnskeyInput);
  const [dnsServerPreset, setDnsServerPreset] = useState<DnsServerPreset>(urlPrefill.dnsServerPreset);
  const [result, setResult] = useState<BootstrapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const interactionScrollY = useRef<number | null>(null);
  const t = localeText[language];

  const input = useMemo<BootstrapInput>(() => ({
    domainType,
    setupMode,
    domainInput,
    nameserverHost,
    nameserverIpv4,
    nameserverIpv6,
    websiteIpv4,
    websiteIpv6,
    port,
    protocol: 'tcp',
    pemInput,
    dnskeyInput,
    ttl: 3600,
    tlsaUsage: 3,
    tlsaSelector: 1,
    tlsaMatchingType: 1,
    dnsServerPreset,
    dsDigestType: 2
  }), [domainType, setupMode, domainInput, nameserverHost, nameserverIpv4, nameserverIpv6, websiteIpv4, websiteIpv6, port, pemInput, dnskeyInput, dnsServerPreset]);

  useEffect(() => {
    if (domainType === 'icann' && setupMode === 'hns-inline') setSetupMode('delegated');
  }, [domainType, setupMode]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('hns-dane-language', language);
  }, [language]);

  useEffect(() => {
    if (!domainInput.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;
    generateBootstrap(input)
      .then((generated) => {
        if (!cancelled) {
          setResult(generated);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult(null);
          setError(err instanceof Error ? err.message : 'Unable to generate records.');
        }
      });
    return () => { cancelled = true; };
  }, [input]);

  function rememberScrollY() {
    if (typeof window !== 'undefined') interactionScrollY.current = window.scrollY;
  }

  function preserveScroll(update: () => void) {
    if (typeof window === 'undefined') {
      update();
      return;
    }

    const top = interactionScrollY.current ?? window.scrollY;
    const left = window.scrollX;

    update();
    interactionScrollY.current = null;

    const restore = () => {
      const maxTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(left, Math.min(top, maxTop));
    };

    window.requestAnimationFrame(() => {
      restore();
      window.requestAnimationFrame(restore);
      window.setTimeout(restore, 80);
    });
  }

  function handleDomainTypeChange(nextDomainType: DomainType) {
    preserveScroll(() => {
      const currentDomain = domainInput.trim();
      const currentNameserver = nameserverHost.trim();

      setDomainType(nextDomainType);
      if (nextDomainType === 'icann') {
        setSetupMode('delegated');
        if (currentDomain === HNS_EXAMPLE_DOMAIN) setDomainInput(ICANN_EXAMPLE_DOMAIN);
        if (currentNameserver === HNS_EXAMPLE_NAMESERVER) setNameserverHost(ICANN_EXAMPLE_NAMESERVER);
        return;
      }

      if (currentDomain === ICANN_EXAMPLE_DOMAIN) setDomainInput(HNS_EXAMPLE_DOMAIN);
      if (currentNameserver === ICANN_EXAMPLE_NAMESERVER) setNameserverHost(HNS_EXAMPLE_NAMESERVER);
    });
  }

  function handleSetupModeChange(nextSetupMode: SetupMode) {
    preserveScroll(() => {
      setSetupMode(nextSetupMode);
    });
  }

  function loadExample(kind: 'hns-delegated' | 'hns-inline' | 'icann') {
    setPemInput('');
    setDnskeyInput('');
    setNameserverHost('');
    setNameserverIpv4('');
    setNameserverIpv6('');
    setWebsiteIpv4('');
    setWebsiteIpv6('');
    if (kind === 'hns-delegated') {
      setDomainType('hns');
      setSetupMode('delegated');
      setDomainInput(HNS_EXAMPLE_DOMAIN);
      setNameserverHost(HNS_EXAMPLE_NAMESERVER);
      setNameserverIpv4(EXAMPLE_NAMESERVER_IPV4);
      setWebsiteIpv4(EXAMPLE_WEBSITE_IPV4);
      setDnsServerPreset('generic-zone');
    }
    if (kind === 'hns-inline') {
      setDomainType('hns');
      setSetupMode('hns-inline');
      setDomainInput(HNS_EXAMPLE_DOMAIN);
      setNameserverIpv4(EXAMPLE_NAMESERVER_IPV4);
      setWebsiteIpv4(EXAMPLE_WEBSITE_IPV4);
      setDnsServerPreset('generic-zone');
    }
    if (kind === 'icann') {
      setDomainType('icann');
      setSetupMode('delegated');
      setDomainInput(ICANN_EXAMPLE_DOMAIN);
      setNameserverHost(ICANN_EXAMPLE_NAMESERVER);
      setNameserverIpv4(EXAMPLE_NAMESERVER_IPV4);
      setWebsiteIpv4(EXAMPLE_WEBSITE_IPV4);
      setDnsServerPreset('bind');
    }
  }

  const displayResult = useMemo(() => result ? localizeBootstrapResult(result, input, language) : null, [input, language, result]);
  const sections = useMemo(() => displayResult?.sections ?? [], [displayResult]);
  const handoffGuidance = useMemo(() => guidanceForIntent(urlPrefill.intent), [urlPrefill.intent]);
  const domainPlaceholder = domainType === 'hns' ? HNS_EXAMPLE_DOMAIN : ICANN_EXAMPLE_DOMAIN;
  const nameserverPlaceholder = domainType === 'hns' ? HNS_EXAMPLE_NAMESERVER : ICANN_EXAMPLE_NAMESERVER;
  const howToContext = useMemo<HowToContext>(() => {
    const fallbackDomain = domainInput.trim() ? ensureRootDot(asciiHost(domainInput.trim())) : '<domain>.';
    const dnskeyZone = result?.normalizedDomain ?? fallbackDomain;
    const certServerName = withoutRootDot(result?.normalizedDomain ?? fallbackDomain);
    const certHost = websiteIpv4.trim() || websiteIpv6.trim() || certServerName;
    const dnskeyQueryServer = nameserverIpv4.trim() || nameserverIpv6.trim() || (nameserverHost.trim() ? ensureRootDot(asciiHost(nameserverHost.trim())) : '<nameserver-or-ip>');

    return {
      certConnectTarget: hostPort(certHost, port || 443),
      certServerName,
      dnskeyQueryServer,
      dnskeyZone
    };
  }, [domainInput, nameserverHost, nameserverIpv4, nameserverIpv6, port, result?.normalizedDomain, websiteIpv4, websiteIpv6]);

  return (
    <main>
      <header className="hero">
        <div className="hero-top">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <label className="language-select">
            <span>{t.languageLabel}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as LanguageCode)}>
              {languageOptions.map((option) => (
                <option value={option.code} key={option.code}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <h1>{t.hero.title}</h1>
        <p className="hero-standard">
          ({t.hero.standard}) <a href="https://www.rfc-editor.org/info/rfc6698/">RFC 6698</a>
        </p>
        <ul className="hero-steps">
          <li>{t.hero.steps.enter}</li>
          <li>{t.hero.steps.send}</li>
          <li>{t.hero.steps.zone}</li>
          <li>{t.hero.steps.done}</li>
        </ul>
        <div className="example-row">
          <button type="button" onClick={() => loadExample('hns-delegated')}>{t.examples.hnsDelegated}</button>
          <button type="button" onClick={() => loadExample('hns-inline')}>{t.examples.hnsInline}</button>
          <button type="button" onClick={() => loadExample('icann')}>{t.examples.icann}</button>
        </div>
      </header>

      <HandoffCard guidance={handoffGuidance} />

      <section className="panel grid">
        <div className="form-card">
          <h2>{t.sections.domain}</h2>
          <Field label={t.fields.domainType} help={t.fields.domainTypeHelp}>
            <select
              value={domainType}
              onFocus={rememberScrollY}
              onPointerDown={rememberScrollY}
              onKeyDown={rememberScrollY}
              onChange={(event) => handleDomainTypeChange(event.target.value as DomainType)}
            >
              <option value="hns">{t.options.hns}</option>
              <option value="icann">{t.options.icann}</option>
            </select>
          </Field>
          <Field label={t.fields.setupMode} help={t.fields.setupModeHelp}>
            <select
              value={setupMode}
              onFocus={rememberScrollY}
              onPointerDown={rememberScrollY}
              onKeyDown={rememberScrollY}
              onChange={(event) => handleSetupModeChange(event.target.value as SetupMode)}
            >
              <option value="delegated">{t.options.delegated}</option>
              <option value="hns-inline" disabled={domainType !== 'hns'}>{t.options.hnsInline}</option>
            </select>
          </Field>
          <Field label={t.fields.domain} help={t.fields.domainHelp}>
            <input value={domainInput} onChange={(event) => setDomainInput(event.target.value)} placeholder={domainPlaceholder} autoComplete="off" />
          </Field>
        </div>

        <div className="form-card">
          <h2>{t.sections.server}</h2>
          <Field label={t.fields.dnsServerPreset} help={t.fields.dnsServerPresetHelp}>
            <select value={dnsServerPreset} onChange={(event) => setDnsServerPreset(event.target.value as DnsServerPreset)}>
              <option value="generic-zone">{t.options.genericZone}</option>
              <option value="hosted-dns">{t.options.hostedDns}</option>
              <option value="powerdns">{t.options.powerdns}</option>
              <option value="knot">{t.options.knot}</option>
              <option value="bind">{t.options.bind}</option>
              <option value="nsd">{t.options.nsd}</option>
            </select>
          </Field>
          {setupMode !== 'hns-inline' && (
            <Field label={t.fields.nameserverHost} help={t.fields.nameserverHostHelp}>
              <input value={nameserverHost} onChange={(event) => setNameserverHost(event.target.value)} placeholder={nameserverPlaceholder} autoComplete="off" />
            </Field>
          )}
          <Field label={t.fields.nameserverIpv4} help={t.fields.nameserverIpv4Help}>
            <input value={nameserverIpv4} onChange={(event) => setNameserverIpv4(event.target.value)} placeholder={EXAMPLE_NAMESERVER_IPV4} autoComplete="off" />
          </Field>
          <Field label={t.fields.nameserverIpv6} help={t.fields.nameserverIpv6Help}>
            <input value={nameserverIpv6} onChange={(event) => setNameserverIpv6(event.target.value)} autoComplete="off" />
          </Field>
          <Field label={t.fields.websiteIpv4} help={t.fields.websiteIpv4Help}>
            <input value={websiteIpv4} onChange={(event) => setWebsiteIpv4(event.target.value)} placeholder={EXAMPLE_WEBSITE_IPV4} autoComplete="off" />
          </Field>
          <Field label={t.fields.websiteIpv6} help={t.fields.websiteIpv6Help}>
            <input value={websiteIpv6} onChange={(event) => setWebsiteIpv6(event.target.value)} autoComplete="off" />
          </Field>
        </div>

        <div className="form-card">
          <h2>{t.sections.dane}</h2>
          <Field label={t.fields.port} help={t.fields.portHelp}>
            <input type="number" min="1" max="65535" value={port} onChange={(event) => setPort(Number(event.target.value))} />
          </Field>
          <Field label={t.fields.certificate} help={t.fields.certificateHelp}>
            <textarea rows={7} value={pemInput} onChange={(event) => setPemInput(event.target.value)} placeholder={CERTIFICATE_PLACEHOLDER} />
            <CertificateHowTo context={howToContext} t={t} />
          </Field>
          <Field label={t.fields.dnskey} help={t.fields.dnskeyHelp}>
            <textarea rows={4} value={dnskeyInput} onChange={(event) => setDnskeyInput(event.target.value)} placeholder={`${howToContext.dnskeyZone} 3600 IN DNSKEY 257 3 13 ...`} />
            <DnskeyHowTo context={howToContext} t={t} />
          </Field>
        </div>
      </section>

      {error && <section className="error-card">{error}</section>}

      {displayResult && (
        <section className="outputs">
          <SetupSummary result={displayResult} t={t} />
          <StatusList checks={displayResult.statusChecks} t={t} />
          <Notices
            notices={displayResult.notices}
            hasHelp={!pemInput.trim() || !dnskeyInput.trim()}
            t={t}
          >
            {!pemInput.trim() && (
              <li className="info">
                <CertificateHowTo
                  attention
                  context={howToContext}
                  summaryLabel={`${t.fields.certificate} - ${t.howTo.summary}`}
                  t={t}
                />
              </li>
            )}
            {!dnskeyInput.trim() && (
              <li className="info">
                <DnskeyHowTo
                  attention
                  context={howToContext}
                  summaryLabel={`${t.fields.dnskey} - ${t.howTo.summary}`}
                  t={t}
                />
              </li>
            )}
          </Notices>

          {sections.map((section) => <OutputBox key={section.id} section={section} result={displayResult} t={t} />)}

          <section className="tips-card">
            <h2>{t.faq.title}</h2>
            <details open>
              <summary>{t.faq.presetSummary}</summary>
              <p>{t.faq.presetBody}</p>
            </details>
            <details>
              <summary>{t.faq.splitSummary}</summary>
              <p>{t.faq.splitBody}</p>
            </details>
            <details>
              <summary>{t.faq.dnskeySummary}</summary>
              <p>{t.faq.dnskeyBody}</p>
            </details>
            <details>
              <summary>{t.faq.idnSummary}</summary>
              <p>{t.faq.idnBody}</p>
            </details>
            <details>
              <summary>{t.faq.hostedSummary}</summary>
              <p>{t.faq.hostedBody}</p>
            </details>
            {displayResult.helpTips.map((tip) => (
              <details key={tip}>
                <summary>{tip.slice(0, 90)}{tip.length > 90 ? '…' : ''}</summary>
                <p>{tip}</p>
              </details>
            ))}
          </section>
        </section>
      )}

      <footer className="site-footer">
        <span>Donation:</span>
        <a href={DONATION_URI}>{DONATION_ADDRESS}</a>
        <span>GitHub:</span>
        <a href={GITHUB_REPOSITORY_URL}>denuoweb/dane-record-generator</a>
      </footer>
    </main>
  );
}

export default App;
