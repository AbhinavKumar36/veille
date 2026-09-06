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
    keyUsage: 'Client Authentication, Digital Signature',
    icon: 'person'
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
    keyUsage: 'Server Authentication, TLS Handshake',
    icon: 'router',
    revocationReason: 'Key Compromise (Reported)'
  },
  {
    id: 'cert-3',
    serial: '88:31:02:DE:F4:99',
    digest: 'SHA256: 33ee...59b0',
    subjectCN: 'rag-worker-cluster.k8s.internal',
    scope: 'AI Inference Service Mesh',
    issuingCA: 'ServiceMesh CA 03',
    algorithm: 'CRYSTALS-Dilithium3',
    validityStatus: 'EXPIRING',
    notBefore: '2025-05-01',
    notAfter: '2025-09-10',
    keyUsage: 'mTLS Node Authentication',
    icon: 'dns'
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
    keyUsage: 'Evidence Time-Stamping, Non-Repudiation',
    icon: 'timer'
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
    icon: 'person'
  }
];

export const PKIRevocation: React.FC = () => {
  const [certs, setCerts] = useState<CertificateItem[]>(INITIAL_CERTIFICATES);
  const [selectedCert, setSelectedCert] = useState<CertificateItem>(INITIAL_CERTIFICATES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED' | 'EXPIRING'>('ALL');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      icon: 'badge'
    };

    setCerts([newCert, ...certs]);
    setSelectedCert(newCert);
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
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-sky-500/50 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium animate-fade-in">
          <span className="material-symbols-outlined text-sky-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-sky-400 text-[28px]">verified_user</span>
            PKI &amp; Trust Operations Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Certificate lifecycle console: manage operator credentials, TLS trust stores, and revocation lists.
          </p>
        </div>
        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Issue Certificate</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium">Total Managed</div>
          <div className="text-2xl font-bold text-white mt-1">{certs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Root &amp; Subordinate CAs</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-emerald-400 text-xs font-medium">Active &amp; Valid</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{validCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for authentication</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-amber-400 text-xs font-medium">Expiring Soon</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{expiringCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires rotation</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-red-400 text-xs font-medium">Revoked</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{revokedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">On active CRL</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, serial, or scope..."
            className="w-full bg-slate-950/60 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'VALID', 'EXPIRING', 'REVOKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Table (Left) + Detail Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Table */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Subject &amp; Scope</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Issuer CA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCerts.map((cert) => {
                  const isSelected = selectedCert.id === cert.id;
                  return (
                    <tr
                      key={cert.id}
                      onClick={() => setSelectedCert(cert)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-[16px]">{cert.icon}</span>
                          <span className="truncate max-w-[180px]">{cert.subjectCN}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{cert.scope}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {cert.serial}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {cert.issuingCA}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            cert.validityStatus === 'VALID'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : cert.validityStatus === 'EXPIRING'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {cert.validityStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCert(cert);
                          }}
                          className="text-sky-400 hover:text-sky-300 text-xs font-medium"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate Inspector Details Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-[18px]">badge</span>
                Certificate Details
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedCert.validityStatus === 'VALID'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : selectedCert.validityStatus === 'EXPIRING'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {selectedCert.validityStatus}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">Subject Common Name</div>
                <div className="font-medium text-white break-all">{selectedCert.subjectCN}</div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px]">Serial Number</div>
                <div className="font-mono text-slate-300">{selectedCert.serial}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-400 text-[11px]">Algorithm</div>
                  <div className="text-slate-200">{selectedCert.algorithm}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Issuing CA</div>
                  <div className="text-slate-200">{selectedCert.issuingCA}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-400 text-[11px]">Valid From</div>
                  <div className="text-slate-300">{selectedCert.notBefore}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Expires On</div>
                  <div className="text-slate-300">{selectedCert.notAfter}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px]">Key Usage</div>
                <div className="text-slate-300">{selectedCert.keyUsage}</div>
              </div>

              {selectedCert.revocationReason && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
                  <strong>Reason:</strong> {selectedCert.revocationReason}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-5 border-t border-slate-800 mt-5 flex items-center gap-2">
            {selectedCert.validityStatus === 'REVOKED' ? (
              <button
                onClick={() => handleRenew(selectedCert)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Re-instate / Renew</span>
              </button>
            ) : (
              <button
                onClick={() => handleRevoke(selectedCert)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
                <span>Revoke Access</span>
              </button>
            )}

            <button
              onClick={() => showToast(`Exported public PEM certificate for ${selectedCert.subjectCN}`)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Export Public Certificate"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Issue Certificate Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400">add_moderator</span>
                Issue New Certificate
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Common Name (CN)</label>
                <input
                  type="text"
                  value={newCN}
                  onChange={(e) => setNewCN(e.target.value)}
                  placeholder="e.g. agt-8812-jones.veille.internal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Scope / Role</label>
                <input
                  type="text"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder="e.g. Field Investigator Level 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Issuing Authority (Sub-CA)</label>
                <select
                  value={newCA}
                  onChange={(e) => setNewCA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Identity Sub-CA 02">Identity Sub-CA 02 (Operator Smartcards)</option>
                  <option value="Gateway Sub-CA 01">Gateway Sub-CA 01 (Wiretap Relays)</option>
                  <option value="ServiceMesh CA 03">ServiceMesh CA 03 (Kubernetes Cluster)</option>
                  <option value="Forensic CA 04">Forensic CA 04 (TSA Timestamp Signer)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold shadow-md shadow-sky-500/20"
                >
                  Create &amp; Sign
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
