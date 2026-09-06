import React, { useState, useEffect, useRef } from 'react';

export interface CertificateItem {
  id: string;
  serial: string;
  digest: string;
  subjectCN: string;
  scope: string;
  issuingCA: string;
  caBadge: string;
  algorithm: string;
  validityStatus: 'VALID' | 'REVOKED' | 'EXPIRING' | 'SUSPENDED';
  validityText: string;
  validityClass: string;
  ocspStatus: string;
  ocspDetail: string;
  ocspClass: string;
  notBefore: string;
  notAfter: string;
  keyUsage: string;
  eku: string;
  cdp: string;
  aia: string;
  icon: string;
  revocationReason?: string;
  crlNumber?: string;
}

const INITIAL_CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-1',
    serial: '44:AE:90:12:BC:65',
    digest: 'SHA256: 8f9b...a12c',
    subjectCN: 'agt-9024-vance.delta.veille.internal',
    scope: 'UID: AGT-9024 // Field Biosecurity Spec (Level 4)',
    issuingCA: 'CA-02 [IDENTITY]',
    caBadge: 'CA-02 [PIV-Ed25519]',
    algorithm: 'Ed25519 (256-bit)',
    validityStatus: 'VALID',
    validityText: 'VALID · 182d LEFT',
    validityClass: 'bg-secondary/10 border-secondary/40 text-secondary',
    ocspStatus: 'GOOD (CACHED)',
    ocspDetail: 'OCSP Response 200 OK',
    ocspClass: 'text-secondary',
    notBefore: '2024-11-18 UTC',
    notAfter: '2025-11-18 UTC',
    keyUsage: 'Digital Signature, Key Encipherment',
    eku: 'TLS Web Client Authentication (1.3.6.1.5.5.7.3.2)',
    cdp: 'http://cdp.int02.veille.internal/crl/int02-delta.crl',
    aia: 'http://ocsp.int02.veille.internal:8080/v1',
    icon: 'person'
  },
  {
    id: 'cert-2',
    serial: '1B:9C:38:FA:72:01',
    digest: 'SHA256: d041...c889',
    subjectCN: 'wiretap-gateway-node-04b.ext.veille',
    scope: 'SAN: IP:10.240.18.91, DNS:gw-04b.sigint.local',
    issuingCA: 'CA-01 [GATEWAY]',
    caBadge: 'CA-01 [ECDSA-P384]',
    algorithm: 'ECDSA-P384',
    validityStatus: 'REVOKED',
    validityText: 'REVOKED [CRITICAL]',
    validityClass: 'bg-error/15 border-error/50 text-error',
    ocspStatus: 'KEY COMPROMISE (Code 1)',
    ocspDetail: 'Revoked 2025-05-14 UTC',
    ocspClass: 'text-error',
    notBefore: '2024-05-10 UTC',
    notAfter: '2025-05-10 UTC',
    keyUsage: 'Digital Signature, Key Agreement',
    eku: 'Server Authentication, Client Authentication',
    cdp: 'http://cdl.int01.veille.sec/crl/int01.crl',
    aia: 'http://ocsp.int01.veille.sec:8080/v1',
    icon: 'router',
    revocationReason: 'Code 1: Key Compromise',
    crlNumber: 'CRL #1,401'
  },
  {
    id: 'cert-3',
    serial: '88:31:02:DE:F4:99',
    digest: 'SHA256: 33ee...59b0',
    subjectCN: 'rag-worker-cluster-us-east.k8s.internal',
    scope: 'ServiceMesh SpiffeID: spiffe://veille/worker/rag-01',
    issuingCA: 'CA-03 [M2M MESH]',
    caBadge: 'CA-03 [CRYSTALS-Dilithium]',
    algorithm: 'CRYSTALS-Dilithium3',
    validityStatus: 'EXPIRING',
    validityText: 'EXPIRING IN 36h',
    validityClass: 'bg-amber-400/15 border-amber-400/40 text-amber-400',
    ocspStatus: 'GOOD (EPHEMERAL)',
    ocspDetail: 'Fast-staple micro-cert',
    ocspClass: 'text-secondary',
    notBefore: '2025-05-17 UTC',
    notAfter: '2025-05-19 UTC',
    keyUsage: 'Digital Signature, Non-Repudiation',
    eku: 'SPIFFE mTLS Service Identity',
    cdp: 'http://cdl.mesh.veille.sec/crl/mesh.crl',
    aia: 'http://ocsp.mesh.veille.sec:8080/v1',
    icon: 'dns'
  },
  {
    id: 'cert-4',
    serial: '02:FA:11:78:E5:3C',
    digest: 'SHA256: e87c...19a4',
    subjectCN: 'tsa-authority-forensic-evidence-signer.corp',
    scope: 'RFC 3161 Certified Time Stamp Unit #01',
    issuingCA: 'CA-04 [FORENSICS]',
    caBadge: 'CA-04 [RSA-4096]',
    algorithm: 'RSA-4096 / SHA-512',
    validityStatus: 'VALID',
    validityText: 'VALID · 742d LEFT',
    validityClass: 'bg-secondary/10 border-secondary/40 text-secondary',
    ocspStatus: 'ATTESTED (IMMUTABLE)',
    ocspDetail: 'Hardware TSA Enclave Signer',
    ocspClass: 'text-secondary',
    notBefore: '2023-06-01 UTC',
    notAfter: '2027-06-01 UTC',
    keyUsage: 'Digital Signature, Time Stamping (Critical)',
    eku: 'Time Stamping (1.3.6.1.5.5.7.3.8)',
    cdp: 'http://cdl.tsa.veille.sec/crl/tsa.crl',
    aia: 'http://ocsp.tsa.veille.sec:8080/v1',
    icon: 'timer'
  },
  {
    id: 'cert-5',
    serial: '91:3D:7A:B4:80:C1',
    digest: 'SHA256: 77a1...df02',
    subjectCN: 'agt-7718-miller.omega.veille.internal',
    scope: 'UID: AGT-7718 // Cyber Forensics Specialist',
    issuingCA: 'CA-02 [IDENTITY]',
    caBadge: 'CA-02 [PIV-Ed25519]',
    algorithm: 'Ed25519 (256-bit)',
    validityStatus: 'VALID',
    validityText: 'VALID · 290d LEFT',
    validityClass: 'bg-secondary/10 border-secondary/40 text-secondary',
    ocspStatus: 'GOOD (CACHED)',
    ocspDetail: 'OCSP Response 200 OK',
    ocspClass: 'text-secondary',
    notBefore: '2025-03-01 UTC',
    notAfter: '2026-03-01 UTC',
    keyUsage: 'Digital Signature, Key Encipherment',
    eku: 'TLS Web Client Authentication',
    cdp: 'http://cdp.int02.veille.internal/crl/int02-delta.crl',
    aia: 'http://ocsp.int02.veille.internal:8080/v1',
    icon: 'person'
  },
  {
    id: 'cert-6',
    serial: '3C:44:E1:99:A7:28',
    digest: 'SHA256: fb08...9401',
    subjectCN: 'sigint-tap-edge-relay-09.charlie',
    scope: 'Location: Node-9 Charlie / Sector 04 Perimeter',
    issuingCA: 'CA-01 [GATEWAY]',
    caBadge: 'CA-01 [ECDSA-P384]',
    algorithm: 'ECDSA-P384',
    validityStatus: 'SUSPENDED',
    validityText: 'SUSPENDED (HOLD)',
    validityClass: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
    ocspStatus: 'CERTIFICATE HOLD (Code 6)',
    ocspDetail: 'Audit Hold in effect',
    ocspClass: 'text-amber-400',
    notBefore: '2025-01-15 UTC',
    notAfter: '2026-01-15 UTC',
    keyUsage: 'Digital Signature, Key Agreement',
    eku: 'TLS Web Server & Client Authentication',
    cdp: 'http://cdl.int01.veille.sec/crl/int01.crl',
    aia: 'http://ocsp.int01.veille.sec:8080/v1',
    icon: 'tap_and_play',
    revocationReason: 'Code 6: Certificate Hold'
  }
];

export const PKIRevocation: React.FC = () => {
  const [certs, setCerts] = useState<CertificateItem[]>(INITIAL_CERTIFICATES);
  const [selectedCert, setSelectedCert] = useState<CertificateItem>(INITIAL_CERTIFICATES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [caFilter, setCaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeSubCaCard, setActiveSubCaCard] = useState<string | null>(null);

  // Revocation Console State
  const [reasonCode, setReasonCode] = useState('1');
  const [flushOcsp, setFlushOcsp] = useState(true);
  const [broadcastRelays, setBroadcastRelays] = useState(true);
  const [autoReissue, setAutoReissue] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Modals & Panels
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isEmergencyCrlOpen, setIsEmergencyCrlOpen] = useState(false);
  const [isConsoleLocked, setIsConsoleLocked] = useState(false);

  // New Certificate Form State
  const [newCertCN, setNewCertCN] = useState('');
  const [newCertCA, setNewCertCA] = useState('CA-02 [IDENTITY]');
  const [newCertAlgo, setNewCertAlgo] = useState('Ed25519 (256-bit)');
  const [newCertScope, setNewCertScope] = useState('');

  // Clock
  const [clockText, setClockText] = useState('');
  const [deltaCountdown, setDeltaCountdown] = useState(1122); // seconds (18m 42s)

  // Log Stream
  const [logs, setLogs] = useState<Array<{ time: string; type: 'OK' | 'INFO' | 'AUDIT' | 'SIG' | 'WARN' | 'ERROR'; text: string }>>([
    { time: '14:21:40', type: 'OK', text: 'OCSP Responder Heartbeat 200 OK (0.3ms)' },
    { time: '14:21:12', type: 'INFO', text: 'Delta CRL #1401 synced to 48/48 edge relays' },
    { time: '14:20:04', type: 'AUDIT', text: 'CRL Merkle root 0x88F2 sealed by HSM-02' },
    { time: '14:18:50', type: 'SIG', text: 'ECDSA-P384 token validation: agt-9024 PASS' },
  ]);
  const logStreamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      const millis = String(now.getUTCMilliseconds()).padStart(3, '0');
      setClockText(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const deltaTimer = setInterval(() => {
      setDeltaCountdown((prev) => (prev > 0 ? prev - 1 : 1200));
    }, 1000);
    return () => clearInterval(deltaTimer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const addLog = (type: 'OK' | 'INFO' | 'AUDIT' | 'SIG' | 'WARN' | 'ERROR', text: string) => {
    const now = new Date();
    const t = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
    setLogs((prev) => [{ time: t, type, text }, ...prev.slice(0, 49)]);
    if (logStreamRef.current) {
      logStreamRef.current.scrollTop = 0;
    }
  };

  // Filter logic
  const filteredCerts = certs.filter((cert) => {
    const matchesSearch =
      searchQuery === '' ||
      cert.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.digest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.subjectCN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.scope.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCA =
      caFilter === 'ALL' ||
      (caFilter === 'CA-01' && cert.issuingCA.includes('CA-01')) ||
      (caFilter === 'CA-02' && cert.issuingCA.includes('CA-02')) ||
      (caFilter === 'CA-03' && cert.issuingCA.includes('CA-03')) ||
      (caFilter === 'CA-04' && cert.issuingCA.includes('CA-04'));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && cert.validityStatus === 'VALID') ||
      (statusFilter === 'REVOKED' && cert.validityStatus === 'REVOKED') ||
      (statusFilter === 'EXPIRING' && cert.validityStatus === 'EXPIRING') ||
      (statusFilter === 'SUSPENDED' && cert.validityStatus === 'SUSPENDED');

    const matchesCard =
      !activeSubCaCard ||
      (activeSubCaCard === 'CA-01' && cert.issuingCA.includes('CA-01')) ||
      (activeSubCaCard === 'CA-02' && cert.issuingCA.includes('CA-02')) ||
      (activeSubCaCard === 'CA-03' && cert.issuingCA.includes('CA-03')) ||
      (activeSubCaCard === 'CA-04' && cert.issuingCA.includes('CA-04'));

    return matchesSearch && matchesCA && matchesStatus && matchesCard;
  });

  // Execute Revocation Action
  const handleExecuteRevocation = () => {
    if (!selectedCert) return;
    setIsRevoking(true);

    const reasonMap: Record<string, string> = {
      '1': 'Code 1: Key Compromise',
      '2': 'Code 2: CA Compromise',
      '3': 'Code 3: Affiliation Changed',
      '4': 'Code 4: Superseded',
      '5': 'Code 5: Cessation of Operation',
      '6': 'Code 6: Certificate Hold'
    };
    const chosenReason = reasonMap[reasonCode] || 'Code 1: Key Compromise';
    const isHold = reasonCode === '6';

    setTimeout(() => {
      const updatedList = certs.map((c) => {
        if (c.id === selectedCert.id) {
          return {
            ...c,
            validityStatus: isHold ? ('SUSPENDED' as const) : ('REVOKED' as const),
            validityText: isHold ? 'SUSPENDED (HOLD)' : 'REVOKED [CRITICAL]',
            validityClass: isHold
              ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
              : 'bg-error/15 border-error/50 text-error',
            ocspStatus: isHold ? 'CERTIFICATE HOLD (Code 6)' : `${chosenReason.toUpperCase()} (Revoked)`,
            ocspClass: isHold ? 'text-amber-400' : 'text-error',
            revocationReason: chosenReason,
            crlNumber: 'CRL #1,402'
          };
        }
        return c;
      });

      setCerts(updatedList);
      const updatedSelected = updatedList.find((c) => c.id === selectedCert.id);
      if (updatedSelected) setSelectedCert(updatedSelected);

      addLog('ERROR', `REVOKED: ${selectedCert.subjectCN} (${chosenReason}). Broadcasted to 48 relays.`);
      if (flushOcsp) {
        addLog('INFO', `OCSP fast-staple cache flushed for Serial ${selectedCert.serial}`);
      }
      if (broadcastRelays) {
        addLog('OK', `Delta CRL #1402 committed to Merkle ledger proof (0x91A3...44E1)`);
      }
      if (autoReissue) {
        addLog('INFO', `Auto re-issuance ticket generated: #TICK-${Math.floor(1000 + Math.random() * 9000)}`);
      }

      setIsRevoking(false);
    }, 450);
  };

  // Handle Unhold
  const handleUnhold = (cert: CertificateItem) => {
    const updated = certs.map((c) => {
      if (c.id === cert.id) {
        return {
          ...c,
          validityStatus: 'VALID' as const,
          validityText: 'VALID · RESTORED',
          validityClass: 'bg-secondary/10 border-secondary/40 text-secondary',
          ocspStatus: 'GOOD (UNHELD)',
          ocspClass: 'text-secondary',
          revocationReason: undefined
        };
      }
      return c;
    });
    setCerts(updated);
    if (selectedCert.id === cert.id) {
      const u = updated.find((c) => c.id === cert.id);
      if (u) setSelectedCert(u);
    }
    addLog('OK', `RESTORED: ${cert.subjectCN} removed from Certificate Hold.`);
  };

  // Handle Rotate Now
  const handleRotateNow = (cert: CertificateItem) => {
    const updated = certs.map((c) => {
      if (c.id === cert.id) {
        return {
          ...c,
          validityStatus: 'VALID' as const,
          validityText: 'VALID · ROTATED',
          validityClass: 'bg-secondary/10 border-secondary/40 text-secondary',
          ocspStatus: 'GOOD (NEW EPOCH)',
          ocspClass: 'text-secondary',
          notAfter: '2026-05-18 UTC'
        };
      }
      return c;
    });
    setCerts(updated);
    if (selectedCert.id === cert.id) {
      const u = updated.find((c) => c.id === cert.id);
      if (u) setSelectedCert(u);
    }
    addLog('OK', `ROTATED: ${cert.subjectCN} refreshed for 365d epoch.`);
  };

  // Handle Issue Certificate
  const handleCreateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertCN) return;

    const randomHex = () =>
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':');

    const newCert: CertificateItem = {
      id: `cert-${Date.now()}`,
      serial: randomHex(),
      digest: `SHA256: ${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      subjectCN: newCertCN,
      scope: newCertScope || 'Newly Issued X.509 Intelligence Credential',
      issuingCA: newCertCA,
      caBadge: newCertCA,
      algorithm: newCertAlgo,
      validityStatus: 'VALID',
      validityText: 'VALID · 365d LEFT',
      validityClass: 'bg-secondary/10 border-secondary/40 text-secondary',
      ocspStatus: 'GOOD (FRESH)',
      ocspDetail: 'Issued via VEILLE PKI Sub-CA',
      ocspClass: 'text-secondary',
      notBefore: new Date().toISOString().split('T')[0] + ' UTC',
      notAfter: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0] + ' UTC',
      keyUsage: 'Digital Signature, Key Encipherment',
      eku: 'TLS Web Client Authentication',
      cdp: 'http://cdp.int02.veille.internal/crl/int02-delta.crl',
      aia: 'http://ocsp.int02.veille.internal:8080/v1',
      icon: newCertCA.includes('GATEWAY') ? 'router' : newCertCA.includes('MESH') ? 'dns' : 'person'
    };

    setCerts([newCert, ...certs]);
    setSelectedCert(newCert);
    setIsIssueModalOpen(false);
    setNewCertCN('');
    setNewCertScope('');
    addLog('OK', `ISSUED: New certificate ${newCert.subjectCN} [Serial: ${newCert.serial}]`);
  };

  // Export PEM file download
  const handleExportPEM = () => {
    const pemContent = `-----BEGIN CERTIFICATE-----
MIIEkjCCA3qgAwIBAgIU${selectedCert.serial.replace(/:/g, '')}MA0GCSqGSIb3DQEBCwUA
MD0xEzARBgNVBAoMCkNTUlRFU1RfQ0ExJjAkBgNVBAMMHVRlc3QgQ0EgUm9vdCBF
dmFsdWF0aW9uIFZlaWxsZTAeFw0yNDExMTgwMDAwMDBaFw0yNTExMTgyMzU5NTla
MEQxITAfBgNVBAMMGG${btoa(selectedCert.subjectCN).substring(0, 24)}
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA7jZ2l9j4uYyXk3k8W2j8
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE_CHAIN-----
Issuer: ${selectedCert.issuingCA}
Serial: ${selectedCert.serial}
Fingerprint: ${selectedCert.digest}
Attestation: VEILLE HSM FIPS 140-3 L4 Seal
-----END CERTIFICATE_CHAIN-----`;

    const blob = new Blob([pemContent], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCert.subjectCN.replace(/[^a-zA-Z0-9_-]/g, '_')}.pem`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('INFO', `EXPORTED PEM: ${selectedCert.subjectCN} payload generated.`);
  };

  // Emergency CRL Publish
  const handleEmergencyCrlPublish = () => {
    setIsEmergencyCrlOpen(false);
    addLog('WARN', 'EMERGENCY CRL PUBLISH TRIGGERED: Syncing all 4 Sub-CA delta lists...');
    setTimeout(() => {
      addLog('OK', 'EMERGENCY CRL BROADCAST COMPLETE: 48/48 edge proxies attested. Latency 0.22ms.');
    }, 400);
  };

  const revokedCount = certs.filter((c) => c.validityStatus === 'REVOKED').length;
  const expiringCount = certs.filter((c) => c.validityStatus === 'EXPIRING').length;
  const activeCount = certs.length;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-surface-dim text-on-surface select-none overflow-hidden antialiased -m-4 lg:-m-8 min-w-0 border-t border-outline-variant">
      {/* ========================================================================= */}
      {/* 1. TACTICAL TOP BAR (Clearance, Telemetry & Action Buttons)               */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-surface-container-lowest border-b border-outline-variant shrink-0 gap-2 z-20">
        {/* Left Clearance Badges */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 bg-primary animate-pulse rounded-full shadow-[0_0_8px_#38bdf8]"></span>
            <span className="text-primary font-bold tracking-wider uppercase text-[12px]">
              PKI &amp; CA REVOCATION
            </span>
          </div>
          <span className="text-outline-variant">|</span>
          <span className="text-error bg-error/10 border border-error/30 px-1.5 py-0.5 text-[10px] font-semibold">
            TS//SCI CLEARANCE
          </span>
          <span className="hidden xl:inline text-outline text-[11px]">
            POLICY: RFC 5280 / NIST SP 800-57
          </span>
        </div>

        {/* Center Enclave & Clock */}
        <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-surface-container-low px-2 py-0.5 border border-outline-variant text-[11px]">
            <span className="text-outline">ENCLAVE:</span>
            <span className="text-secondary font-semibold">ROOT-AIRGAP</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-semibold">INT-01 ONLINE</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="text-outline">UTC:</span>
            <span className="text-primary font-bold tabular-nums">
              {clockText || '2026-09-05 14:23:00.247'}
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="bg-primary hover:bg-primary-fixed text-on-primary-fixed text-[11px] font-mono font-bold px-3 py-1 border border-primary-container shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">add_moderator</span>
            <span>ISSUE CERTIFICATE</span>
          </button>
          <button
            onClick={() => setIsEmergencyCrlOpen(true)}
            className="bg-error/15 hover:bg-error/25 border border-error/50 text-error text-[11px] font-mono font-semibold px-3 py-1 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">published_with_changes</span>
            <span>EMERGENCY CRL PUBLISH</span>
          </button>
          <button
            onClick={() => setIsConsoleLocked(!isConsoleLocked)}
            className={`text-[10px] font-mono px-2.5 py-1 border transition-colors cursor-pointer ${
              isConsoleLocked
                ? 'bg-error text-surface border-error font-bold'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {isConsoleLocked ? 'CONSOLE LOCKED' : 'LOCK CONSOLE'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE VIEWPORT (Center Theater + Right Inspector Drawer)       */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {/* ======================================================================= */}
        {/* CENTRAL OPERATIONAL THEATER (Left 72%)                                  */}
        {/* ======================================================================= */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-outline-variant overflow-y-auto">
          {/* Top 5-Card Telemetry Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-outline-variant border-b border-outline-variant shrink-0">
            {/* Stat 1: Total Certificates */}
            <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-[10px] font-mono uppercase">
                <span>ACTIVE CERTIFICATES</span>
                <span className="material-symbols-outlined text-[14px] text-secondary">badge</span>
              </div>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-xl font-mono font-bold text-on-surface">
                  {3840 + activeCount}
                </span>
                <span className="text-[10px] font-mono text-secondary font-semibold">TOTAL</span>
              </div>
              <div className="flex items-center space-x-1.5 mt-1 text-[10px] font-mono text-outline">
                <span className="text-error font-semibold">{14 + revokedCount - 1} Revoked</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{8 + expiringCount - 1} Expiring</span>
              </div>
            </div>

            {/* Stat 2: Root CA Integrity */}
            <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-[10px] font-mono uppercase">
                <span>ROOT CA INTEGRITY</span>
                <span className="material-symbols-outlined text-[14px] text-primary">security_update_good</span>
              </div>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-base font-mono font-bold text-primary">AIR-GAPPED</span>
                <span className="text-[9px] font-mono text-outline">OFFLINE</span>
              </div>
              <div className="flex items-center space-x-1 mt-1 text-[10px] font-mono text-secondary">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                <span>Vault-01 (YubiHSM2)</span>
              </div>
            </div>

            {/* Stat 3: OCSP Ingestion Velocity */}
            <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-[10px] font-mono uppercase">
                <span>OCSP INGESTION RATE</span>
                <span className="material-symbols-outlined text-[14px] text-primary">speed</span>
              </div>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-xl font-mono font-bold text-on-surface">9,410</span>
                <span className="text-[10px] font-mono text-primary">REQ/SEC</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-outline">
                <span className="text-secondary font-semibold">99.999% SLA</span>
                <span>0.4ms Latency</span>
              </div>
            </div>

            {/* Stat 4: Delta CRL Epoch Countdown */}
            <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-outline text-[10px] font-mono uppercase">
                <span>NEXT DELTA CRL PUSH</span>
                <span className="material-symbols-outlined text-[14px] text-amber-400">sync_saved_locally</span>
              </div>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                  {formatCountdown(deltaCountdown)}
                </span>
                <span className="text-[9px] font-mono text-outline">DELTA #1,402</span>
              </div>
              <div className="flex items-center space-x-1 mt-1 text-[10px] font-mono text-on-surface-variant">
                <span>Staged:</span>
                <span className="text-secondary font-semibold font-mono">0 pending</span>
              </div>
            </div>

            {/* Stat 5: Merkle Root CRL Proof */}
            <div className="bg-surface-container-lowest p-3 flex flex-col justify-between col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-outline text-[10px] font-mono uppercase">
                <span>MERKLE ROOT CRL PROOF</span>
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-primary font-bold truncate">
                0x88F2...90B3
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-outline">
                <span>PBFT Consensus:</span>
                <span className="text-secondary font-semibold">12/12 ATTESTED</span>
              </div>
            </div>
          </div>

          {/* Subordinate CAs Topology Cards */}
          <div className="p-3.5 border-b border-outline-variant bg-surface-container-low/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  ACTIVE PKI TRUST TOPOLOGY &amp; SUBORDINATE AUTHORITIES
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary">
                POST-QUANTUM READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              {/* CA-01 */}
              <div
                onClick={() => setActiveSubCaCard(activeSubCaCard === 'CA-01' ? null : 'CA-01')}
                className={`border p-2.5 bg-surface-container-lowest transition-all cursor-pointer relative ${
                  activeSubCaCard === 'CA-01'
                    ? 'border-primary shadow-[0_0_12px_rgba(56,189,248,0.3)] bg-primary/5'
                    : 'border-outline-variant hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-primary">CA-01 // INGESTION</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-secondary/15 border border-secondary/40 text-secondary">
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs font-semibold text-on-surface truncate">
                  Intercept Gateway Wiretap CA
                </div>
                <div className="mt-2 space-y-0.5 text-[10px] font-mono text-on-surface-variant">
                  <div className="flex justify-between">
                    <span className="text-outline">ALGORITHM:</span>
                    <span className="text-on-surface font-semibold">ECDSA-P384</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">PURPOSE:</span>
                    <span className="text-on-surface">Mutual TLS / VPN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">LEAF CERTS:</span>
                    <span className="text-primary font-bold">1,842</span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-outline-variant/50 flex items-center justify-between text-[9px] font-mono text-outline">
                  <span>CDP: cdl.int01.veille.sec</span>
                  <span className="text-secondary">SYNCED</span>
                </div>
              </div>

              {/* CA-02 */}
              <div
                onClick={() => setActiveSubCaCard(activeSubCaCard === 'CA-02' ? null : 'CA-02')}
                className={`border p-2.5 bg-surface-container-lowest transition-all cursor-pointer relative ${
                  activeSubCaCard === 'CA-02' || activeSubCaCard === null
                    ? 'border-primary shadow-[0_0_12px_rgba(56,189,248,0.3)] bg-primary/5'
                    : 'border-outline-variant hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-primary">CA-02 // IDENTITY</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-secondary/15 border border-secondary/40 text-secondary">
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs font-semibold text-on-surface truncate">
                  Investigator SmartCard &amp; PIV
                </div>
                <div className="mt-2 space-y-0.5 text-[10px] font-mono text-on-surface-variant">
                  <div className="flex justify-between">
                    <span className="text-outline">ALGORITHM:</span>
                    <span className="text-on-surface font-semibold">Ed25519 (FIDO2)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">PURPOSE:</span>
                    <span className="text-on-surface">Client Auth / Sign</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">LEAF CERTS:</span>
                    <span className="text-primary font-bold">710</span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-outline-variant/50 flex items-center justify-between text-[9px] font-mono text-outline">
                  <span>CDP: cdl.int02.veille.sec</span>
                  <span className="text-secondary">SYNCED</span>
                </div>
              </div>

              {/* CA-03 */}
              <div
                onClick={() => setActiveSubCaCard(activeSubCaCard === 'CA-03' ? null : 'CA-03')}
                className={`border p-2.5 bg-surface-container-lowest transition-all cursor-pointer relative ${
                  activeSubCaCard === 'CA-03'
                    ? 'border-primary shadow-[0_0_12px_rgba(56,189,248,0.3)] bg-primary/5'
                    : 'border-outline-variant hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-primary">CA-03 // M2M MESH</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-secondary/15 border border-secondary/40 text-secondary">
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs font-semibold text-on-surface truncate">
                  SPIFFE/SPIRE Ephemeral Node CA
                </div>
                <div className="mt-2 space-y-0.5 text-[10px] font-mono text-on-surface-variant">
                  <div className="flex justify-between">
                    <span className="text-outline">ALGORITHM:</span>
                    <span className="text-on-surface font-semibold">CRYSTALS-Dilithium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">PURPOSE:</span>
                    <span className="text-on-surface">1h Microsegmentation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">LEAF CERTS:</span>
                    <span className="text-primary font-bold">1,230</span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-outline-variant/50 flex items-center justify-between text-[9px] font-mono text-outline">
                  <span>CDP: cdl.mesh.veille.sec</span>
                  <span className="text-secondary">SHORT-LIVED</span>
                </div>
              </div>

              {/* CA-04 */}
              <div
                onClick={() => setActiveSubCaCard(activeSubCaCard === 'CA-04' ? null : 'CA-04')}
                className={`border p-2.5 bg-surface-container-lowest transition-all cursor-pointer relative ${
                  activeSubCaCard === 'CA-04'
                    ? 'border-primary shadow-[0_0_12px_rgba(56,189,248,0.3)] bg-primary/5'
                    : 'border-outline-variant hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-primary">CA-04 // FORENSICS</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-secondary/15 border border-secondary/40 text-secondary">
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs font-semibold text-on-surface truncate">
                  RFC 3161 Immutable TSA
                </div>
                <div className="mt-2 space-y-0.5 text-[10px] font-mono text-on-surface-variant">
                  <div className="flex justify-between">
                    <span className="text-outline">ALGORITHM:</span>
                    <span className="text-on-surface font-semibold">RSA-4096 / SHA-512</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">PURPOSE:</span>
                    <span className="text-on-surface">Evidence Time-Seal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">LEAF CERTS:</span>
                    <span className="text-primary font-bold">60</span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-outline-variant/50 flex items-center justify-between text-[9px] font-mono text-outline">
                  <span>CDP: cdl.tsa.veille.sec</span>
                  <span className="text-secondary">SYNCED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Search & Filter Matrix */}
          <div className="p-2.5 border-b border-outline-variant bg-surface-container-lowest flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Search Input */}
            <div className="flex items-center flex-1 max-w-md bg-surface-container-low border border-outline-variant px-2.5 py-1 focus-within:border-primary">
              <span className="text-[10px] font-mono text-outline mr-2">QUERY://</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none p-0 text-xs font-mono text-on-surface focus:ring-0 focus:outline-none w-full placeholder:text-outline/50"
                placeholder="Filter by Serial, Fingerprint, CN, or SAN..."
                type="text"
              />
              <span className="material-symbols-outlined text-[16px] text-outline">search</span>
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <select
                value={caFilter}
                onChange={(e) => {
                  setCaFilter(e.target.value);
                  setActiveSubCaCard(null);
                }}
                className="bg-surface-container-low border border-outline-variant text-on-surface-variant py-1 px-2 focus:border-primary focus:ring-0 text-xs cursor-pointer"
              >
                <option value="ALL">ALL SUB-CAs (CA-01..04)</option>
                <option value="CA-01">CA-01 [Gateway mTLS]</option>
                <option value="CA-02">CA-02 [Investigator PIV]</option>
                <option value="CA-03">CA-03 [M2M Ephemeral]</option>
                <option value="CA-04">CA-04 [Evidence TSA]</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-container-low border border-outline-variant text-on-surface-variant py-1 px-2 focus:border-primary focus:ring-0 text-xs cursor-pointer"
              >
                <option value="ALL">ALL STATES (Active, Revoked, Exp)</option>
                <option value="ACTIVE">ACTIVE / VALID ONLY</option>
                <option value="REVOKED">REVOKED ONLY</option>
                <option value="EXPIRING">EXPIRING WITHIN 30D</option>
                <option value="SUSPENDED">SUSPENDED (HOLD)</option>
              </select>

              {activeSubCaCard && (
                <button
                  onClick={() => setActiveSubCaCard(null)}
                  className="px-2 py-1 text-[10px] font-mono bg-primary/10 border border-primary text-primary hover:bg-primary/20 cursor-pointer"
                >
                  RESET SUB-CA ({activeSubCaCard})
                </button>
              )}

              <button
                onClick={() => {
                  setSearchQuery('');
                  setCaFilter('ALL');
                  setStatusFilter('ALL');
                  setActiveSubCaCard(null);
                  addLog('INFO', 'Ledger registry refreshed from Ring-0 cache.');
                }}
                className="p-1 border border-outline-variant hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Reset & Refresh"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Certificate Registry Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest sticky top-0 z-10 border-b border-outline-variant">
                <tr className="text-[10px] font-mono text-outline uppercase tracking-wider">
                  <th className="py-2 px-3 w-40">SERIAL &amp; DIGEST</th>
                  <th className="py-2 px-3">SUBJECT COMMON NAME &amp; SCOPE</th>
                  <th className="py-2 px-3">ISSUING CA</th>
                  <th className="py-2 px-3">KEY / ALGORITHM</th>
                  <th className="py-2 px-3">VALIDITY STATUS</th>
                  <th className="py-2 px-3">OCSP ATTESTATION</th>
                  <th className="py-2 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs font-mono">
                {filteredCerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-outline font-mono">
                      NO CERTIFICATES MATCHING ACTIVE FILTER MATRIX
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((cert) => {
                    const isSelected = selectedCert.id === cert.id;
                    return (
                      <tr
                        key={cert.id}
                        onClick={() => setSelectedCert(cert)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-surface-container-high/80 border-l-2 border-primary hover:bg-surface-container-high'
                            : 'bg-surface-container-lowest hover:bg-surface-container-low'
                        }`}
                      >
                        {/* Serial */}
                        <td className="py-2 px-3 font-mono font-bold">
                          <div className={cert.validityStatus === 'REVOKED' ? 'text-error' : cert.validityStatus === 'EXPIRING' || cert.validityStatus === 'SUSPENDED' ? 'text-amber-400' : 'text-primary'}>
                            {cert.serial}
                          </div>
                          <div className="text-[9px] text-outline font-normal">{cert.digest}</div>
                        </td>

                        {/* Subject */}
                        <td className="py-2 px-3">
                          <div className="font-sans font-semibold text-on-surface flex items-center space-x-1.5 text-xs">
                            <span className={`material-symbols-outlined text-[14px] ${cert.validityStatus === 'REVOKED' ? 'text-error' : cert.validityStatus === 'EXPIRING' || cert.validityStatus === 'SUSPENDED' ? 'text-amber-400' : 'text-primary'}`}>
                              {cert.icon}
                            </span>
                            <span className="truncate">{cert.subjectCN}</span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono truncate">{cert.scope}</div>
                        </td>

                        {/* CA */}
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 bg-surface-container border border-outline-variant text-on-surface text-[10px]">
                            {cert.issuingCA}
                          </span>
                        </td>

                        {/* Key Spec */}
                        <td className="py-2 px-3 text-on-surface-variant text-[11px]">
                          {cert.algorithm}
                        </td>

                        {/* Validity */}
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 border text-[9px] font-semibold ${cert.validityClass}`}>
                            {cert.validityText}
                          </span>
                        </td>

                        {/* OCSP */}
                        <td className="py-2 px-3">
                          <div className={`flex items-center space-x-1 text-[10px] ${cert.ocspClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cert.validityStatus === 'REVOKED' ? 'bg-error' : cert.validityStatus === 'SUSPENDED' ? 'bg-amber-400' : 'bg-secondary'}`}></span>
                            <span>{cert.ocspStatus}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-right space-x-1 whitespace-nowrap">
                          {cert.validityStatus === 'SUSPENDED' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnhold(cert);
                              }}
                              className="px-2 py-0.5 bg-secondary/15 border border-secondary text-secondary hover:bg-secondary hover:text-surface text-[9px] font-bold transition-colors cursor-pointer"
                            >
                              UNHOLD
                            </button>
                          ) : cert.validityStatus === 'EXPIRING' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRotateNow(cert);
                              }}
                              className="px-2 py-0.5 bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-surface text-[9px] font-bold transition-colors cursor-pointer"
                            >
                              ROTATE NOW
                            </button>
                          ) : cert.validityStatus === 'REVOKED' ? (
                            <span className="px-2 py-0.5 bg-surface-container-low border border-outline-variant text-outline text-[9px]">
                              {cert.crlNumber || 'ON CRL #1,401'}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCert(cert);
                              }}
                              className="px-2 py-0.5 bg-error/15 border border-error/50 text-error hover:bg-error hover:text-surface text-[9px] font-bold transition-colors cursor-pointer"
                            >
                              REVOKE
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCert(cert);
                            }}
                            className="px-2 py-0.5 bg-surface-container border border-outline-variant hover:border-primary text-on-surface text-[9px] transition-colors cursor-pointer"
                          >
                            INSPECT
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Stats & Pagination */}
          <div className="p-2.5 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between text-[11px] font-mono text-outline shrink-0">
            <div className="flex items-center space-x-3">
              <span>SHOWING 1 - {filteredCerts.length} OF {3840 + certs.length} CERTIFICATES</span>
              <span>•</span>
              <span className="text-on-surface-variant">
                ACTIVE CRL SIZE: {(4.8 + (revokedCount - 1) * 0.3).toFixed(1)} KB ({14 + revokedCount - 1} ENTRIES)
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button className="px-2 py-0.5 bg-surface-container border border-outline-variant text-on-surface-variant disabled:opacity-30 cursor-pointer" disabled>
                &lt; PREV
              </button>
              <span className="px-2 py-0.5 bg-primary text-on-primary-fixed font-bold">1</span>
              <button className="px-2 py-0.5 bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface cursor-pointer">2</button>
              <button className="px-2 py-0.5 bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface cursor-pointer">3</button>
              <button className="px-2 py-0.5 bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface cursor-pointer">NEXT &gt;</button>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* RIGHT FORENSIC CERTIFICATE INSPECTOR & CRL DRAWER (380px)               */}
        {/* ======================================================================= */}
        <aside className="w-[380px] border-l border-outline-variant bg-surface-container-lowest flex flex-col justify-between z-30 shrink-0 overflow-y-auto">
          <div>
            {/* Inspector Header */}
            <div className="h-9 border-b border-outline-variant flex items-center justify-between px-3 bg-surface-container-high/40">
              <div className="flex items-center space-x-1.5 text-xs font-mono">
                <span className="material-symbols-outlined text-[16px] text-primary">manage_search</span>
                <span className="text-on-surface font-bold uppercase tracking-wider">
                  X.509 FORENSIC INSPECTOR
                </span>
              </div>
              <span className="text-[9px] font-mono text-primary bg-primary/10 border border-primary px-1.5 py-0.2">
                TARGET ARMED
              </span>
            </div>

            {/* Selected Certificate Identity */}
            <div className="p-3 border-b border-outline-variant bg-surface-container-low/40">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono text-outline uppercase tracking-wider">
                    SUBJECT COMMON NAME
                  </span>
                  <div className="font-sans font-bold text-on-surface text-xs break-all mt-0.5">
                    {selectedCert.subjectCN}
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 border text-[9px] font-mono font-bold shrink-0 ${selectedCert.validityClass}`}>
                  {selectedCert.validityStatus}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] font-mono bg-surface-container p-2 border border-outline-variant">
                <div>
                  <span className="text-outline block">SERIAL NUMBER:</span>
                  <span className="font-mono text-primary font-bold">{selectedCert.serial}</span>
                </div>
                <div>
                  <span className="text-outline block">ISSUING CA:</span>
                  <span className="text-on-surface font-medium">{selectedCert.caBadge}</span>
                </div>
                <div>
                  <span className="text-outline block">NOT BEFORE:</span>
                  <span className="text-on-surface">{selectedCert.notBefore}</span>
                </div>
                <div>
                  <span className="text-outline block">NOT AFTER:</span>
                  <span className="text-on-surface">{selectedCert.notAfter}</span>
                </div>
              </div>
            </div>

            {/* X.509 Extensions */}
            <div className="p-3 border-b border-outline-variant">
              <div className="text-[10px] font-mono text-outline mb-2 flex items-center justify-between">
                <span>X.509 v3 EXTENSIONS RECORD</span>
                <span className="text-primary font-mono text-[9px]">RFC 5280</span>
              </div>
              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="p-1.5 bg-surface-container-low border border-outline-variant/60">
                  <span className="text-outline block text-[9px]">KEY USAGE (CRITICAL):</span>
                  <span className="text-on-surface">{selectedCert.keyUsage}</span>
                </div>
                <div className="p-1.5 bg-surface-container-low border border-outline-variant/60">
                  <span className="text-outline block text-[9px]">EXTENDED KEY USAGE (EKU):</span>
                  <span className="text-on-surface">{selectedCert.eku}</span>
                </div>
                <div className="p-1.5 bg-surface-container-low border border-outline-variant/60">
                  <span className="text-outline block text-[9px]">CRL DISTRIBUTION POINT (CDP):</span>
                  <span className="text-primary break-all text-[9px]">{selectedCert.cdp}</span>
                </div>
                <div className="p-1.5 bg-surface-container-low border border-outline-variant/60">
                  <span className="text-outline block text-[9px]">AUTHORITY INFORMATION ACCESS (OCSP):</span>
                  <span className="text-primary break-all text-[9px]">{selectedCert.aia}</span>
                </div>
              </div>
            </div>

            {/* Revocation Staging Console */}
            <div className="p-3 border-b border-outline-variant bg-error/5">
              <div className="flex items-center space-x-1.5 mb-2 text-error">
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                  REVOCATION STAGING COMMAND
                </span>
              </div>

              {/* Reason Selector */}
              <div className="mb-2.5">
                <label className="text-[10px] font-mono text-outline block mb-1">
                  REVOCATION REASON (RFC 5280 CODE):
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-xs font-mono text-on-surface py-1 px-2 focus:border-error focus:ring-0 cursor-pointer"
                >
                  <option value="1">Code 1: Key Compromise (Immediate Disavow)</option>
                  <option value="2">Code 2: CA Compromise (Catastrophic)</option>
                  <option value="3">Code 3: Affiliation Changed</option>
                  <option value="4">Code 4: Superseded by New Issuance</option>
                  <option value="5">Code 5: Cessation of Operation</option>
                  <option value="6">Code 6: Certificate Hold (Temporary)</option>
                </select>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-1 mb-3 text-[11px] font-mono text-on-surface-variant">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flushOcsp}
                    onChange={(e) => setFlushOcsp(e.target.checked)}
                    className="w-3.5 h-3.5 bg-surface-container-low border-outline-variant text-error rounded-none focus:ring-0"
                  />
                  <span>Flush Distributed OCSP Fast-Staple Caches</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastRelays}
                    onChange={(e) => setBroadcastRelays(e.target.checked)}
                    className="w-3.5 h-3.5 bg-surface-container-low border-outline-variant text-error rounded-none focus:ring-0"
                  />
                  <span>Broadcast to All 48 Edge Gateway Relays</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReissue}
                    onChange={(e) => setAutoReissue(e.target.checked)}
                    className="w-3.5 h-3.5 bg-surface-container-low border-outline-variant text-error rounded-none focus:ring-0"
                  />
                  <span>Initiate Automated Key Re-issuance Ticket</span>
                </label>
              </div>

              {/* Revoke Execution Button */}
              <button
                disabled={isRevoking || selectedCert.validityStatus === 'REVOKED'}
                onClick={handleExecuteRevocation}
                className={`w-full text-xs font-mono py-2 px-3 border font-bold flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer ${
                  selectedCert.validityStatus === 'REVOKED'
                    ? 'bg-surface-container text-outline border-outline-variant cursor-not-allowed'
                    : isRevoking
                    ? 'bg-error/70 text-surface border-error'
                    : 'bg-error hover:bg-error/90 text-surface border-error active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isRevoking ? 'sync' : 'warning'}
                </span>
                <span>
                  {selectedCert.validityStatus === 'REVOKED'
                    ? 'CERTIFICATE ALREADY REVOKED'
                    : isRevoking
                    ? 'COMMITTING TO MERKLE CRL...'
                    : 'EXECUTE IMMEDIATE REVOCATION'}
                </span>
              </button>
            </div>

            {/* Live Edge Broadcast & Kafka Audit Log */}
            <div className="p-3">
              <div className="text-[10px] font-mono text-outline mb-1.5 flex items-center justify-between">
                <span>EDGE BROADCAST &amp; KAFKA AUDIT LOG</span>
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
              </div>
              <div
                ref={logStreamRef}
                className="space-y-1 font-mono text-[10px] text-on-surface-variant bg-surface p-2 border border-outline-variant max-h-32 overflow-y-auto"
              >
                {logs.map((l, i) => (
                  <div key={i} className="flex items-start space-x-1 leading-tight">
                    <span className="text-outline">[{l.time}]</span>
                    <span
                      className={
                        l.type === 'OK'
                          ? 'text-secondary font-semibold'
                          : l.type === 'INFO' || l.type === 'SIG'
                          ? 'text-primary'
                          : l.type === 'WARN'
                          ? 'text-amber-400'
                          : l.type === 'ERROR'
                          ? 'text-error font-bold'
                          : 'text-amber-400'
                      }
                    >
                      {l.type}:
                    </span>
                    <span className="truncate">{l.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Bottom Actions */}
          <div className="p-2.5 border-t border-outline-variant bg-surface-container-high/40 flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportPEM}
              className="flex-1 bg-surface-container border border-outline-variant hover:border-primary text-on-surface text-[11px] font-mono py-1.5 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>EXPORT .PEM</span>
            </button>
            <button
              onClick={() => setIsVerifyModalOpen(true)}
              className="flex-1 bg-surface-container border border-outline-variant hover:border-primary text-on-surface text-[11px] font-mono py-1.5 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>VERIFY PATH</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE CERTIFICATE MODAL                                         */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant shadow-2xl p-4 flex flex-col space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-primary text-base">add_moderator</span>
                <span className="text-xs font-bold text-primary uppercase">
                  ISSUE NEW X.509 CREDENTIAL // AIR-GAP AUTHORIZED
                </span>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-on-surface-variant hover:text-error text-xs cursor-pointer"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-outline block mb-1">
                  SUBJECT COMMON NAME (CN):
                </label>
                <input
                  required
                  type="text"
                  value={newCertCN}
                  onChange={(e) => setNewCertCN(e.target.value)}
                  placeholder="e.g. agt-8812-kovacs.bravo.veille.internal"
                  className="w-full bg-surface-container-low border border-outline-variant focus:border-primary text-on-surface font-mono px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-outline block mb-1">
                    ISSUING SUB-CA:
                  </label>
                  <select
                    value={newCertCA}
                    onChange={(e) => setNewCertCA(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface py-1.5 px-2 focus:border-primary cursor-pointer"
                  >
                    <option>CA-02 [IDENTITY]</option>
                    <option>CA-01 [GATEWAY]</option>
                    <option>CA-03 [M2M MESH]</option>
                    <option>CA-04 [FORENSICS]</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-outline block mb-1">
                    KEY ALGORITHM SPEC:
                  </label>
                  <select
                    value={newCertAlgo}
                    onChange={(e) => setNewCertAlgo(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface py-1.5 px-2 focus:border-primary cursor-pointer"
                  >
                    <option>Ed25519 (256-bit)</option>
                    <option>ECDSA-P384</option>
                    <option>CRYSTALS-Dilithium3 (PQC)</option>
                    <option>RSA-4096 / SHA-512</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-outline block mb-1">
                  SCOPE &amp; OPERATOR ROLE / SAN:
                </label>
                <input
                  type="text"
                  value={newCertScope}
                  onChange={(e) => setNewCertScope(e.target.value)}
                  placeholder="e.g. UID: AGT-8812 // Tactical Cryptanalysis Lead"
                  className="w-full bg-surface-container-low border border-outline-variant focus:border-primary text-on-surface font-mono px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="p-2 bg-surface-container-low border border-outline-variant text-[10px] text-on-surface-variant flex items-center justify-between">
                <span>ENCLAVE HARDWARE SIGNING:</span>
                <span className="text-secondary font-bold">FIPS 140-3 LEVEL 4 (ONLINE)</span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface-variant text-[11px] hover:bg-surface-container-high cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-fixed text-on-primary-fixed font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>SIGN &amp; ISSUE CERTIFICATE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VERIFY PATH MODAL                                               */}
      {/* ========================================================================= */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant shadow-2xl p-4 flex flex-col space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-secondary text-base">verified</span>
                <span className="text-xs font-bold text-on-surface uppercase">
                  X.509 CERTIFICATE CHAIN VALIDATION (RFC 5280)
                </span>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-on-surface-variant hover:text-error text-xs cursor-pointer"
              >
                ✕ ESC
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Node 1: Root CA */}
              <div className="p-2.5 bg-surface-container-low border border-secondary/40 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-outline">TIER 0 // ROOT TRUST ANCHOR</div>
                  <div className="font-bold text-on-surface">VEILLE MASTER ROOT CA (AIRGAP)</div>
                  <div className="text-[10px] text-outline">SHA256: 0x99A8...B12F</div>
                </div>
                <span className="text-secondary text-[9px] border border-secondary/40 px-1.5 py-0.5 bg-secondary/10">
                  TRUSTED ANCHOR
                </span>
              </div>

              <div className="flex justify-center -my-1 text-outline">
                <span className="material-symbols-outlined text-xs">arrow_downward</span>
              </div>

              {/* Node 2: Sub-CA */}
              <div className="p-2.5 bg-surface-container-low border border-primary/40 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-outline">TIER 1 // INTERMEDIATE ISSUER</div>
                  <div className="font-bold text-primary">{selectedCert.issuingCA}</div>
                  <div className="text-[10px] text-outline">CDP: {selectedCert.cdp}</div>
                </div>
                <span className="text-primary text-[9px] border border-primary/40 px-1.5 py-0.5 bg-primary/10">
                  CHAIN VALID
                </span>
              </div>

              <div className="flex justify-center -my-1 text-outline">
                <span className="material-symbols-outlined text-xs">arrow_downward</span>
              </div>

              {/* Node 3: Target Leaf */}
              <div className="p-2.5 bg-surface-container-low border border-outline-variant flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-outline">LEAF // END-ENTITY TARGET</div>
                  <div className="font-bold text-on-surface">{selectedCert.subjectCN}</div>
                  <div className="text-[10px] text-outline">Serial: {selectedCert.serial}</div>
                </div>
                <span
                  className={`text-[9px] border px-1.5 py-0.5 ${
                    selectedCert.validityStatus === 'REVOKED'
                      ? 'border-error text-error bg-error/10'
                      : 'border-secondary text-secondary bg-secondary/10'
                  }`}
                >
                  {selectedCert.validityStatus === 'REVOKED' ? 'DISAVOWED' : 'CRYPTOGRAPHICALLY VALID'}
                </span>
              </div>
            </div>

            <div className="p-2 bg-surface-container-high border border-outline-variant text-[10px] text-secondary flex items-center justify-between">
              <span>OCSP REAL-TIME STAPLE:</span>
              <span className="font-bold">STATUS 200 (LATENCY 0.38ms)</span>
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant">
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-4 py-1.5 bg-primary hover:bg-primary-fixed text-on-primary-fixed font-bold text-[11px] cursor-pointer"
              >
                CLOSE INSPECTION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EMERGENCY CRL PUBLISH CONFIRMATION                              */}
      {/* ========================================================================= */}
      {isEmergencyCrlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest border border-error shadow-2xl p-4 flex flex-col space-y-3 font-mono">
            <div className="flex items-center space-x-2 text-error pb-2 border-b border-error/40">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="text-xs font-bold uppercase">
                EMERGENCY DELTA CRL BROADCAST
              </span>
            </div>

            <p className="text-xs text-on-surface leading-relaxed font-sans">
              This action will immediately compile all 4 Sub-CA revocation queues, sign the new Delta CRL with the HSM Master Key, and broadcast updates to all 48 zero-trust edge proxies and reverse-TLS gateways.
            </p>

            <div className="p-2 bg-error/10 border border-error/30 text-[10px] text-error space-y-1">
              <div>• HSM Key: <code>KEY-ED25519-MERKLE (Slot 03)</code></div>
              <div>• Destination: 48 Edge Gateway Relay nodes</div>
              <div>• Delta Serial: Epoch #1,402 CRL Commit</div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-outline-variant">
              <button
                onClick={() => setIsEmergencyCrlOpen(false)}
                className="px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface-variant text-[11px] hover:bg-surface-container-high cursor-pointer"
              >
                ABORT
              </button>
              <button
                onClick={handleEmergencyCrlPublish}
                className="px-4 py-1.5 bg-error hover:bg-error/90 text-surface font-bold text-[11px] flex items-center space-x-1 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              >
                <span className="material-symbols-outlined text-xs">published_with_changes</span>
                <span>EXECUTE CRL BROADCAST</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PKIRevocation;
