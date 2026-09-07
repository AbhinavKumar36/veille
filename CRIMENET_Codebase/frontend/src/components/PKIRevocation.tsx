import React, { useState } from 'react';

export interface CertificateItem {
  id: string;
  serial: string;
  digest: string;
  subjectCN: string;
  scope: string;
  issuingCA: string;
  algorithm: string;
  validityStatus: 'VALID' | 'REVOKED' | 'EXPIRING' | 'SUSPENDED';
  notBefore: string;
  notAfter: string;
  keyUsage: string;
  icon: string;
  san?: string[];
  ocspUrl?: string;
  crlUrl?: string;
  fingerprintSha256?: string;
  publicKeySize?: string;
  revocationReason?: string;
}

const INITIAL_CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-1',
    serial: '44:AE:90:12:BC:65',
    digest: 'SHA256: 8f9b...a12c',
    subjectCN: 'agt-9024-vance.delta.veille.internal',
    scope: 'Field Investigator Credential',
    issuingCA: 'Identity Sub-CA 02',
    algorithm: 'Ed25519 (256-bit)',
    validityStatus: 'VALID',
    notBefore: '2025-01-01',
    notAfter: '2026-01-01',
    keyUsage: 'Client Authentication, Digital Signature, Non-Repudiation',
    icon: 'person',
    san: ['DNS:vance.investigator.veille.internal', 'URI:spiffe://veille.internal/agt/9024'],
    ocspUrl: 'http://ocsp.veille.internal:8080/pki',
    crlUrl: 'http://crl.veille.internal/crl/subca2.crl',
    fingerprintSha256: '8F:9B:41:02:EA:77:33:91:BC:01:DF:88:54:19:A1:2C:99:EE:41:00:22:98:BB:71',
    publicKeySize: '256-bit Edwards Curve'
  },
  {
    id: 'cert-2',
    serial: '1B:9C:38:FA:72:01',
    digest: 'SHA256: d041...c889',
    subjectCN: 'wiretap-gateway-node-04b.ext.veille',
    scope: 'Gateway Intercept Relay',
    issuingCA: 'Gateway Sub-CA 01',
    algorithm: 'ECDSA-P384',
    validityStatus: 'REVOKED',
    notBefore: '2024-05-10',
    notAfter: '2025-05-10',
    keyUsage: 'Server Authentication, TLS Handshake, Key Encipherment',
    icon: 'router',
    san: ['DNS:wiretap-04b.ext.veille', 'IP:10.240.12.84'],
    ocspUrl: 'http://ocsp.veille.internal:8080/pki',
    crlUrl: 'http://crl.veille.internal/crl/gatewayca1.crl',
    fingerprintSha256: 'D0:41:88:99:A2:11:F4:77:E5:33:00:19:C8:89:14:02:99:11:AB:66:33:41:89:01',
    publicKeySize: '384-bit Prime Curve',
    revocationReason: 'Key Compromise (Reported by Security Officer)'
  },
  {
    id: 'cert-3',
    serial: '88:31:02:DE:F4:99',
    digest: 'SHA256: 33ee...59b0',
    subjectCN: 'rag-worker-cluster.k8s.internal',
    scope: 'AI Inference Service Mesh',
    issuingCA: 'ServiceMesh CA 03',
    algorithm: 'CRYSTALS-Dilithium3 (Post-Quantum)',
    validityStatus: 'EXPIRING',
    notBefore: '2025-05-01',
    notAfter: '2025-09-10',
    keyUsage: 'mTLS Node Authentication, Pod Signatures',
    icon: 'dns',
    san: ['DNS:rag-worker.k8s.internal', 'DNS:ai-inference.svc.cluster.local'],
    ocspUrl: 'http://ocsp.veille.internal:8080/pki',
    crlUrl: 'http://crl.veille.internal/crl/meshca3.crl',
    fingerprintSha256: '33:EE:44:91:02:AA:77:FF:66:01:99:E1:59:B0:12:44:CC:88:33:11:44:22:90:55',
    publicKeySize: 'Post-Quantum Lattice (Level 3)'
  },
  {
    id: 'cert-4',
    serial: '02:FA:11:78:E5:3C',
    digest: 'SHA256: e87c...19a4',
    subjectCN: 'tsa-evidence-signer.corp',
    scope: 'Forensic Timestamp Authority',
    issuingCA: 'Forensic CA 04',
    algorithm: 'RSA-4096 / SHA-512',
    validityStatus: 'VALID',
    notBefore: '2024-06-01',
    notAfter: '2027-06-01',
    keyUsage: 'Evidence Time-Stamping, Non-Repudiation, Document Integrity',
    icon: 'timer',
    san: ['DNS:tsa.evidence.veille.internal'],
    ocspUrl: 'http://ocsp.veille.internal:8080/pki',
    crlUrl: 'http://crl.veille.internal/crl/forensic4.crl',
    fingerprintSha256: 'E8:7C:19:A4:99:33:41:00:88:12:FF:EE:22:41:88:99:55:12:00:AA:33:91:88:42',
    publicKeySize: '4096-bit RSA'
  },
  {
    id: 'cert-5',
    serial: '91:3D:7A:B4:80:C1',
    digest: 'SHA256: 77a1...df02',
    subjectCN: 'agt-7718-miller.omega.veille.internal',
    scope: 'Cyber Forensics Lead',
    issuingCA: 'Identity Sub-CA 02',
    algorithm: 'Ed25519 (256-bit)',
    validityStatus: 'VALID',
    notBefore: '2025-03-01',
    notAfter: '2026-03-01',
    keyUsage: 'Client Authentication, Digital Signature',
    icon: 'person',
    san: ['DNS:miller.forensics.veille.internal'],
    ocspUrl: 'http://ocsp.veille.internal:8080/pki',
    crlUrl: 'http://crl.veille.internal/crl/subca2.crl',
    fingerprintSha256: '77:A1:DF:02:99:41:22:00:EE:88:31:02:AA:BC:99:11:44:22:00:88:33:11:77:44',
    publicKeySize: '256-bit Edwards Curve'
  }
];

export const PKIRevocation: React.FC = () => {
  const [certs, setCerts] = useState<CertificateItem[]>(INITIAL_CERTIFICATES);
  const [selectedCert, setSelectedCert] = useState<CertificateItem>(INITIAL_CERTIFICATES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED' | 'EXPIRING'>('ALL');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedCertId, setExpandedCertId] = useState<string | null>(INITIAL_CERTIFICATES[0].id);

  // New Certificate Form
  const [newCN, setNewCN] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newCA, setNewCA] = useState('Identity Sub-CA 02');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRevoke = (cert: CertificateItem) => {
    const updated = certs.map((c) =>
      c.id === cert.id
        ? {
            ...c,
            validityStatus: 'REVOKED' as const,
            revocationReason: 'Manually Revoked by Security Officer'
          }
        : c
    );
    setCerts(updated);
    const curr = updated.find((c) => c.id === cert.id);
    if (curr) setSelectedCert(curr);
    showToast(`Certificate "${cert.subjectCN}" has been revoked.`);
  };

  const handleRenew = (cert: CertificateItem) => {
    const updated = certs.map((c) =>
      c.id === cert.id
        ? {
            ...c,
            validityStatus: 'VALID' as const,
            notAfter: '2027-01-01',
            revocationReason: undefined
          }
        : c
    );
    setCerts(updated);
    const curr = updated.find((c) => c.id === cert.id);
    if (curr) setSelectedCert(curr);
    showToast(`Certificate "${cert.subjectCN}" has been renewed for 1 year.`);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCN) return;

    const newCert: CertificateItem = {
      id: `cert-${Date.now()}`,
      serial: Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':'),
      digest: `SHA256: ${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      subjectCN: newCN,
      scope: newScope || 'Operator Credential',
      issuingCA: newCA,
      algorithm: 'Ed25519 (256-bit)',
      validityStatus: 'VALID',
      notBefore: new Date().toISOString().split('T')[0],
      notAfter: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      keyUsage: 'Client Authentication, Digital Signature',
      icon: 'badge',
      san: [`DNS:${newCN.replace(/[^a-zA-Z0-9.-]/g, '')}`],
      ocspUrl: 'http://ocsp.veille.internal:8080/pki',
      crlUrl: 'http://crl.veille.internal/crl/subca2.crl',
      fingerprintSha256: Array.from({ length: 12 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':'),
      publicKeySize: '256-bit Edwards Curve'
    };

    setCerts([newCert, ...certs]);
    setSelectedCert(newCert);
    setExpandedCertId(newCert.id);
    setIsIssueModalOpen(false);
    setNewCN('');
    setNewScope('');
    showToast(`Successfully issued certificate for "${newCert.subjectCN}"`);
  };

  const filteredCerts = certs.filter((cert) => {
    const matchQuery =
      cert.subjectCN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.scope.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || cert.validityStatus === statusFilter;
    return matchQuery && matchStatus;
  });

  const validCount = certs.filter((c) => c.validityStatus === 'VALID').length;
  const revokedCount = certs.filter((c) => c.validityStatus === 'REVOKED').length;
  const expiringCount = certs.filter((c) => c.validityStatus === 'EXPIRING').length;

  return (
    <div className="space-y-6 -m-4 lg:-m-8 p-4 lg:p-6 bg-surface text-on-surface font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-sky-500/50 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium animate-fade-in font-mono">
          <span className="material-symbols-outlined text-sky-400 text-[18px]">verified_user</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5 font-headline-sm">
            <span className="material-symbols-outlined text-primary text-[26px]">verified_user</span>
            VEILLE // PKI &amp; TRUST OPERATIONS CONSOLE
          </h1>
          <p className="text-xs text-outline mt-1 font-mono">
            Zero-Trust Credential Lifecycle: unified certificate details, revocation lists (CRL), and cryptographic telemetry.
          </p>
        </div>
        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-fixed-dim text-surface-container-lowest text-xs font-bold font-mono px-4 py-2.5 rounded shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_moderator</span>
          <span>ISSUE CERTIFICATE</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-3.5">
          <div className="text-outline text-[10px] font-bold uppercase">TOTAL MANAGED CERTS</div>
          <div className="text-xl font-bold text-white mt-1">{certs.length} Active Keys</div>
          <div className="text-[10px] text-outline mt-0.5">Root &amp; Subordinate CAs</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-3.5">
          <div className="text-emerald-400 text-[10px] font-bold uppercase">VALID CREDENTIALS</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{validCount} Verified</div>
          <div className="text-[10px] text-outline mt-0.5">mTLS &amp; Non-Repudiation</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-3.5">
          <div className="text-amber-400 text-[10px] font-bold uppercase">EXPIRING (&lt; 30 DAYS)</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{expiringCount} Pending Rotation</div>
          <div className="text-[10px] text-outline mt-0.5">Automated Re-issuance</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-3.5">
          <div className="text-red-400 text-[10px] font-bold uppercase">REVOKED (ON CRL)</div>
          <div className="text-xl font-bold text-red-400 mt-1">{revokedCount} Quarantined</div>
          <div className="text-[10px] text-outline mt-0.5">OCSP Status: Blocked</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-container-low border border-outline-variant p-3 rounded font-mono text-xs">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Common Name, serial, or CA..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-outline focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'VALID', 'EXPIRING', 'REVOKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-outline hover:text-white hover:bg-surface-container-high'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Main Content: Master Certificate Grid & Merged Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Certificate Table (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant text-outline font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Subject &amp; Scope</th>
                  <th className="py-2.5 px-3">Serial</th>
                  <th className="py-2.5 px-3">Issuer CA</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {filteredCerts.map((cert) => {
                  const isSelected = selectedCert.id === cert.id;
                  const isExpanded = expandedCertId === cert.id;
                  return (
                    <React.Fragment key={cert.id}>
                      <tr
                        onClick={() => {
                          setSelectedCert(cert);
                          setExpandedCertId(isExpanded ? null : cert.id);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-surface-container-high/40'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[16px]">{cert.icon}</span>
                            <span className="truncate max-w-[160px]">{cert.subjectCN}</span>
                          </div>
                          <div className="text-[10px] text-outline mt-0.5">{cert.scope}</div>
                        </td>
                        <td className="py-3 px-3 text-outline text-[11px] font-mono">
                          {cert.serial}
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant text-[11px]">
                          {cert.issuingCA}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                              cert.validityStatus === 'VALID'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : cert.validityStatus === 'EXPIRING'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}
                          >
                            {cert.validityStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCert(cert);
                              setExpandedCertId(isExpanded ? null : cert.id);
                            }}
                            className="text-primary hover:text-primary-fixed-dim text-xs font-bold cursor-pointer"
                          >
                            {isExpanded ? 'Collapse' : 'Merge View'}
                          </button>
                        </td>
                      </tr>

                      {/* Inline Merged Certificate Spec Drawer */}
                      {isExpanded && (
                        <tr className="bg-surface-container-low border-b border-primary/20">
                          <td colSpan={5} className="p-3">
                            <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded space-y-2 text-[11px] text-on-surface">
                              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-1.5 text-primary font-bold">
                                <span>MERGED CRYPTOGRAPHIC ATTRIBUTES</span>
                                <span className="text-[10px] text-outline">{cert.algorithm}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-outline block">SHA-256 FINGERPRINT:</span>
                                  <span className="text-on-surface font-mono break-all">{cert.fingerprintSha256 || cert.digest}</span>
                                </div>
                                <div>
                                  <span className="text-outline block">KEY SIZE &amp; CURVE:</span>
                                  <span className="text-secondary font-bold">{cert.publicKeySize || '256-bit'}</span>
                                </div>
                                <div>
                                  <span className="text-outline block">OCSP RESPONDER:</span>
                                  <span className="text-on-surface">{cert.ocspUrl || 'http://ocsp.veille.internal'}</span>
                                </div>
                                <div>
                                  <span className="text-outline block">CRL DISTRIBUTION:</span>
                                  <span className="text-on-surface">{cert.crlUrl || 'http://crl.veille.internal/crl'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unified Merged Details & Operations Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                <span>MERGED CERTIFICATE TELEMETRY</span>
              </h3>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                  selectedCert.validityStatus === 'VALID'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : selectedCert.validityStatus === 'EXPIRING'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                }`}
              >
                {selectedCert.validityStatus}
              </span>
            </div>

            {/* Subject Details */}
            <div className="space-y-2">
              <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded space-y-1">
                <div className="text-outline text-[10px] uppercase font-bold">COMMON NAME (SUBJECT)</div>
                <div className="font-bold text-white text-xs break-all">{selectedCert.subjectCN}</div>
                <div className="text-[10px] text-primary">{selectedCert.scope}</div>
              </div>

              <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">SERIAL NUMBER:</span>
                  <span className="text-on-surface font-mono">{selectedCert.serial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">ISSUING CA:</span>
                  <span className="text-secondary font-bold">{selectedCert.issuingCA}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">ALGORITHM:</span>
                  <span className="text-on-surface">{selectedCert.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">KEY USAGE:</span>
                  <span className="text-on-surface-variant text-right max-w-[65%]">{selectedCert.keyUsage}</span>
                </div>
              </div>

              {/* SHA256 Fingerprint */}
              <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded space-y-1">
                <div className="text-outline text-[10px] uppercase font-bold">SHA-256 THUMBPRINT</div>
                <div className="text-primary font-mono text-[10px] break-all">
                  {selectedCert.fingerprintSha256 || selectedCert.digest}
                </div>
              </div>

              {/* SAN list */}
              {selectedCert.san && selectedCert.san.length > 0 && (
                <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded space-y-1">
                  <div className="text-outline text-[10px] uppercase font-bold">SUBJECT ALTERNATIVE NAMES (SAN)</div>
                  <div className="space-y-0.5">
                    {selectedCert.san.map((s, idx) => (
                      <div key={idx} className="text-[10px] text-on-surface font-mono">{s}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validity Window */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 bg-surface-container-low border border-outline-variant rounded">
                  <span className="text-outline block">VALID FROM:</span>
                  <span className="text-on-surface font-bold">{selectedCert.notBefore}</span>
                </div>
                <div className="p-2 bg-surface-container-low border border-outline-variant rounded">
                  <span className="text-outline block">EXPIRES ON:</span>
                  <span className="text-secondary font-bold">{selectedCert.notAfter}</span>
                </div>
              </div>

              {selectedCert.revocationReason && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
                  <strong>REVOCATION REASON:</strong> {selectedCert.revocationReason}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-outline-variant flex items-center gap-2">
            {selectedCert.validityStatus === 'REVOKED' ? (
              <button
                onClick={() => handleRenew(selectedCert)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>RE-INSTATE CERTIFICATE</span>
              </button>
            ) : (
              <button
                onClick={() => handleRevoke(selectedCert)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
                <span>REVOKE CREDENTIAL</span>
              </button>
            )}

            <button
              onClick={() => showToast(`Exported public PEM certificate for ${selectedCert.subjectCN}`)}
              className="px-3 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-primary rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Export Public Certificate"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>PEM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Issue Certificate Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-6 font-mono text-xs animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_moderator</span>
                <span>ISSUE NEW PKI CERTIFICATE</span>
              </h3>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">SUBJECT COMMON NAME (CN)</label>
                <input
                  type="text"
                  value={newCN}
                  onChange={(e) => setNewCN(e.target.value)}
                  placeholder="e.g. agt-9031-rao.veille.internal"
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-white focus:outline-none focus:border-primary rounded"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">CREDENTIAL SCOPE</label>
                <input
                  type="text"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder="e.g. Lead Intelligence Analyst"
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-white focus:outline-none focus:border-primary rounded"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">ISSUING SUB-CA</label>
                <select
                  value={newCA}
                  onChange={(e) => setNewCA(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-primary focus:outline-none focus:border-primary rounded"
                >
                  <option value="Identity Sub-CA 02">Identity Sub-CA 02 (Operator Credentials)</option>
                  <option value="Gateway Sub-CA 01">Gateway Sub-CA 01 (Wiretap Relays)</option>
                  <option value="ServiceMesh CA 03">ServiceMesh CA 03 (AI Workload Pods)</option>
                  <option value="Forensic CA 04">Forensic CA 04 (Timestamp Authority)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-3 py-1.5 bg-surface-container-low border border-outline-variant text-outline hover:text-white rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold rounded hover:bg-primary-fixed-dim transition-colors cursor-pointer"
                >
                  GENERATE &amp; SIGN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PKIRevocation;
