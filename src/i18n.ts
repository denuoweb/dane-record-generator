export const localeText = {
  en: {
    languageName: 'English',
    languageLabel: 'Language',
    hero: {
      eyebrow: 'Need the HNS wallet, registrar, DNSSEC, and TLSA records?',
      title: 'DANE Record Generator',
      standard: 'DNS-based Authentication of Named Entities',
      steps: {
        enter: 'Enter the name, nameserver, server IP, and certificate here.',
        send: 'Send the generated records to your HNS wallet or registrar.',
        zone: 'Copy the zone records onto the authoritative DNS server.',
        done: 'Publish DNSSEC and TLSA so the DANE website can serve.'
      }
    },
    examples: {
      hnsDelegated: 'HNS delegated',
      hnsInline: 'HNS SYNTH nameserver',
      icann: 'ICANN DNSSEC'
    },
    sections: {
      domain: '1. Domain',
      server: '2. Server',
      dane: '3. DANE'
    },
    fields: {
      domainType: 'Domain type',
      domainTypeHelp: 'HNS means wallet/name resource. ICANN means registrar panel.',
      setupMode: 'Setup mode',
      setupModeHelp: 'Named mode uses a nameserver hostname. SYNTH mode stores nameserver IPs in HNS; both still use authoritative DNS.',
      domain: 'Domain',
      domainHelp: 'Examples: example/ or example.com',
      dnsServerPreset: 'DNS server preset',
      dnsServerPresetHelp: 'This changes the copy-paste server example, not the DNS meaning.',
      nameserverHost: 'Nameserver hostname',
      nameserverHostHelp: 'Use ns1.yourname. if this server belongs under the same name. That requires glue.',
      nameserverIpv4: 'Nameserver IPv4',
      nameserverIpv4Help: 'The public IPv4 address of the authoritative DNS server.',
      nameserverIpv6: 'Nameserver IPv6 (optional)',
      nameserverIpv6Help: 'Optional IPv6 glue/address for the DNS server.',
      websiteIpv4: 'Website IPv4',
      websiteIpv4Help: 'The public IPv4 address of the web server at the domain apex.',
      websiteIpv6: 'Website IPv6 (optional)',
      websiteIpv6Help: 'Optional AAAA record for the web server.',
      port: 'HTTPS port',
      portHelp: '443 is the default for normal HTTPS. Change it only if the TLS service uses another port.',
      certificate: 'Certificate or PUBLIC KEY',
      certificateHelp: 'Paste the leaf certificate or PEM PUBLIC KEY. Private keys are not needed.',
      dnskey: 'DNSKEY',
      dnskeyHelp: 'After DNSSEC signing is enabled on the DNS server, paste the zone DNSKEY here to generate DS.'
    },
    options: {
      hns: 'Handshake / HNS',
      icann: 'ICANN / normal DNS',
      delegated: 'Delegated authoritative DNS',
      hnsInline: 'HNS SYNTH nameserver',
      genericZone: 'Generic zone file',
      hostedDns: 'Hosted DNS provider panel',
      powerdns: 'PowerDNS Authoritative',
      knot: 'Knot DNS',
      bind: 'BIND 9',
      nsd: 'NSD'
    },
    howTo: {
      summary: 'How to get this',
      certIntro: 'Paste the public certificate your HTTPS server serves for this exact name, or paste the matching PEM PUBLIC KEY. Do not paste a private key.',
      certFetch: 'If you have shell access, fetch the leaf certificate from the live service:',
      certFile: 'If you already have a certificate file, paste the block from BEGIN CERTIFICATE through END CERTIFICATE. To paste only the public key from a certificate file, run:',
      dnskeyIntro: 'First enable DNSSEC signing on the authoritative DNS zone. The DNS server or hosted DNS provider creates the public DNSKEY; this app uses that public record to generate the parent-side DS record.',
      dnskeyHosted: 'In a hosted DNS panel, look for DNSSEC, DS, or DNSKEY settings. If the provider gives you a DS record directly, you can publish that DS at the wallet or registrar without pasting DNSKEY here.',
      dnskeyQuery: 'If your authoritative server is already answering, query the public DNSKEY and paste the DNSKEY line for the zone, usually the key-signing key with flags 257:'
    },
    copy: {
      copy: 'Copy',
      copied: 'Copied',
      nothing: '# Nothing generated yet'
    },
    status: {
      title: 'Setup status',
      ok: 'OK',
      warn: 'Check',
      missing: 'Needed',
      labels: {
        Domain: 'Domain',
        'Website IP': 'Website IP',
        'HNS inline': 'HNS SYNTH',
        DANE: 'DANE',
        Nameserver: 'Nameserver',
        Glue: 'Glue',
        DS: 'DS',
        TLSA: 'TLSA'
      }
    },
    notices: {
      title: 'Needs attention'
    },
    summary: {
      aria: 'current setup summary',
      hnsInline: 'HNS SYNTH nameserver',
      delegated: 'Delegated DNSSEC + DANE',
      glueRequired: 'Glue required',
      externalNameserver: 'External nameserver',
      dsReady: 'DS ready',
      dsPlaceholder: 'DS placeholder',
      tlsaReady: 'TLSA ready',
      tlsaPlaceholder: 'TLSA placeholder'
    },
    output: {
      parentHns: 'Put this in your HNS wallet / name resource',
      parentIcann: 'Put this at your registrar / parent zone',
      authoritative: 'Put this on your authoritative DNS server',
      steps: 'Do these steps',
      verify: 'Verify with these commands',
      web: 'Web server note',
      integrator: 'Integrator JSON',
      server: 'Server preset',
      audiences: {
        parent: 'parent',
        authoritative: 'authoritative',
        server: 'server',
        web: 'web',
        verify: 'verify',
        integrator: 'integrator'
      }
    },
    faq: {
      title: 'Help tips',
      presetSummary: 'Which preset should I pick?',
      presetBody: 'Use Hosted DNS if your provider supports DNSSEC and TLSA records. Use Generic zone file when you are adapting records into BIND, Knot, NSD, or another server. Use PowerDNS when you want database or API-backed DNS.',
      splitSummary: 'What goes in the wallet versus the DNS server?',
      splitBody: 'The wallet or registrar gets NS/GLUE or SYNTH, plus DS. The authoritative DNS server gets NS/A/AAAA/TLSA and signs the zone. TLSA is a DNS-server record, not a wallet record.',
      dnskeySummary: 'When do I paste the DNSKEY?',
      dnskeyBody: 'Paste DNSKEY after the authoritative zone is DNSSEC-signed. This page uses it to generate the parent-side DS record; it does not sign the zone or store private DNSSEC keys.',
      idnSummary: 'Can I use an internationalized domain name?',
      idnBody: 'Yes. Unicode domain input is converted to IDNA ASCII A-labels such as xn--bcher-kva.example. Use the A-label form in DNS records, wallet fields, registrar fields, and server configs.',
      hostedSummary: 'What must a hosted DNS provider support?',
      hostedBody: 'The provider needs authoritative DNS hosting, DNSSEC signing, DS or DNSKEY export, and custom TLSA records. If any of those are missing, use your own authoritative server preset instead.'
    }
  },
  es: {
    languageName: 'Español',
    languageLabel: 'Idioma',
    hero: {
      eyebrow: '¿Necesitas registros HNS, registrador, DNSSEC y TLSA?',
      title: 'Generador de registros DANE',
      standard: 'Autenticación basada en DNS de entidades nombradas',
      steps: {
        enter: 'Introduce aquí el nombre, el servidor de nombres, la IP del servidor y el certificado.',
        send: 'Envía los registros generados a tu cartera HNS o registrador.',
        zone: 'Copia los registros de zona en el servidor DNS autoritativo.',
        done: 'Publica DNSSEC y TLSA para que el sitio DANE pueda servir.'
      }
    },
    examples: { hnsDelegated: 'HNS delegado', hnsInline: 'Nameserver SYNTH HNS', icann: 'DNSSEC ICANN' },
    sections: { domain: '1. Dominio', server: '2. Servidor', dane: '3. DANE' },
    fields: {
      domainType: 'Tipo de dominio',
      domainTypeHelp: 'HNS significa cartera/recurso de nombre. ICANN significa panel del registrador.',
      setupMode: 'Modo de configuración',
      setupModeHelp: 'El modo con nombre usa un hostname de nameserver. SYNTH guarda IPs de nameserver en HNS; ambos usan DNS autoritativo.',
      domain: 'Dominio',
      domainHelp: 'Ejemplos: example/ o example.com',
      dnsServerPreset: 'Plantilla de servidor DNS',
      dnsServerPresetHelp: 'Cambia el ejemplo para copiar y pegar, no el significado DNS.',
      nameserverHost: 'Nombre del servidor DNS',
      nameserverHostHelp: 'Usa ns1.tunombre. si este servidor está dentro del mismo nombre. Eso requiere glue.',
      nameserverIpv4: 'IPv4 del servidor DNS',
      nameserverIpv4Help: 'La IPv4 pública del servidor DNS autoritativo.',
      nameserverIpv6: 'IPv6 del servidor DNS (opcional)',
      nameserverIpv6Help: 'Glue/dirección IPv6 opcional para el servidor DNS.',
      websiteIpv4: 'IPv4 del sitio web',
      websiteIpv4Help: 'La IPv4 pública del servidor web en el apex del dominio.',
      websiteIpv6: 'IPv6 del sitio web (opcional)',
      websiteIpv6Help: 'Registro AAAA opcional para el servidor web.',
      port: 'Puerto HTTPS',
      portHelp: '443 es el valor predeterminado para HTTPS normal. Cámbialo solo si el servicio TLS usa otro puerto.',
      certificate: 'Certificado o PUBLIC KEY',
      certificateHelp: 'Pega el certificado de hoja o una PUBLIC KEY en PEM. No se necesitan claves privadas.',
      dnskey: 'DNSKEY',
      dnskeyHelp: 'Después de activar la firma DNSSEC en el servidor DNS, pega aquí la DNSKEY de la zona para generar DS.'
    },
    options: {
      hns: 'Handshake / HNS',
      icann: 'ICANN / DNS normal',
      delegated: 'DNS autoritativo delegado',
      hnsInline: 'Nameserver SYNTH HNS',
      genericZone: 'Archivo de zona genérico',
      hostedDns: 'Panel de proveedor DNS alojado',
      powerdns: 'PowerDNS Authoritative',
      knot: 'Knot DNS',
      bind: 'BIND 9',
      nsd: 'NSD'
    },
    howTo: {
      summary: 'Cómo obtener esto',
      certIntro: 'Pega el certificado público que tu servidor HTTPS entrega para este nombre exacto, o pega la PUBLIC KEY en PEM correspondiente. No pegues una clave privada.',
      certFetch: 'Si tienes acceso de shell, obtén el certificado de hoja desde el servicio activo:',
      certFile: 'Si ya tienes un archivo de certificado, pega el bloque desde BEGIN CERTIFICATE hasta END CERTIFICATE. Para pegar solo la clave pública desde un certificado, ejecuta:',
      dnskeyIntro: 'Primero activa la firma DNSSEC en la zona DNS autoritativa. El servidor DNS o proveedor alojado crea la DNSKEY pública; esta app usa ese registro público para generar el DS del padre.',
      dnskeyHosted: 'En un panel DNS alojado, busca opciones DNSSEC, DS o DNSKEY. Si el proveedor te da directamente un registro DS, puedes publicarlo en la cartera o registrador sin pegar DNSKEY aquí.',
      dnskeyQuery: 'Si tu servidor autoritativo ya responde, consulta la DNSKEY pública y pega la línea DNSKEY de la zona, normalmente la clave de firma con flags 257:'
    },
    copy: { copy: 'Copiar', copied: 'Copiado', nothing: '# Aún no se generó nada' },
    status: {
      title: 'Estado de configuración',
      ok: 'OK',
      warn: 'Revisar',
      missing: 'Falta',
      labels: { Domain: 'Dominio', 'Website IP': 'IP web', 'HNS inline': 'HNS SYNTH', DANE: 'DANE', Nameserver: 'Servidor DNS', Glue: 'Glue', DS: 'DS', TLSA: 'TLSA' }
    },
    notices: { title: 'Necesita atención' },
    summary: {
      aria: 'resumen de la configuración actual',
      hnsInline: 'Nameserver SYNTH HNS',
      delegated: 'DNSSEC + DANE delegado',
      glueRequired: 'Glue requerido',
      externalNameserver: 'Servidor DNS externo',
      dsReady: 'DS listo',
      dsPlaceholder: 'DS pendiente',
      tlsaReady: 'TLSA listo',
      tlsaPlaceholder: 'TLSA pendiente'
    },
    output: {
      parentHns: 'Pon esto en tu cartera HNS / recurso de nombre',
      parentIcann: 'Pon esto en tu registrador / zona padre',
      authoritative: 'Pon esto en tu servidor DNS autoritativo',
      steps: 'Sigue estos pasos',
      verify: 'Verifica con estos comandos',
      web: 'Nota del servidor web',
      integrator: 'JSON de integración',
      server: 'Plantilla de servidor',
      audiences: { parent: 'padre', authoritative: 'autoritativo', server: 'servidor', web: 'web', verify: 'verificar', integrator: 'integrador' }
    },
    faq: {
      title: 'Ayuda',
      presetSummary: '¿Qué plantilla debería elegir?',
      presetBody: 'Usa DNS alojado si tu proveedor admite DNSSEC y registros TLSA. Usa archivo de zona genérico si adaptarás registros a BIND, Knot, NSD u otro servidor. Usa PowerDNS si quieres DNS con base de datos o API.',
      splitSummary: '¿Qué va en la cartera o registrador frente al servidor DNS?',
      splitBody: 'La cartera o registrador recibe NS/GLUE o SYNTH, más DS. El servidor DNS autoritativo recibe NS/A/AAAA/TLSA y firma la zona. TLSA es un registro del servidor DNS, no de la cartera.',
      dnskeySummary: '¿Cuándo pego la DNSKEY?',
      dnskeyBody: 'Pega DNSKEY después de que la zona autoritativa esté firmada con DNSSEC. Esta página la usa para generar el registro DS del padre; no firma la zona ni guarda claves DNSSEC privadas.',
      idnSummary: '¿Puedo usar un dominio internacionalizado?',
      idnBody: 'Sí. La entrada Unicode se convierte a etiquetas ASCII IDNA como xn--bcher-kva.example. Usa la forma A-label en registros DNS, cartera, registrador y configs del servidor.',
      hostedSummary: '¿Qué debe admitir un proveedor DNS alojado?',
      hostedBody: 'El proveedor necesita DNS autoritativo, firma DNSSEC, exportación de DS o DNSKEY y registros TLSA personalizados. Si falta algo, usa una plantilla para tu propio servidor autoritativo.'
    }
  },
  fr: {
    languageName: 'Français',
    languageLabel: 'Langue',
    hero: {
      eyebrow: 'Besoin des enregistrements HNS, registrar, DNSSEC et TLSA ?',
      title: 'Générateur d’enregistrements DANE',
      standard: 'Authentification DNS des entités nommées',
      steps: {
        enter: 'Saisissez ici le nom, le serveur de noms, l’adresse IP du serveur et le certificat.',
        send: 'Envoyez les enregistrements générés à votre wallet HNS ou à votre bureau d’enregistrement.',
        zone: 'Copiez les enregistrements de zone sur le serveur DNS faisant autorité.',
        done: 'Publiez DNSSEC et TLSA afin que le site DANE puisse servir.'
      }
    },
    examples: { hnsDelegated: 'HNS délégué', hnsInline: 'Nameserver SYNTH HNS', icann: 'DNSSEC ICANN' },
    sections: { domain: '1. Domaine', server: '2. Serveur', dane: '3. DANE' },
    fields: {
      domainType: 'Type de domaine',
      domainTypeHelp: 'HNS signifie wallet/ressource de nom. ICANN signifie panneau du bureau d’enregistrement.',
      setupMode: 'Mode de configuration',
      setupModeHelp: 'Le mode nommé utilise un nom de serveur. Le mode SYNTH stocke les IPs des serveurs de noms dans HNS; les deux utilisent un DNS faisant autorité.',
      domain: 'Domaine',
      domainHelp: 'Exemples : example/ ou example.com',
      dnsServerPreset: 'Modèle de serveur DNS',
      dnsServerPresetHelp: 'Cela change l’exemple à copier-coller, pas le sens DNS.',
      nameserverHost: 'Nom du serveur de noms',
      nameserverHostHelp: 'Utilisez ns1.votrenom. si ce serveur est sous le même nom. Cela nécessite de la glue.',
      nameserverIpv4: 'IPv4 du serveur de noms',
      nameserverIpv4Help: 'L’adresse IPv4 publique du serveur DNS faisant autorité.',
      nameserverIpv6: 'IPv6 du serveur de noms (facultatif)',
      nameserverIpv6Help: 'Glue/adresse IPv6 facultative pour le serveur DNS.',
      websiteIpv4: 'IPv4 du site web',
      websiteIpv4Help: 'L’adresse IPv4 publique du serveur web à l’apex du domaine.',
      websiteIpv6: 'IPv6 du site web (facultatif)',
      websiteIpv6Help: 'Enregistrement AAAA facultatif pour le serveur web.',
      port: 'Port HTTPS',
      portHelp: '443 est la valeur par défaut pour HTTPS normal. Changez-le seulement si le service TLS utilise un autre port.',
      certificate: 'Certificat ou PUBLIC KEY',
      certificateHelp: 'Collez le certificat feuille ou une PUBLIC KEY PEM. Les clés privées ne sont pas nécessaires.',
      dnskey: 'DNSKEY',
      dnskeyHelp: 'Après avoir activé la signature DNSSEC sur le serveur DNS, collez ici la DNSKEY de la zone pour générer DS.'
    },
    options: {
      hns: 'Handshake / HNS',
      icann: 'ICANN / DNS normal',
      delegated: 'DNS faisant autorité délégué',
      hnsInline: 'Nameserver SYNTH HNS',
      genericZone: 'Fichier de zone générique',
      hostedDns: 'Panneau DNS hébergé',
      powerdns: 'PowerDNS Authoritative',
      knot: 'Knot DNS',
      bind: 'BIND 9',
      nsd: 'NSD'
    },
    howTo: {
      summary: 'Comment l’obtenir',
      certIntro: 'Collez le certificat public que votre serveur HTTPS sert pour ce nom exact, ou collez la PUBLIC KEY PEM correspondante. Ne collez pas de clé privée.',
      certFetch: 'Si vous avez un accès shell, récupérez le certificat feuille depuis le service actif :',
      certFile: 'Si vous avez déjà un fichier de certificat, collez le bloc de BEGIN CERTIFICATE à END CERTIFICATE. Pour coller seulement la clé publique depuis un certificat, exécutez :',
      dnskeyIntro: 'Activez d’abord la signature DNSSEC sur la zone DNS faisant autorité. Le serveur DNS ou le fournisseur hébergé crée la DNSKEY publique ; cette app utilise cet enregistrement public pour générer le DS parent.',
      dnskeyHosted: 'Dans un panneau DNS hébergé, cherchez les réglages DNSSEC, DS ou DNSKEY. Si le fournisseur donne directement un DS, publiez ce DS dans le wallet ou le bureau d’enregistrement sans coller DNSKEY ici.',
      dnskeyQuery: 'Si votre serveur faisant autorité répond déjà, interrogez la DNSKEY publique et collez la ligne DNSKEY de la zone, généralement la clé de signature avec flags 257 :'
    },
    copy: { copy: 'Copier', copied: 'Copié', nothing: '# Rien généré pour le moment' },
    status: {
      title: 'État de configuration',
      ok: 'OK',
      warn: 'Vérifier',
      missing: 'Requis',
      labels: { Domain: 'Domaine', 'Website IP': 'IP web', 'HNS inline': 'HNS SYNTH', DANE: 'DANE', Nameserver: 'Serveur de noms', Glue: 'Glue', DS: 'DS', TLSA: 'TLSA' }
    },
    notices: { title: 'À vérifier' },
    summary: {
      aria: 'résumé de la configuration actuelle',
      hnsInline: 'Nameserver SYNTH HNS',
      delegated: 'DNSSEC + DANE délégué',
      glueRequired: 'Glue requise',
      externalNameserver: 'Serveur de noms externe',
      dsReady: 'DS prêt',
      dsPlaceholder: 'DS à compléter',
      tlsaReady: 'TLSA prêt',
      tlsaPlaceholder: 'TLSA à compléter'
    },
    output: {
      parentHns: 'À mettre dans votre wallet HNS / ressource de nom',
      parentIcann: 'À mettre chez votre bureau d’enregistrement / zone parente',
      authoritative: 'À mettre sur votre serveur DNS faisant autorité',
      steps: 'Étapes à suivre',
      verify: 'Vérifier avec ces commandes',
      web: 'Note serveur web',
      integrator: 'JSON intégrateur',
      server: 'Modèle serveur',
      audiences: { parent: 'parent', authoritative: 'autorité', server: 'serveur', web: 'web', verify: 'vérifier', integrator: 'intégrateur' }
    },
    faq: {
      title: 'Aide',
      presetSummary: 'Quel modèle choisir ?',
      presetBody: 'Utilisez DNS hébergé si votre fournisseur prend en charge DNSSEC et TLSA. Utilisez le fichier de zone générique pour adapter les enregistrements à BIND, Knot, NSD ou un autre serveur. Utilisez PowerDNS pour un DNS avec base de données ou API.',
      splitSummary: 'Que va dans le wallet ou le bureau d’enregistrement, et que va sur le serveur DNS ?',
      splitBody: 'Le wallet ou le bureau d’enregistrement reçoit NS/GLUE ou SYNTH, plus DS. Le serveur DNS faisant autorité reçoit NS/A/AAAA/TLSA et signe la zone. TLSA est un enregistrement du serveur DNS, pas du wallet.',
      dnskeySummary: 'Quand coller la DNSKEY ?',
      dnskeyBody: 'Collez DNSKEY après la signature DNSSEC de la zone faisant autorité. Cette page l’utilise pour générer le DS parent ; elle ne signe pas la zone et ne stocke pas de clés DNSSEC privées.',
      idnSummary: 'Puis-je utiliser un nom de domaine internationalisé ?',
      idnBody: 'Oui. Le domaine Unicode est converti en A-label ASCII IDNA comme xn--bcher-kva.example. Utilisez cette forme dans les enregistrements DNS, le wallet, le bureau d’enregistrement et les configs serveur.',
      hostedSummary: 'Que doit prendre en charge un fournisseur DNS hébergé ?',
      hostedBody: 'Le fournisseur doit offrir DNS faisant autorité, signature DNSSEC, export DS ou DNSKEY, et enregistrements TLSA personnalisés. Sinon, utilisez votre propre serveur faisant autorité.'
    }
  },
  de: {
    languageName: 'Deutsch',
    languageLabel: 'Sprache',
    hero: {
      eyebrow: 'Brauchen Sie HNS-, Registrar-, DNSSEC- und TLSA-Einträge?',
      title: 'DANE-Record-Generator',
      standard: 'DNS-basierte Authentifizierung benannter Entitäten',
      steps: {
        enter: 'Geben Sie hier Namen, Nameserver, Server-IP und Zertifikat ein.',
        send: 'Senden Sie die erzeugten Einträge an Ihr HNS-Wallet oder Ihren Registrar.',
        zone: 'Kopieren Sie die Zoneneinträge auf den autoritativen DNS-Server.',
        done: 'Veröffentlichen Sie DNSSEC und TLSA, damit die DANE-Website ausgeliefert werden kann.'
      }
    },
    examples: { hnsDelegated: 'HNS delegiert', hnsInline: 'HNS SYNTH-Nameserver', icann: 'ICANN DNSSEC' },
    sections: { domain: '1. Domain', server: '2. Server', dane: '3. DANE' },
    fields: {
      domainType: 'Domaintyp',
      domainTypeHelp: 'HNS bedeutet Wallet/Namensressource. ICANN bedeutet Registrar-Panel.',
      setupMode: 'Einrichtungsmodus',
      setupModeHelp: 'Benannter Modus nutzt einen Nameserver-Hostnamen. SYNTH speichert Nameserver-IPs in HNS; beide nutzen autoritatives DNS.',
      domain: 'Domain',
      domainHelp: 'Beispiele: example/ oder example.com',
      dnsServerPreset: 'DNS-Server-Vorlage',
      dnsServerPresetHelp: 'Ändert das Copy-Paste-Beispiel, nicht die DNS-Bedeutung.',
      nameserverHost: 'Nameserver-Hostname',
      nameserverHostHelp: 'Nutzen Sie ns1.ihrname., wenn dieser Server unter demselben Namen liegt. Das erfordert Glue.',
      nameserverIpv4: 'Nameserver IPv4',
      nameserverIpv4Help: 'Die öffentliche IPv4-Adresse des autoritativen DNS-Servers.',
      nameserverIpv6: 'Nameserver IPv6 (optional)',
      nameserverIpv6Help: 'Optionale IPv6-Glue/Adresse für den DNS-Server.',
      websiteIpv4: 'Website IPv4',
      websiteIpv4Help: 'Die öffentliche IPv4-Adresse des Webservers am Domain-Apex.',
      websiteIpv6: 'Website IPv6 (optional)',
      websiteIpv6Help: 'Optionaler AAAA-Eintrag für den Webserver.',
      port: 'HTTPS-Port',
      portHelp: '443 ist der Standard für normales HTTPS. Ändern Sie ihn nur, wenn der TLS-Dienst einen anderen Port nutzt.',
      certificate: 'Zertifikat oder PUBLIC KEY',
      certificateHelp: 'Fügen Sie das Leaf-Zertifikat oder einen PEM PUBLIC KEY ein. Private Schlüssel werden nicht benötigt.',
      dnskey: 'DNSKEY',
      dnskeyHelp: 'Aktivieren Sie DNSSEC-Signierung auf dem DNS-Server und fügen Sie dann die Zone-DNSKEY ein, um DS zu erzeugen.'
    },
    options: {
      hns: 'Handshake / HNS',
      icann: 'ICANN / normales DNS',
      delegated: 'Delegiertes autoritatives DNS',
      hnsInline: 'HNS SYNTH-Nameserver',
      genericZone: 'Generische Zonendatei',
      hostedDns: 'Hosted-DNS-Provider-Panel',
      powerdns: 'PowerDNS Authoritative',
      knot: 'Knot DNS',
      bind: 'BIND 9',
      nsd: 'NSD'
    },
    howTo: {
      summary: 'So bekommen Sie das',
      certIntro: 'Fügen Sie das öffentliche Zertifikat ein, das Ihr HTTPS-Server für genau diesen Namen ausliefert, oder den passenden PEM PUBLIC KEY. Fügen Sie keinen privaten Schlüssel ein.',
      certFetch: 'Wenn Sie Shell-Zugriff haben, holen Sie das Leaf-Zertifikat vom Live-Dienst:',
      certFile: 'Wenn Sie bereits eine Zertifikatsdatei haben, fügen Sie den Block von BEGIN CERTIFICATE bis END CERTIFICATE ein. Nur den Public Key extrahieren Sie so:',
      dnskeyIntro: 'Aktivieren Sie zuerst DNSSEC-Signierung auf der autoritativen DNS-Zone. DNS-Server oder Hosted-DNS-Provider erstellt die öffentliche DNSKEY; diese App erzeugt daraus den Parent-DS.',
      dnskeyHosted: 'Suchen Sie im Hosted-DNS-Panel nach DNSSEC-, DS- oder DNSKEY-Einstellungen. Wenn der Provider direkt einen DS liefert, können Sie diesen ohne DNSKEY hier bei Wallet oder Registrar veröffentlichen.',
      dnskeyQuery: 'Wenn Ihr autoritativer Server bereits antwortet, fragen Sie die öffentliche DNSKEY ab und fügen Sie die DNSKEY-Zeile der Zone ein, meist den Key-Signing-Key mit Flags 257:'
    },
    copy: { copy: 'Kopieren', copied: 'Kopiert', nothing: '# Noch nichts erzeugt' },
    status: {
      title: 'Einrichtungsstatus',
      ok: 'OK',
      warn: 'Prüfen',
      missing: 'Fehlt',
      labels: { Domain: 'Domain', 'Website IP': 'Website-IP', 'HNS inline': 'HNS SYNTH', DANE: 'DANE', Nameserver: 'Nameserver', Glue: 'Glue', DS: 'DS', TLSA: 'TLSA' }
    },
    notices: { title: 'Benötigt Aufmerksamkeit' },
    summary: {
      aria: 'Zusammenfassung der aktuellen Einrichtung',
      hnsInline: 'HNS SYNTH-Nameserver',
      delegated: 'Delegiertes DNSSEC + DANE',
      glueRequired: 'Glue erforderlich',
      externalNameserver: 'Externer Nameserver',
      dsReady: 'DS bereit',
      dsPlaceholder: 'DS Platzhalter',
      tlsaReady: 'TLSA bereit',
      tlsaPlaceholder: 'TLSA Platzhalter'
    },
    output: {
      parentHns: 'In Ihr HNS-Wallet / Ihre Namensressource eintragen',
      parentIcann: 'Beim Registrar / in der Parent-Zone eintragen',
      authoritative: 'Auf Ihrem autoritativen DNS-Server eintragen',
      steps: 'Diese Schritte ausführen',
      verify: 'Mit diesen Befehlen prüfen',
      web: 'Webserver-Hinweis',
      integrator: 'Integrator-JSON',
      server: 'Server-Vorlage',
      audiences: { parent: 'parent', authoritative: 'autoritativ', server: 'server', web: 'web', verify: 'prüfen', integrator: 'integrator' }
    },
    faq: {
      title: 'Hilfen',
      presetSummary: 'Welche Vorlage sollte ich wählen?',
      presetBody: 'Nutzen Sie Hosted DNS, wenn Ihr Provider DNSSEC und TLSA unterstützt. Nutzen Sie die generische Zonendatei für BIND, Knot, NSD oder andere Server. Nutzen Sie PowerDNS für datenbank- oder API-basiertes DNS.',
      splitSummary: 'Was gehört in Wallet/Registrar und was auf den DNS-Server?',
      splitBody: 'Wallet oder Registrar erhalten NS/GLUE oder SYNTH plus DS. Der autoritative DNS-Server erhält NS/A/AAAA/TLSA und signiert die Zone. TLSA ist ein DNS-Server-Eintrag, kein Wallet-Eintrag.',
      dnskeySummary: 'Wann füge ich DNSKEY ein?',
      dnskeyBody: 'Fügen Sie DNSKEY ein, nachdem die autoritative Zone mit DNSSEC signiert ist. Diese Seite erzeugt daraus den Parent-DS; sie signiert keine Zone und speichert keine privaten DNSSEC-Schlüssel.',
      idnSummary: 'Kann ich einen internationalisierten Domainnamen nutzen?',
      idnBody: 'Ja. Unicode-Domain-Eingaben werden in IDNA-ASCII-A-Labels wie xn--bcher-kva.example umgewandelt. Nutzen Sie die A-Label-Form in DNS, Wallet, Registrar und Serverkonfiguration.',
      hostedSummary: 'Was muss ein Hosted-DNS-Provider unterstützen?',
      hostedBody: 'Der Provider braucht autoritatives DNS-Hosting, DNSSEC-Signierung, DS- oder DNSKEY-Export und benutzerdefinierte TLSA-Einträge. Fehlt etwas davon, nutzen Sie eine eigene autoritative Server-Vorlage.'
    }
  },
  pt: {
    languageName: 'Português',
    languageLabel: 'Idioma',
    hero: {
      eyebrow: 'Precisa dos registros HNS, registrador, DNSSEC e TLSA?',
      title: 'Gerador de Registros DANE',
      standard: 'Autenticação baseada em DNS de entidades nomeadas',
      steps: {
        enter: 'Informe aqui o nome, o nameserver, o IP do servidor e o certificado.',
        send: 'Envie os registros gerados para sua carteira HNS ou registrador.',
        zone: 'Copie os registros de zona para o servidor DNS autoritativo.',
        done: 'Publique DNSSEC e TLSA para que o site DANE possa servir.'
      }
    },
    examples: { hnsDelegated: 'HNS delegado', hnsInline: 'Nameserver SYNTH HNS', icann: 'DNSSEC ICANN' },
    sections: { domain: '1. Domínio', server: '2. Servidor', dane: '3. DANE' },
    fields: {
      domainType: 'Tipo de domínio',
      domainTypeHelp: 'HNS significa carteira/recurso de nome. ICANN significa painel do registrador.',
      setupMode: 'Modo de configuração',
      setupModeHelp: 'Modo nomeado usa hostname de nameserver. SYNTH guarda IPs de nameserver no HNS; ambos usam DNS autoritativo.',
      domain: 'Domínio',
      domainHelp: 'Exemplos: example/ ou example.com',
      dnsServerPreset: 'Preset de servidor DNS',
      dnsServerPresetHelp: 'Isso muda o exemplo de copiar e colar, não o significado DNS.',
      nameserverHost: 'Hostname do nameserver',
      nameserverHostHelp: 'Use ns1.seunome. se este servidor estiver sob o mesmo nome. Isso requer glue.',
      nameserverIpv4: 'IPv4 do nameserver',
      nameserverIpv4Help: 'O endereço IPv4 público do servidor DNS autoritativo.',
      nameserverIpv6: 'IPv6 do nameserver (opcional)',
      nameserverIpv6Help: 'Glue/endereço IPv6 opcional para o servidor DNS.',
      websiteIpv4: 'IPv4 do site',
      websiteIpv4Help: 'O IPv4 público do servidor web no apex do domínio.',
      websiteIpv6: 'IPv6 do site (opcional)',
      websiteIpv6Help: 'Registro AAAA opcional para o servidor web.',
      port: 'Porta HTTPS',
      portHelp: '443 é o padrão para HTTPS normal. Altere apenas se o serviço TLS usar outra porta.',
      certificate: 'Certificado ou PUBLIC KEY',
      certificateHelp: 'Cole o certificado folha ou uma PUBLIC KEY em PEM. Chaves privadas não são necessárias.',
      dnskey: 'DNSKEY',
      dnskeyHelp: 'Depois de ativar a assinatura DNSSEC no servidor DNS, cole a DNSKEY da zona aqui para gerar DS.'
    },
    options: {
      hns: 'Handshake / HNS',
      icann: 'ICANN / DNS normal',
      delegated: 'DNS autoritativo delegado',
      hnsInline: 'Nameserver SYNTH HNS',
      genericZone: 'Arquivo de zona genérico',
      hostedDns: 'Painel de provedor DNS hospedado',
      powerdns: 'PowerDNS Authoritative',
      knot: 'Knot DNS',
      bind: 'BIND 9',
      nsd: 'NSD'
    },
    howTo: {
      summary: 'Como obter isto',
      certIntro: 'Cole o certificado público que seu servidor HTTPS entrega para este nome exato, ou cole a PUBLIC KEY em PEM correspondente. Não cole uma chave privada.',
      certFetch: 'Se você tem acesso shell, busque o certificado folha no serviço ativo:',
      certFile: 'Se você já tem um arquivo de certificado, cole o bloco de BEGIN CERTIFICATE até END CERTIFICATE. Para colar apenas a chave pública de um certificado, execute:',
      dnskeyIntro: 'Primeiro ative a assinatura DNSSEC na zona DNS autoritativa. O servidor DNS ou provedor hospedado cria a DNSKEY pública; este app usa esse registro público para gerar o DS do parent.',
      dnskeyHosted: 'Em um painel DNS hospedado, procure configurações DNSSEC, DS ou DNSKEY. Se o provedor fornecer um registro DS diretamente, publique esse DS na carteira ou registrador sem colar DNSKEY aqui.',
      dnskeyQuery: 'Se seu servidor autoritativo já responde, consulte a DNSKEY pública e cole a linha DNSKEY da zona, normalmente a chave de assinatura com flags 257:'
    },
    copy: { copy: 'Copiar', copied: 'Copiado', nothing: '# Nada gerado ainda' },
    status: {
      title: 'Status da configuração',
      ok: 'OK',
      warn: 'Verificar',
      missing: 'Necessário',
      labels: { Domain: 'Domínio', 'Website IP': 'IP do site', 'HNS inline': 'HNS SYNTH', DANE: 'DANE', Nameserver: 'Nameserver', Glue: 'Glue', DS: 'DS', TLSA: 'TLSA' }
    },
    notices: { title: 'Precisa de atenção' },
    summary: {
      aria: 'resumo da configuração atual',
      hnsInline: 'Nameserver SYNTH HNS',
      delegated: 'DNSSEC + DANE delegado',
      glueRequired: 'Glue necessário',
      externalNameserver: 'Nameserver externo',
      dsReady: 'DS pronto',
      dsPlaceholder: 'DS pendente',
      tlsaReady: 'TLSA pronto',
      tlsaPlaceholder: 'TLSA pendente'
    },
    output: {
      parentHns: 'Coloque isto na carteira HNS / recurso de nome',
      parentIcann: 'Coloque isto no registrador / zona parent',
      authoritative: 'Coloque isto no servidor DNS autoritativo',
      steps: 'Faça estes passos',
      verify: 'Verifique com estes comandos',
      web: 'Nota do servidor web',
      integrator: 'JSON integrador',
      server: 'Preset de servidor',
      audiences: { parent: 'parent', authoritative: 'autoritativo', server: 'servidor', web: 'web', verify: 'verificar', integrator: 'integrador' }
    },
    faq: {
      title: 'Ajuda',
      presetSummary: 'Qual preset devo escolher?',
      presetBody: 'Use DNS hospedado se seu provedor suporta DNSSEC e TLSA. Use arquivo de zona genérico ao adaptar registros para BIND, Knot, NSD ou outro servidor. Use PowerDNS se quiser DNS com banco de dados ou API.',
      splitSummary: 'O que vai na carteira/registrador versus no servidor DNS?',
      splitBody: 'A carteira ou registrador recebe NS/GLUE ou SYNTH, mais DS. O servidor DNS autoritativo recebe NS/A/AAAA/TLSA e assina a zona. TLSA é um registro do servidor DNS, não da carteira.',
      dnskeySummary: 'Quando colo a DNSKEY?',
      dnskeyBody: 'Cole DNSKEY depois que a zona autoritativa estiver assinada com DNSSEC. Esta página usa isso para gerar o registro DS do parent; ela não assina a zona nem armazena chaves DNSSEC privadas.',
      idnSummary: 'Posso usar um domínio internacionalizado?',
      idnBody: 'Sim. Entrada Unicode é convertida para A-labels ASCII IDNA como xn--bcher-kva.example. Use a forma A-label em DNS, carteira, registrador e configs do servidor.',
      hostedSummary: 'O que um provedor DNS hospedado precisa suportar?',
      hostedBody: 'O provedor precisa de DNS autoritativo, assinatura DNSSEC, exportação de DS ou DNSKEY e registros TLSA personalizados. Se faltar algo, use seu próprio preset de servidor autoritativo.'
    }
  },
  ja: {
    languageName: '日本語',
    languageLabel: '言語',
    hero: {
      eyebrow: 'HNS、レジストラ、DNSSEC、TLSA のレコードが必要ですか?',
      title: 'DANE レコード生成ツール',
      standard: 'DNS ベースの名前付きエンティティ認証',
      steps: {
        enter: 'ここに名前、ネームサーバー、サーバー IP、証明書を入力します。',
        send: '生成されたレコードを HNS ウォレットまたはレジストラへ送信します。',
        zone: 'ゾーンレコードを権威 DNS サーバーへコピーします。',
        done: 'DNSSEC と TLSA を公開して DANE Web サイトを配信できるようにします。'
      }
    },
    examples: { hnsDelegated: 'HNS 委任', hnsInline: 'HNS SYNTH ネームサーバー', icann: 'ICANN DNSSEC' },
    sections: { domain: '1. ドメイン', server: '2. サーバー', dane: '3. DANE' },
    fields: {
      domainType: 'ドメイン種別',
      domainTypeHelp: 'HNS はウォレット/名前リソース、ICANN はレジストラ画面を意味します。',
      setupMode: '設定モード',
      setupModeHelp: '名前付きモードはネームサーバー名を使います。SYNTH モードは HNS にネームサーバー IP を保存します。どちらも権威 DNS を使います。',
      domain: 'ドメイン',
      domainHelp: '例: example/ または example.com',
      dnsServerPreset: 'DNS サーバープリセット',
      dnsServerPresetHelp: 'コピー用のサーバー例だけを変えます。DNS の意味は変わりません。',
      nameserverHost: 'ネームサーバー名',
      nameserverHostHelp: '同じ名前の下にあるサーバーなら ns1.yourname. を使います。その場合 glue が必要です。',
      nameserverIpv4: 'ネームサーバー IPv4',
      nameserverIpv4Help: '権威 DNS サーバーの公開 IPv4 アドレスです。',
      nameserverIpv6: 'ネームサーバー IPv6 (任意)',
      nameserverIpv6Help: 'DNS サーバー用の任意の IPv6 glue/アドレスです。',
      websiteIpv4: 'Web サイト IPv4',
      websiteIpv4Help: 'ドメイン apex の Web サーバー公開 IPv4 アドレスです。',
      websiteIpv6: 'Web サイト IPv6 (任意)',
      websiteIpv6Help: 'Web サーバー用の任意の AAAA レコードです。',
      port: 'HTTPS ポート',
      portHelp: '通常の HTTPS では 443 が既定値です。TLS サービスが別のポートを使う場合だけ変更します。',
      certificate: '証明書または PUBLIC KEY',
      certificateHelp: 'リーフ証明書または PEM PUBLIC KEY を貼り付けます。秘密鍵は不要です。',
      dnskey: 'DNSKEY',
      dnskeyHelp: 'DNS サーバーで DNSSEC 署名を有効にした後、ゾーンの DNSKEY をここに貼り付けて DS を生成します。'
    },
    options: {
      hns: 'Handshake / HNS',
      icann: 'ICANN / 通常 DNS',
      delegated: '委任された権威 DNS',
      hnsInline: 'HNS SYNTH ネームサーバー',
      genericZone: '汎用ゾーンファイル',
      hostedDns: 'ホスト型 DNS プロバイダー画面',
      powerdns: 'PowerDNS Authoritative',
      knot: 'Knot DNS',
      bind: 'BIND 9',
      nsd: 'NSD'
    },
    howTo: {
      summary: '取得方法',
      certIntro: 'この名前に対して HTTPS サーバーが返す公開証明書、または対応する PEM PUBLIC KEY を貼り付けます。秘密鍵は貼り付けないでください。',
      certFetch: 'シェルアクセスがある場合は、稼働中のサービスからリーフ証明書を取得します:',
      certFile: '証明書ファイルがある場合は、BEGIN CERTIFICATE から END CERTIFICATE までのブロックを貼り付けます。証明書から公開鍵だけを取り出すには:',
      dnskeyIntro: 'まず権威 DNS ゾーンで DNSSEC 署名を有効にします。DNS サーバーまたはホスト型 DNS プロバイダーが公開 DNSKEY を作成し、このアプリはそれを使って親側 DS を生成します。',
      dnskeyHosted: 'ホスト型 DNS 画面では DNSSEC、DS、DNSKEY の設定を探します。プロバイダーが DS を直接表示する場合は、ここに DNSKEY を貼らずにその DS をウォレットまたはレジストラに公開できます。',
      dnskeyQuery: '権威サーバーがすでに応答している場合は、公開 DNSKEY を問い合わせ、通常 flags 257 のキー署名鍵の DNSKEY 行を貼り付けます:'
    },
    copy: { copy: 'コピー', copied: 'コピー済み', nothing: '# まだ生成されていません' },
    status: {
      title: '設定状態',
      ok: 'OK',
      warn: '確認',
      missing: '必要',
      labels: { Domain: 'ドメイン', 'Website IP': 'Web IP', 'HNS inline': 'HNS SYNTH', DANE: 'DANE', Nameserver: 'ネームサーバー', Glue: 'Glue', DS: 'DS', TLSA: 'TLSA' }
    },
    notices: { title: '確認が必要' },
    summary: {
      aria: '現在の設定概要',
      hnsInline: 'HNS SYNTH ネームサーバー',
      delegated: '委任 DNSSEC + DANE',
      glueRequired: 'Glue が必要',
      externalNameserver: '外部ネームサーバー',
      dsReady: 'DS 生成済み',
      dsPlaceholder: 'DS 未入力',
      tlsaReady: 'TLSA 生成済み',
      tlsaPlaceholder: 'TLSA 未入力'
    },
    output: {
      parentHns: 'HNS ウォレット / 名前リソースに入れる内容',
      parentIcann: 'レジストラ / 親ゾーンに入れる内容',
      authoritative: '権威 DNS サーバーに入れる内容',
      steps: '手順',
      verify: 'このコマンドで確認',
      web: 'Web サーバーメモ',
      integrator: 'Integrator JSON',
      server: 'サーバープリセット',
      audiences: { parent: '親', authoritative: '権威', server: 'サーバー', web: 'web', verify: '確認', integrator: 'integrator' }
    },
    faq: {
      title: 'ヘルプ',
      presetSummary: 'どのプリセットを選ぶべきですか?',
      presetBody: 'プロバイダーが DNSSEC と TLSA をサポートしているならホスト型 DNS を使います。BIND、Knot、NSD などへ合わせるなら汎用ゾーンファイルを使います。DB/API ベースの DNS なら PowerDNS を使います。',
      splitSummary: 'ウォレット/レジストラと DNS サーバーには何を入れますか?',
      splitBody: 'ウォレットまたはレジストラには NS/GLUE または SYNTH と DS を入れます。権威 DNS サーバーには NS/A/AAAA/TLSA を入れてゾーンを署名します。TLSA はウォレットではなく DNS サーバー側のレコードです。',
      dnskeySummary: 'DNSKEY はいつ貼り付けますか?',
      dnskeyBody: '権威ゾーンが DNSSEC 署名された後に DNSKEY を貼ります。このページは親側 DS を生成するだけで、ゾーン署名や秘密 DNSSEC 鍵の保存はしません。',
      idnSummary: '国際化ドメイン名は使えますか?',
      idnBody: 'はい。Unicode ドメイン入力は xn--bcher-kva.example のような IDNA ASCII A-label に変換されます。DNS レコード、ウォレット、レジストラ、サーバー設定では A-label 形式を使います。',
      hostedSummary: 'ホスト型 DNS プロバイダーに必要な機能は?',
      hostedBody: '権威 DNS ホスティング、DNSSEC 署名、DS または DNSKEY のエクスポート、カスタム TLSA レコードが必要です。足りない場合は自前の権威サーバープリセットを使います。'
    }
  }
} as const;

export type LanguageCode = keyof typeof localeText;

type WidenStrings<T> = T extends string
  ? string
  : T extends object
    ? { readonly [K in keyof T]: WidenStrings<T[K]> }
    : T;

export type LocaleText = WidenStrings<typeof localeText.en>;

export const languageOptions = (Object.keys(localeText) as LanguageCode[]).map((code) => ({
  code,
  label: localeText[code].languageName
}));

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in localeText;
}
