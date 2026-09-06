import React, { useState } from 'react';

export interface KeyItem {
  id: string;
  alias: string;
  type: 'Master KEK' | 'Data DEK' | 'Stream Key' | 'Audit Key';
  algorithm: string;
  purpose: string;
  status: 'ACTIVE' | 'ROTATION_DUE' | 'ARCHIVED';
  createdDate: string;
  expiresIn: string;
  fingerprint: string;
}

const INITIAL_KEYS: KeyItem[] = [
  {
    id: 'key-1',
    alias: 'KEY-ROOT-CERBERUS-01',
    type: 'Master KEK',
    algorithm: 'AES-256-GCM',
    purpose: 'Case Master Envelope Encryption',
    status: 'ACTIVE',
    createdDate: '2025-01-15',
    expiresIn: '180 days',
    fingerprint: '8f4a3c1e...12001'
  },
  {
    id: 'key-2',
    alias: 'KEY-KYBER-PQC-02',
    type: 'Stream Key',
    algorithm: 'Kyber-1024 / Dilithium',
    purpose: 'Zero-Trust Gateway Bridge',
    status: 'ACTIVE',
    createdDate: '2025-02-01',
    expiresIn: '240 days',
    fingerprint: '0029bfa8...ba01'
  },
  {
    id: 'key-3',
    alias: 'KEY-ED25519-AUDIT',
    type: 'Audit Key',
    algorithm: 'Ed25519-EdDSA',
    purpose: 'Forensic Immutable Audit Ledger Signer',
    status: 'ROTATION_DUE',
    createdDate: '2024-09-01',
    expiresIn: '2 days (Due)',
    fingerprint: '7c9ea1b2...4b88'
  },
  {
    id: 'key-4',
    alias: 'KEY-AES256-DEK-EVIDENCE',
    type: 'Data DEK',
    algorithm: 'AES-256-GCM',
    purpose: 'Evidence Document & Transcript Encryption',
    status: 'ACTIVE',
    createdDate: '2025-03-10',
    expiresIn: '360 days',
    fingerprint: '11fe4a92...99ca'
  }
];

export const KeyVaultHSM: React.FC = () => {
  const [keys, setKeys] = useState<KeyItem[]>(INITIAL_KEYS);
  const [selectedKey, setSelectedKey] = useState<KeyItem>(INITIAL_KEYS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [newAlias, setNewAlias] = useState('');
  const [newType, setNewType] = useState<'Data DEK' | 'Master KEK' | 'Stream Key'>('Data DEK');
  const [newPurpose, setNewPurpose] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRotateKey = (key: KeyItem) => {
    const updated = keys.map((k) =>
      k.id === key.id
        ? {
            ...k,
            status: 'ACTIVE' as const,
            expiresIn: '365 days',
            fingerprint: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`
          }
        : k
    );
    setKeys(updated);
    const curr = updated.find((k) => k.id === key.id);
    if (curr) setSelectedKey(curr);
    showToast(`Key "${key.alias}" rotated successfully with a new cryptographic epoch.`);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias) return;

    const newKey: KeyItem = {
      id: `key-${Date.now()}`,
      alias: newAlias.toUpperCase(),
      type: newType,
      algorithm: 'AES-256-GCM',
      purpose: newPurpose || 'General Case Data Encryption',
      status: 'ACTIVE',
      createdDate: new Date().toISOString().split('T')[0],
      expiresIn: '365 days',
      fingerprint: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`
    };

    setKeys([newKey, ...keys]);
    setSelectedKey(newKey);
    setIsGenerateModalOpen(false);
    setNewAlias('');
    setNewPurpose('');
    showToast(`Generated and provisioned key "${newKey.alias}"`);
  };

  const filteredKeys = keys.filter((k) => {
    const matchSearch =
      k.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || k.type === typeFilter;
    return matchSearch && matchType;
  });

  const activeCount = keys.filter((k) => k.status === 'ACTIVE').length;
  const rotationDueCount = keys.filter((k) => k.status === 'ROTATION_DUE').length;

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
            <span className="material-symbols-outlined text-sky-400 text-[28px]">vpn_key</span>
            Key Vault &amp; Encryption Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage hardware encryption keys, envelope master keys, and rotation schedules.
          </p>
        </div>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium">Total Vault Keys</div>
          <div className="text-2xl font-bold text-white mt-1">{keys.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Managed across cases</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-emerald-400 text-xs font-medium">Active &amp; Sealed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">FIPS 140-3 Enclave</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-amber-400 text-xs font-medium">Rotation Due</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{rotationDueCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Scheduled for rollover</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-sky-400 text-xs font-medium">Enclave Status</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">Online</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero latency sync</div>
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
            placeholder="Search by key alias or purpose..."
            className="w-full bg-slate-950/60 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'Master KEK', 'Data DEK', 'Stream Key', 'Audit Key'].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === tp
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid: Table + Key Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keys Table */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Key Alias &amp; Purpose</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredKeys.map((key) => {
                  const isSelected = selectedKey.id === key.id;
                  return (
                    <tr
                      key={key.id}
                      onClick={() => setSelectedKey(key)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-[16px]">key</span>
                          <span className="truncate max-w-[200px]">{key.alias}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{key.purpose}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
                          {key.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {key.algorithm}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            key.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {key.status === 'ACTIVE' ? 'Active' : 'Rotation Due'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKey(key);
                          }}
                          className="text-sky-400 hover:text-sky-300 text-xs font-medium"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Key Details Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-[18px]">lock</span>
                Key Specification
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedKey.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {selectedKey.status === 'ACTIVE' ? 'SEALED' : 'ROTATION DUE'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">Key Alias</div>
                <div className="font-medium text-white break-all">{selectedKey.alias}</div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px]">Purpose</div>
                <div className="text-slate-200">{selectedKey.purpose}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-400 text-[11px]">Type</div>
                  <div className="text-slate-200">{selectedKey.type}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Algorithm</div>
                  <div className="text-slate-200">{selectedKey.algorithm}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-400 text-[11px]">Created On</div>
                  <div className="text-slate-300">{selectedKey.createdDate}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Lifecycle</div>
                  <div className="text-slate-300">{selectedKey.expiresIn}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[11px]">SHA-256 Fingerprint</div>
                <div className="font-mono text-slate-300 break-all">{selectedKey.fingerprint}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-5 border-t border-slate-800 mt-5 flex items-center gap-2">
            <button
              onClick={() => handleRotateKey(selectedKey)}
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20"
            >
              <span className="material-symbols-outlined text-[16px]">autorenew</span>
              <span>Rotate Key</span>
            </button>
            <button
              onClick={() => showToast(`Audit log exported for ${selectedKey.alias}`)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generate Key Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400">vpn_key</span>
                Generate Encryption Key
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Key Alias</label>
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="e.g. KEY-AES256-CASE-09"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Key Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Data DEK">Data DEK (Document / Media Encryption)</option>
                  <option value="Master KEK">Master KEK (Envelope Encryption)</option>
                  <option value="Stream Key">Stream Key (Real-time Intercept)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Intended Purpose</label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="e.g. Op Cerberus Case File Encryption"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold shadow-md shadow-sky-500/20"
                >
                  Generate &amp; Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyVaultHSM;
