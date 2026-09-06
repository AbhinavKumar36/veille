import React, { useState, useEffect, useRef } from 'react';

export interface KeyItem {
  id: string;
  alias: string;
  badge: string;
  badgeColor: string;
  spec: string;
  specSub: string;
  purpose: string;
  enclaveSlot: string;
  lifecycle: string;
  epoch: string;
  epochColor: string;
  quorum: string;
  quorumStatus: string;
  quorumColor: string;
  backupStatus: string;
  state: string;
  stateColor: string;
  sha256: string;
  hardwareDomain: string;
  derivationPath: string;
  isMaster?: boolean;
}

const INITIAL_KEYS: KeyItem[] = [
  {
    id: 'KEY-01',
    alias: 'KEY-ROOT-CERBERUS-01',
    badge: 'MASTER KEK',
    badgeColor: 'text-on-surface-variant bg-surface-container-lowest border-outline-variant',
    spec: 'AES-256-GCM',
    specSub: '/ 4096-bit KEK',
    purpose: 'Case Master Envelope Hierarchy',
    enclaveSlot: 'ENCLAVE: HSM CLUSTER ALPHA (SLOT-01)',
    lifecycle: 'Age: 14d / Expires in 16d',
    epoch: 'EPOCH #421 // AUTO-ROTATE ON',
    epochColor: 'text-secondary',
    quorum: '3/5 QUORUM SIGNED',
    quorumStatus: 'verified',
    quorumColor: 'text-secondary',
    backupStatus: 'AIRGAP COLD SYNC: OK',
    state: 'ACTIVE & HARDENED',
    stateColor: 'border-secondary text-secondary bg-secondary/10',
    sha256: '8f4a3c1e92d8819034aa1109bcdef4491023bba12001',
    hardwareDomain: 'Slot 01 (PCIe Luna 7000)',
    derivationPath: "m/44'/1911'/0'/0/1",
    isMaster: true
  },
  {
    id: 'KEY-02',
    alias: 'KEY-KYBER-PQ-89',
    badge: 'NIST PQC',
    badgeColor: 'text-secondary bg-secondary/10 border-secondary/30',
    spec: 'Kyber-1024 / Dilithium-5',
    specSub: 'LATTICE',
    purpose: 'Zero-Trust Intercept Gateway Bridge',
    enclaveSlot: 'ENCLAVE: SGX SECURE ENCLAVE-3',
    lifecycle: 'Age: 3d / Expires in 27d',
    epoch: 'EPOCH #421 // AUTO-ROTATE ON',
    epochColor: 'text-secondary',
    quorum: '4/5 QUORUM SIGNED',
    quorumStatus: 'verified',
    quorumColor: 'text-secondary',
    backupStatus: 'QKD SEED: ATTESTED',
    state: 'ACTIVE & HARDENED',
    stateColor: 'border-primary text-primary bg-primary/10',
    sha256: '0029bfa8192a091823901b88219488a09284192bba01',
    hardwareDomain: 'Slot 03 (Intel SGX PQC Enclave)',
    derivationPath: "m/44'/1024'/0'/0/1"
  },
  {
    id: 'KEY-03',
    alias: 'KEY-ED25519-MERKLE',
    badge: 'AUDIT LOG',
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    spec: 'Ed25519-EdDSA',
    specSub: '256-bit',
    purpose: 'Forensic Immutable Audit Ledger Signer',
    enclaveSlot: 'ENCLAVE: HSM CLUSTER ALPHA (SLOT-03)',
    lifecycle: 'Age: 29d / Expires in 14h',
    epoch: 'EPOCH #420 // ROTATION DUE',
    epochColor: 'text-amber-400',
    quorum: '2/5 QUORUM SIGNED',
    quorumStatus: 'pending',
    quorumColor: 'text-amber-400',
    backupStatus: 'AWAITING DIR. CHEN',
    state: 'ROTATION IMMINENT',
    stateColor: 'border-amber-400 text-amber-400 bg-amber-400/10',
    sha256: '7c9ea1b209849182a091823891048b291049281a4b88',
    hardwareDomain: 'Slot 03 (PCIe Luna 7000)',
    derivationPath: "m/44'/1911'/0'/0/3"
  },
  {
    id: 'KEY-04',
    alias: 'KEY-AES256-WIRETAP-STREAM',
    badge: 'LIVE INTEL',
    badgeColor: 'text-outline bg-surface-container-high border-outline-variant',
    spec: 'XChaCha20-Poly1305',
    specSub: 'STREAM',
    purpose: 'Ingestion Wiretap Audio Decryptor',
    enclaveSlot: 'ENCLAVE: HSM CLUSTER ALPHA (SLOT-02)',
    lifecycle: 'Age: 1h / Expires in 23h',
    epoch: 'EPOCH #421 // EPHEMERAL-24H',
    epochColor: 'text-secondary',
    quorum: '3/5 QUORUM SIGNED',
    quorumStatus: 'verified',
    quorumColor: 'text-secondary',
    backupStatus: 'AUTO DERIVED VIA HKDF',
    state: 'ACTIVE & HARDENED',
    stateColor: 'border-secondary text-secondary bg-secondary/10',
    sha256: 'e2b9912f00491823901b88219488a09284192bba0104',
    hardwareDomain: 'Slot 02 (PCIe Luna 7000)',
    derivationPath: "m/44'/1911'/0'/0/2"
  },
  {
    id: 'KEY-05',
    alias: 'KEY-POSTGRES-TDE-04',
    badge: 'STORAGE',
    badgeColor: 'text-outline bg-surface-container-high border-outline-variant',
    spec: 'AES-256-XTS',
    specSub: 'STORAGE TDE',
    purpose: 'Epidemiology Clinical Storage Encryptor',
    enclaveSlot: 'ENCLAVE: COLD AIR-GAP SAFE',
    lifecycle: 'Age: 180d / Expires in 185d',
    epoch: 'EPOCH #418 // SEMI-ANNUAL',
    epochColor: 'text-outline',
    quorum: '5/5 FULL QUORUM',
    quorumStatus: 'verified',
    quorumColor: 'text-secondary',
    backupStatus: 'HARDWARE SMART-CARD KEY',
    state: 'ACTIVE & HARDENED',
    stateColor: 'border-secondary text-secondary bg-secondary/10',
    sha256: '991048b291049281a4b8821049182390192384f99104',
    hardwareDomain: 'Slot 00 (Cold Storage Airgap HSM)',
    derivationPath: "m/44'/1911'/0'/0/0"
  },
  {
    id: 'KEY-06',
    alias: 'KEY-NEO4J-SUBGRAPH-CRYPT',
    badge: 'STAGED',
    badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    spec: 'RSA-4096 / OAEP-SHA256',
    specSub: 'ASYMMETRIC',
    purpose: 'Intelligence Transmission Envelope',
    enclaveSlot: 'ENCLAVE: HSM CLUSTER ALPHA (SLOT-04)',
    lifecycle: 'Staged 1h ago // Pre-computation',
    epoch: 'EPOCH #422 // ACTIVATION SOON',
    epochColor: 'text-purple-400',
    quorum: '1/5 QUORUM SIGNED',
    quorumStatus: 'pending',
    quorumColor: 'text-outline',
    backupStatus: 'STAGING SIGNATURES REQ.',
    state: 'STAGED // STANDBY',
    stateColor: 'border-purple-400 text-purple-400 bg-purple-400/10',
    sha256: '33aa1109bcdef4491023bba120018f4a3c1e92d88190',
    hardwareDomain: 'Slot 04 (PCIe Luna 7000)',
    derivationPath: "m/44'/1911'/0'/0/4"
  }
];

const KeyVaultHSM: React.FC = () => {
  const [keys, setKeys] = useState<KeyItem[]>(INITIAL_KEYS);
  const [selectedKey, setSelectedKey] = useState<KeyItem>(INITIAL_KEYS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isZeroizeModalOpen, setIsZeroizeModalOpen] = useState(false);

  // Ceremony Modal State
  const [isCeremonyModalOpen, setIsCeremonyModalOpen] = useState(false);
  const [ceremonyStage, setCeremonyStage] = useState<number>(2); // 1, 2, 3, 4
  const [shard4Signed, setShard4Signed] = useState<boolean>(false);
  const [ceremonyLogs, setCeremonyLogs] = useState<string[]>([
    '[08:31:22 UTC] SEED: HKDF-Extract(Salt=0x9f8b...22e, IKM=QRNG_STREAM) via True Quantum RNG',
    '[08:31:23 UTC] ML-KEM-1024: Keypair generated: pk_hash=0x41c9...e2a (Security Category 5)',
    '[08:31:24 UTC] ENVELOPE: Kyber-1024 + AES-256-GCM Dual-Wrapped KEK established',
    '[08:31:24 UTC] WAIT: Awaiting Shard Distribution to Enclave Slot 01-A (3/5 Quorum Attested)'
  ]);
  const [isRotationComplete, setIsRotationComplete] = useState(false);
  const modalTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll modal terminal
  useEffect(() => {
    if (modalTerminalRef.current) {
      modalTerminalRef.current.scrollTop = modalTerminalRef.current.scrollHeight;
    }
  }, [ceremonyLogs]);

  const openCeremony = (key?: KeyItem) => {
    if (key) setSelectedKey(key);
    setIsCeremonyModalOpen(true);
    setCeremonyStage(2);
    setShard4Signed(false);
    setIsRotationComplete(false);
  };

  const closeCeremony = () => {
    setIsCeremonyModalOpen(false);
  };

  const handleSignShard4 = () => {
    setShard4Signed(true);
    const time = new Date().toISOString().substring(11, 19);
    setCeremonyLogs(prev => [
      ...prev,
      `[${time} UTC] QUORUM UPDATE: Shard 04 signed by Dep. Dir. H. Chen (Token ID: #YK-8821) -> 4/5 Quorum Validated.`
    ]);
  };

  const handleVerifyLattice = () => {
    const time = new Date().toISOString().substring(11, 19);
    setCeremonyLogs(prev => [
      ...prev,
      `[${time} UTC] LATTICE CHECK: Kyber-1024 modulus q=3329, NTT polynomial vectors conform to FIPS 203. ZERO ERROR.`
    ]);
  };

  const handleExecuteRotation = () => {
    if (isRotationComplete) {
      closeCeremony();
      return;
    }

    const time = new Date().toISOString().substring(11, 19);
    setCeremonyStage(3);
    setCeremonyLogs(prev => [
      ...prev,
      `[${time} UTC] EXECUTING: Shard secret split complete across Slot 01-A enclave partition.`
    ]);

    setTimeout(() => {
      const time2 = new Date().toISOString().substring(11, 19);
      setCeremonyStage(4);
      setIsRotationComplete(true);
      setCeremonyLogs(prev => [
        ...prev,
        `[${time2} UTC] PURGING: Epoch 421 KEK plaintext buffer zeroized (DoD 5220.22-M crypto-erase compliant).`,
        `[${time2} UTC] COMMITTED: NEW ROOT KEK KEY-ROOT-CERBERUS-01 [EPOCH 422] ACTIVE. Merkle ledger updated.`
      ]);

      // Update selected key state in table
      setKeys(prev => prev.map(k => {
        if (k.id === selectedKey.id) {
          return {
            ...k,
            epoch: 'EPOCH #422 // ACTIVE',
            epochColor: 'text-secondary',
            lifecycle: 'Age: 0d / Expires in 30d',
            state: 'ACTIVE & HARDENED',
            stateColor: 'border-secondary text-secondary bg-secondary/10'
          };
        }
        return k;
      }));

      setToastNotice(`KEY ROTATION COMMITTED: ${selectedKey.alias} successfully rotated to Epoch #422.`);
    }, 450);
  };

  const handleAction = (type: string, key?: KeyItem) => {
    const target = key || selectedKey;
    if (type === 'rotate') {
      openCeremony(target);
    } else if (type === 'generate') {
      const newKey: KeyItem = {
        id: `KEY-${Date.now().toString().slice(-4)}`,
        alias: `KEY-CUSTOM-EPHEM-${Math.floor(Math.random() * 900) + 100}`,
        badge: 'NEW ENVELOPE',
        badgeColor: 'text-primary bg-primary/10 border-primary/30',
        spec: 'AES-256-GCM / KYBER-1024',
        specSub: 'HYBRID',
        purpose: 'Custom Ephemeral Workstation Decryptor',
        enclaveSlot: 'ENCLAVE: HSM CLUSTER ALPHA (SLOT-05)',
        lifecycle: 'Age: 0d / Expires in 30d',
        epoch: 'EPOCH #421 // INITIALIZED',
        epochColor: 'text-secondary',
        quorum: '1/5 QUORUM SIGNED',
        quorumStatus: 'pending',
        quorumColor: 'text-outline',
        backupStatus: 'GENERATING ENTROPY...',
        state: 'ACTIVE & HARDENED',
        stateColor: 'border-secondary text-secondary bg-secondary/10',
        sha256: Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        hardwareDomain: 'Slot 05 (PCIe Luna 7000)',
        derivationPath: "m/44'/1911'/0'/0/5"
      };
      setKeys(prev => [newKey, ...prev]);
      setSelectedKey(newKey);
      setToastNotice(`NEW KEY GENERATED: ${newKey.alias} committed to PCIe HSM Slot 05.`);
    } else if (type === 'quorum') {
      openCeremony(target);
    } else if (type === 'zeroize') {
      setIsZeroizeModalOpen(false);
      setToastNotice('EMERGENCY ZEROIZE EXECUTED: Physical crypto-erase completed across volatile PCIe HSM cache.');
    }
    setTimeout(() => setToastNotice(null), 5000);
  };

  const filteredKeys = keys.filter(k => {
    if (purposeFilter !== 'ALL') {
      if (purposeFilter === 'Envelope' && !k.purpose.includes('Envelope') && !k.purpose.includes('Master')) return false;
      if (purposeFilter === 'Merkle' && !k.alias.includes('MERKLE')) return false;
      if (purposeFilter === 'Wiretap' && !k.alias.includes('WIRETAP')) return false;
      if (purposeFilter === 'PQ' && !k.alias.includes('KYBER')) return false;
    }
    if (stateFilter !== 'ALL') {
      if (stateFilter === 'ACTIVE' && !k.state.includes('ACTIVE')) return false;
      if (stateFilter === 'ROTATION' && !k.state.includes('ROTATION')) return false;
      if (stateFilter === 'STAGED' && !k.state.includes('STAGED')) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        k.alias.toLowerCase().includes(q) ||
        k.spec.toLowerCase().includes(q) ||
        k.purpose.toLowerCase().includes(q) ||
        k.sha256.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-surface text-on-surface font-body-default antialiased select-none overflow-hidden -m-4 lg:-m-8 min-w-0">
      {/* Notification Banner */}
      {toastNotice && (
        <div className="bg-primary/10 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>{toastNotice}</span>
          </div>
          <button onClick={() => setToastNotice(null)} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* ================= MAIN OPERATIONAL THEATER & RIGHT INSPECTOR ================= */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-surface min-h-0">
        {/* ================= PRIMARY OPERATIONAL WORKSPACE (LEFT 70%) ================= */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-outline-variant overflow-y-auto h-full">
          {/* Top Telemetry & HSM Cluster Health Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-outline-variant border-b border-outline-variant shrink-0">
            {/* Card 1: Master Enclave HSM Status */}
            <div className="bg-surface-container-lowest p-3.5 reticle-corner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-outline uppercase font-bold">ENCLAVE HSM RIG</span>
                  <span className="bg-secondary/15 text-secondary border border-secondary/30 text-[9px] font-mono px-1.5 py-0.2 font-bold">
                    FIPS L4 // ARMED
                  </span>
                </div>
                <div className="text-base font-bold font-sans text-on-surface truncate">Luna 7000 / SEV-SNP</div>
                <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">PCIe HSM Cluster 01-A (Node US-EAST-FIPS)</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-outline">Core Temp: <span className="text-secondary font-bold">34.2°C</span></span>
                <span className="text-outline">Tamper Mesh: <span className="text-primary font-bold">100% INTACT</span></span>
              </div>
            </div>

            {/* Card 2: Active Root Keys & Keystore Inventory */}
            <div className="bg-surface-container-lowest p-3.5 reticle-corner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-outline uppercase font-bold">TOTAL MANAGED KEYS</span>
                  <span className="bg-primary/10 text-primary border border-primary/30 text-[9px] font-mono px-1.5 py-0.2 font-bold">
                    1,428 ACTIVE
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold font-mono text-primary tracking-tight">1,428</span>
                  <span className="text-[10px] font-mono text-outline">/ 384 Ephemeral</span>
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant mt-0.5 flex items-center justify-between">
                  <span>Asymmetric Pairs: 89</span>
                  <span className="text-secondary font-bold">Post-Quantum: 14</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-outline">Algorithm Pool:</span>
                <span className="text-primary font-bold text-[9px]">AES-256 / KYBER / ED25519</span>
              </div>
            </div>

            {/* Card 3: Key Derivation & HKDF Throughput */}
            <div className="bg-surface-container-lowest p-3.5 reticle-corner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-outline uppercase font-bold">HKDF OPS THROUGHPUT</span>
                  <span className="text-secondary flex items-center text-[9px] font-mono font-bold">
                    <span className="material-symbols-outlined text-xs mr-0.5">bolt</span>
                    28.4k OPS/S
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-on-surface flex items-baseline space-x-1.5">
                  <span>28,450</span>
                  <span className="text-[10px] font-mono text-outline font-normal">ops/sec</span>
                  <span className="text-secondary text-[10px]">0.8ms lat</span>
                </div>
                <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">Quantum RNG Entropy: 99.998%</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-outline">ZK-Proof Rollups:</span>
                <span className="text-secondary font-bold text-[9px]">VERIFIED (KZG10)</span>
              </div>
            </div>

            {/* Card 4: Cryptographic Signature Epoch & Quorum Status */}
            <div className="bg-surface-container-lowest p-3.5 reticle-corner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-outline uppercase font-bold">M-OF-N QUORUM / ROTATION</span>
                  <span className="bg-surface-container-high text-primary border border-outline-variant text-[9px] font-mono px-1.5 py-0.2 font-bold">
                    3 OF 5 PRESENT
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-primary flex items-baseline space-x-2">
                  <span className="tabular-nums">03h : 14m : 22s</span>
                </div>
                <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">Next Master Rollover: OP CERBERUS</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-outline">Zeroize Logic:</span>
                <span className="text-error font-mono font-bold text-[9px] border border-error/40 px-1 bg-error/10">
                  STANDBY // ARMED
                </span>
              </div>
            </div>
          </div>

          {/* Controls, Filter Matrix & Query Terminal Strip */}
          <div className="bg-surface-container-low border-b border-outline-variant p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
            {/* Monospace Search Terminal Input */}
            <div className="flex-1 max-w-lg relative flex items-center">
              <span className="absolute left-2.5 text-outline font-mono text-xs font-bold">QUERY://</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Key Alias, Algorithm, or SHA-256 Fingerprint..."
                className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface font-mono pl-20 pr-3 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-outline/60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>

            {/* Tactical Filters */}
            <div className="flex items-center space-x-2 text-xs font-mono overflow-x-auto">
              <div className="flex items-center bg-surface-container-lowest border border-outline-variant px-2 py-1 space-x-1">
                <span className="text-outline text-[10px]">PURPOSE:</span>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="bg-transparent text-primary text-[10px] border-none p-0 focus:ring-0 cursor-pointer focus:outline-none font-bold"
                >
                  <option className="bg-surface-container-lowest" value="ALL">ALL (ENVELOPE / MERKLE / WIRETAP)</option>
                  <option className="bg-surface-container-lowest" value="Envelope">Envelope Encryption</option>
                  <option className="bg-surface-container-lowest" value="Merkle">Merkle Root Signing</option>
                  <option className="bg-surface-container-lowest" value="Wiretap">Wiretap Audio Decryption</option>
                  <option className="bg-surface-container-lowest" value="PQ">Post-Quantum Kyber-1024</option>
                </select>
              </div>

              <div className="flex items-center bg-surface-container-lowest border border-outline-variant px-2 py-1 space-x-1">
                <span className="text-outline text-[10px]">STATE:</span>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="bg-transparent text-secondary text-[10px] border-none p-0 focus:ring-0 cursor-pointer focus:outline-none font-bold"
                >
                  <option className="bg-surface-container-lowest" value="ALL">ALL STATES</option>
                  <option className="bg-surface-container-lowest" value="ACTIVE">ACTIVE &amp; HARDENED</option>
                  <option className="bg-surface-container-lowest" value="ROTATION">ROTATION IMMINENT</option>
                  <option className="bg-surface-container-lowest" value="STAGED">STAGED // STANDBY</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleAction('generate')}
                className="bg-primary hover:bg-primary-fixed text-on-primary-fixed px-2.5 py-1 flex items-center space-x-1 transition-colors font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">add_circle</span>
                <span>GENERATE KEY</span>
              </button>
            </div>
          </div>

          {/* High-Density Tactical Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant text-[10px] font-mono text-outline sticky top-0 z-20 uppercase tracking-wider">
                  <th className="py-2 px-3 w-8">
                    <div className="w-3 h-3 border border-outline-variant bg-surface-container-lowest flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-primary block" />
                    </div>
                  </th>
                  <th className="py-2 px-3 font-semibold">KEY ID &amp; ALIAS</th>
                  <th className="py-2 px-3 font-semibold">SPEC / ALGORITHM</th>
                  <th className="py-2 px-3 font-semibold">PURPOSE &amp; ASSIGNED ENCLAVE</th>
                  <th className="py-2 px-3 font-semibold">LIFECYCLE / EPOCH</th>
                  <th className="py-2 px-3 font-semibold">M-OF-N &amp; BACKUP</th>
                  <th className="py-2 px-3 font-semibold">STATE</th>
                  <th className="py-2 px-3 text-right font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high text-xs font-mono">
                {filteredKeys.map((key) => {
                  const isSelected = selectedKey.id === key.id;
                  return (
                    <tr
                      key={key.id}
                      onClick={() => openCeremony(key)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-surface-container-high/60 border-l-2 border-l-primary'
                          : 'bg-surface-container-lowest hover:bg-surface-container-low border-l-2 border-l-transparent'
                      }`}
                    >
                      <td className="py-2 px-3">
                        <div className={`w-3 h-3 border ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant bg-surface-container-lowest'} flex items-center justify-center`}>
                          {isSelected && <span className="w-1.5 h-1.5 bg-surface-container-lowest block" />}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-medium text-primary flex items-center space-x-2">
                        <span className="material-symbols-outlined text-xs text-primary">vpn_key</span>
                        <span className="tracking-tight font-bold">{key.alias}</span>
                        <span className={`text-[9px] font-mono px-1 border ${key.badgeColor}`}>
                          {key.badge}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-on-surface">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-primary font-bold">{key.spec}</span>
                          <span className="text-outline text-[10px]">{key.specSub}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-on-surface-variant">
                        <div>{key.purpose}</div>
                        <div className="text-[10px] text-outline">{key.enclaveSlot}</div>
                      </td>
                      <td className="py-2 px-3 text-on-surface">
                        <div>{key.lifecycle}</div>
                        <div className={`text-[10px] font-bold ${key.epochColor}`}>{key.epoch}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className={`${key.quorumColor} flex items-center space-x-1 text-[10px] font-bold`}>
                          <span className="material-symbols-outlined text-xs">
                            {key.quorumStatus === 'verified' ? 'verified' : 'pending'}
                          </span>
                          <span>{key.quorum}</span>
                        </div>
                        <div className="text-[10px] text-outline">{key.backupStatus}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 border font-bold text-[9px] ${key.stateColor}`}>
                          {key.state}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCeremony(key);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold bg-surface-container-lowest hover:bg-surface-container-high text-on-surface border border-outline-variant mr-1 cursor-pointer"
                        >
                          ROTATE
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCeremony(key);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          INSPECT
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Real-time Raw Cryptographic Telemetry Stream Terminal */}
          <div className="border-t border-outline-variant bg-surface-container-lowest p-2.5 font-mono shrink-0">
            <div className="flex items-center justify-between text-outline text-[10px] uppercase pb-1 border-b border-outline-variant/30 mb-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="inline-block w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="font-bold">LIVE CRYPTOGRAPHIC HARDWARE LOGS (ENCLAVE // RING-0)</span>
              </div>
              <span className="text-[9px]">LOG STREAM: ENCRYPTED (AES-GCM-256)</span>
            </div>
            <div className="space-y-0.5 text-on-surface-variant max-h-20 overflow-y-auto font-mono text-[11px] leading-relaxed">
              <div><span className="text-outline">[14:44:02.102 UTC]</span> <span className="text-secondary font-bold">SUCCESS:</span> Decrypted audio packet sig-8924 with key_id: <span className="text-primary">KEY-AES256-WIRETAP-STREAM (e2b9...912f)</span> [0.12ms]</div>
              <div><span className="text-outline">[14:43:58.740 UTC]</span> <span className="text-primary font-bold">INFO:</span> HKDF expansion executed for worker-neo4j-02 using Root Salt: <span className="text-on-surface">d981...00ae</span></div>
              <div><span className="text-outline">[14:43:18.490 UTC]</span> <span className="text-secondary font-bold">ATTESTATION:</span> True Quantum RNG entropy refreshed. 128-Gbit pool stability 99.998%.</div>
              <div><span className="text-outline">[14:42:01.004 UTC]</span> <span className="text-amber-400 font-bold">WARNING:</span> Quorum reminder dispatched to Deputy Dir. Chen for Key Rotation Epoch #421.</div>
            </div>
          </div>
        </section>

        {/* ================= RIGHT-SIDE INSPECTOR DRAWER (380px FIXED) ================= */}
        <aside className="w-full lg:w-[380px] bg-surface-container-lowest flex flex-col justify-between overflow-y-auto shrink-0 z-20 border-l border-outline-variant h-full">
          {/* Inspector Header */}
          <div className="p-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary text-base">memory</span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface font-sans">
                ENCLAVE &amp; KEY CEREMONY INSPECTOR
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold text-error border border-error/40 px-1 py-0.5 bg-error/10">
              COSMIC TOP SECRET
            </span>
          </div>

          {/* Inspector Content Body */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs font-mono">
            {/* Key Profile Header Block */}
            <div className="border border-outline-variant bg-surface p-3 reticle-corner">
              <div className="text-[10px] font-mono text-outline mb-1 font-bold">SELECTED ROOT ENVELOPE</div>
              <div className="text-sm font-bold text-primary truncate">{selectedKey.alias}</div>
              <div className="text-[10px] text-outline mt-0.5 truncate font-mono">
                SHA256: {selectedKey.sha256}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-outline-variant text-[10px]">
                <div>
                  <span className="text-outline block text-[9px] font-bold">HARDWARE DOMAIN</span>
                  <span className="text-on-surface">{selectedKey.hardwareDomain}</span>
                </div>
                <div>
                  <span className="text-outline block text-[9px] font-bold">DERIVATION PATH</span>
                  <span className="text-on-surface font-mono">{selectedKey.derivationPath}</span>
                </div>
              </div>
            </div>

            {/* Visual Envelope Encryption Hierarchy Diagram */}
            <div className="border border-outline-variant bg-surface-container-lowest p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-outline uppercase font-bold">ENVELOPE ENCRYPTION CASCADE</span>
                <span className="text-[9px] font-mono text-secondary font-bold">3-LAYER WRAPPED</span>
              </div>
              {/* Tier 1: Master KEK */}
              <div className="p-2 border border-primary/40 bg-primary/5 mb-1 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-primary text-sm">lock</span>
                  <div>
                    <div className="text-xs font-bold text-primary">Master KEK (Hardware Root)</div>
                    <div className="text-[10px] text-outline font-mono">AES-256-GCM // FIPS L4 Partition</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-secondary font-bold">TIER-0</span>
              </div>
              <div className="flex justify-center my-0.5">
                <span className="material-symbols-outlined text-outline text-xs">arrow_downward</span>
              </div>
              {/* Tier 2: Case DEK */}
              <div className="p-2 border border-outline-variant bg-surface-container-low mb-1 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-outline text-sm">folder_key</span>
                  <div>
                    <div className="text-xs font-medium text-on-surface">Case DEK (OP CERBERUS)</div>
                    <div className="text-[10px] text-outline font-mono">Wrapped with Root KEK</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-outline font-bold">TIER-1</span>
              </div>
              <div className="flex justify-center my-0.5">
                <span className="material-symbols-outlined text-outline text-xs">arrow_downward</span>
              </div>
              {/* Tier 3: Target Stream Key */}
              <div className="p-2 border border-secondary/40 bg-secondary/5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-secondary text-sm">graphic_eq</span>
                  <div>
                    <div className="text-xs font-medium text-secondary">Target Stream Key (Wiretap #8924)</div>
                    <div className="text-[10px] text-outline font-mono">Ephemeral XChaCha20-Poly1305</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-secondary font-bold">LEAF</span>
              </div>
            </div>

            {/* Real-time Multi-Party Computation (MPC) / Quorum Visualizer */}
            <div className="border border-outline-variant bg-surface-container-lowest p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-outline uppercase font-bold">M-OF-N QUORUM THRESHOLD (3/5)</span>
                <span className="text-[9px] font-mono text-secondary font-bold">THRESHOLD MET</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {/* Shard 1 */}
                <div className="flex items-center justify-between bg-surface-container-low p-1.5 border border-secondary/30">
                  <div className="flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-xs text-secondary">contactless</span>
                    <span className="text-on-surface">Dir. A. Vance (Commander)</span>
                  </div>
                  <span className="text-[9px] font-mono text-secondary font-bold">SMARTCARD [SIGNED]</span>
                </div>
                {/* Shard 2 */}
                <div className="flex items-center justify-between bg-surface-container-low p-1.5 border border-secondary/30">
                  <div className="flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-xs text-secondary">key</span>
                    <span className="text-on-surface">SecOps Off. M. Ortiz</span>
                  </div>
                  <span className="text-[9px] font-mono text-secondary font-bold">FIDO2 TOKEN [SIGNED]</span>
                </div>
                {/* Shard 3 */}
                <div className="flex items-center justify-between bg-surface-container-low p-1.5 border border-secondary/30">
                  <div className="flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-xs text-secondary">fingerprint</span>
                    <span className="text-on-surface">Chief Bio-Investigator</span>
                  </div>
                  <span className="text-[9px] font-mono text-secondary font-bold">BIOMETRIC [SIGNED]</span>
                </div>
                {/* Shard 4 (Pending) */}
                <div className="flex items-center justify-between bg-surface-container-low p-1.5 border border-outline-variant opacity-60">
                  <div className="flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-xs text-outline">person</span>
                    <span className="text-outline">Dep. Dir. H. Chen</span>
                  </div>
                  <span className="text-[9px] font-mono text-amber-400 font-bold">AWAITING QUORUM</span>
                </div>
                {/* Shard 5 (Standby) */}
                <div className="flex items-center justify-between bg-surface-container-low p-1.5 border border-outline-variant opacity-60">
                  <div className="flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-xs text-outline">person</span>
                    <span className="text-outline">Legal Counsel Enclave</span>
                  </div>
                  <span className="text-[9px] font-mono text-outline">STANDBY SHARD</span>
                </div>
              </div>
            </div>

            {/* Post-Quantum Cryptography (PQC) Telemetry Block */}
            <div className="border border-outline-variant bg-surface-container-low p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-outline uppercase font-bold">POST-QUANTUM HYBRID ENVELOPE</span>
                <span className="text-[9px] font-mono text-secondary border border-secondary/30 px-1 font-bold">ML-KEM READY</span>
              </div>
              <div className="text-xs font-mono text-on-surface-variant space-y-1">
                <div className="flex justify-between">
                  <span className="text-outline">Algorithm:</span>
                  <span className="text-on-surface">CRYSTALS-Kyber-1024 + ECDH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Lattice Dimension:</span>
                  <span className="text-on-surface font-mono">k=4, Modulus q=3329</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">NIST Security:</span>
                  <span className="text-secondary font-bold">Category 5 (AES-256 equiv)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enclave Emergency Operations & Hard Action Strip */}
          <div className="p-3 border-t border-outline-variant bg-surface-container-low space-y-2 shrink-0">
            <button
              type="button"
              onClick={() => openCeremony()}
              className="w-full bg-primary hover:bg-primary-fixed text-on-primary-fixed font-mono text-xs font-bold py-2 px-3 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">cached</span>
              <span>INITIATE MANUAL KEY ROTATION</span>
            </button>
            <button
              type="button"
              onClick={() => openCeremony()}
              className="w-full bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant hover:border-primary/50 font-mono text-xs font-bold py-1.5 px-3 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-primary">groups</span>
              <span>TRIGGER M-OF-N CEREMONY</span>
            </button>
            {/* Critical Danger Action: Emergency Enclave Zeroize */}
            <div className="pt-2 border-t border-error/20">
              <div className="flex items-center justify-between mb-1 text-[9px] font-mono text-error font-bold">
                <span>CRITICAL FAILSAFE:</span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-error rounded-full animate-ping mr-1" />
                  DUAL-KEY ARMED
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZeroizeModalOpen(true)}
                className="w-full bg-error-container/30 hover:bg-error/30 text-error border border-error/50 font-mono text-xs font-bold py-1.5 px-3 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">dangerous</span>
                <span>EMERGENCY ZEROIZE ENCLAVE (CRYPTO-ERASE)</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* ================= ACTIVE KEY ROTATION & CEREMONY MODAL DIALOG ================= */}
      {isCeremonyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 backdrop-blur-sm bg-black/80 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-surface-container-lowest border border-outline-variant shadow-2xl flex flex-col max-h-[92vh] overflow-hidden reticle-corner">
            {/* 1. Modal Header */}
            <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-primary animate-ping rounded-full mr-0.5" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs md:text-sm tracking-wide text-primary uppercase font-sans">
                      CEREMONY PROTOCOL // POST-QUANTUM KEY ROTATION &amp; QUORUM M-OF-N (EPOCH 422)
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold border ${
                      isRotationComplete
                        ? 'bg-secondary/15 text-secondary border-secondary/40'
                        : 'bg-primary/15 text-primary border-primary/40'
                    }`}>
                      {isRotationComplete ? 'CEREMONY COMPLETE [EPOCH 422 COMMITTED]' : `CEREMONY IN PROGRESS [STAGE ${ceremonyStage} OF 4]`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-outline mt-0.5">
                    <span className="text-error bg-error/10 border border-error/30 px-1 py-0.2 font-bold">
                      TS//SCI TOP SECRET // FIPS 140-3 LEVEL 4 ENCLAVE AIR-GAP CEREMONY
                    </span>
                    <span>•</span>
                    <span>AIR-GAP ENCLAVE: NODE LUNA-01A</span>
                    <span>•</span>
                    <span className="text-secondary font-mono">
                      QUORUM SIGNATURE THRESHOLD: {shard4Signed ? '4/5 VALID' : '3/5 VALID'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCeremony}
                className="flex items-center space-x-1 text-on-surface-variant hover:text-error border border-outline-variant hover:border-error/50 bg-surface-container-lowest px-2 py-1 text-[10px] font-mono transition-colors"
                title="Abort Ceremony"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>ESC [ABORT CEREMONY]</span>
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* 2. Target Key & Parameters */}
              <div className="bg-surface-container-low border border-outline-variant p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border-b md:border-b-0 md:border-r border-outline-variant/50 pb-2 md:pb-0 md:pr-3">
                  <div className="text-outline text-[10px] font-mono font-bold mb-0.5">TARGET MASTER KEK / ENVELOPE</div>
                  <div className="text-primary font-bold text-sm tracking-tight font-mono">{selectedKey.alias}</div>
                  <div className="text-on-surface text-[11px] font-mono mt-0.5">AES-256-GCM / ML-KEM CRYSTALS-Kyber-1024 Hybrid Envelope</div>
                  <div className="text-outline text-[10px] font-mono mt-1">SLOT: 01-A (PCIe Luna 7000 SEV-SNP)</div>
                </div>
                <div className="border-b md:border-b-0 md:border-r border-outline-variant/50 pb-2 md:pb-0 md:pr-3">
                  <div className="text-outline text-[10px] font-mono font-bold mb-0.5">TRIGGER REASON &amp; CLEARANCE SCOPE</div>
                  <div className="text-on-surface font-medium text-xs">Scheduled Epoch 421 Rollover &amp; Cryptographic Hardening</div>
                  <div className="text-outline text-[10px] font-mono mt-0.5">Derivation: m/44'/1911'/0'/0/1 → m/44'/1911'/0'/0/2</div>
                  <div className="text-secondary text-[10px] font-mono font-bold mt-1">COMPLIANCE: NIST SP 800-57 / CNSA 2.0 READY</div>
                </div>
                <div>
                  <div className="text-outline text-[10px] font-mono font-bold mb-0.5">ENTROPY SOURCE &amp; QUANTUM ATTESTATION</div>
                  <div className="text-secondary font-medium text-xs flex items-center space-x-1">
                    <span className="material-symbols-outlined text-xs">all_inclusive</span>
                    <span>Luna 7000 PCIe Dual-RNG + QKD Photon Stream</span>
                  </div>
                  <div className="text-on-surface-variant text-[10px] font-mono mt-0.5">Attested Pool Stability: 99.998% certified</div>
                  <div className="text-primary text-[10px] font-mono font-bold mt-1">TRNG BITSTREAM: 128 Gbit/s CRYPTO-SEEDED</div>
                </div>
              </div>

              {/* 3. Step Progression Visualizer (4 Stages) */}
              <div className="bg-surface-container-lowest border border-outline-variant p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-outline uppercase tracking-wider font-bold">
                    PROTOCOL STAGE PIPELINE (ZERO-LEAK PROTOCOL)
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">AIR-GAP TIME REMAINING: 04m:18s</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono">
                  {/* Stage 1 */}
                  <div className="border border-secondary/50 bg-secondary/10 p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-secondary font-bold">STAGE 01</span>
                      <span className="flex items-center text-secondary font-bold">
                        <span className="material-symbols-outlined text-xs mr-0.5">check_circle</span>
                        COMPLETED
                      </span>
                    </div>
                    <div className="my-1.5">
                      <div className="text-xs font-bold text-on-surface">QUORUM ASSEMBLED</div>
                      <div className="text-[10px] text-on-surface-variant">3 of 5 Master Shards Loaded</div>
                    </div>
                    <div className="w-full bg-secondary/30 h-1 overflow-hidden">
                      <div className="bg-secondary h-full w-full" />
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className={`p-2.5 flex flex-col justify-between ${
                    ceremonyStage >= 2 ? 'border border-primary bg-primary/10 ring-1 ring-primary/40' : 'border border-outline-variant bg-surface-container-low'
                  }`}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-primary font-bold">STAGE 02</span>
                      <span className={`flex items-center ${ceremonyStage > 2 ? 'text-secondary' : 'text-primary animate-pulse'} font-bold`}>
                        <span className="material-symbols-outlined text-xs mr-0.5">{ceremonyStage > 2 ? 'check_circle' : 'sync'}</span>
                        {ceremonyStage > 2 ? 'COMPLETED' : 'ACTIVE (86%)'}
                      </span>
                    </div>
                    <div className="my-1.5">
                      <div className="text-xs font-bold text-primary">PQ SEED INGESTION</div>
                      <div className="text-[10px] text-on-surface-variant">ML-KEM-1024 Lattice Gen</div>
                    </div>
                    <div className="w-full bg-surface-container-high h-1 overflow-hidden">
                      <div className={`h-full ${ceremonyStage > 2 ? 'bg-secondary w-full' : 'bg-primary w-[86%] transition-all duration-300'}`} />
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className={`p-2.5 flex flex-col justify-between ${
                    ceremonyStage >= 3 ? 'border border-secondary/50 bg-secondary/10' : 'border border-outline-variant bg-surface-container-low'
                  }`}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={ceremonyStage >= 3 ? 'text-secondary font-bold' : 'text-outline'}>STAGE 03</span>
                      <span className={ceremonyStage >= 3 ? 'text-secondary font-bold flex items-center' : 'text-outline'}>
                        {ceremonyStage >= 3 && <span className="material-symbols-outlined text-xs mr-0.5">check_circle</span>}
                        {ceremonyStage >= 3 ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="my-1.5">
                      <div className={`text-xs font-bold ${ceremonyStage >= 3 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        SHARD SPLITTING &amp; ATTEST
                      </div>
                      <div className="text-[10px] text-outline">M-of-N Secret Sharing</div>
                    </div>
                    <div className="w-full bg-surface-container-high h-1 overflow-hidden">
                      <div className={`h-full ${ceremonyStage >= 3 ? 'bg-secondary w-full' : 'bg-outline w-0'}`} />
                    </div>
                  </div>

                  {/* Stage 4 */}
                  <div className={`p-2.5 flex flex-col justify-between ${
                    ceremonyStage >= 4 ? 'border border-secondary/50 bg-secondary/10 opacity-100' : 'border border-outline-variant/60 bg-surface-container-low/40 opacity-70'
                  }`}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={ceremonyStage >= 4 ? 'text-secondary font-bold' : 'text-outline'}>STAGE 04</span>
                      <span className={ceremonyStage >= 4 ? 'text-secondary font-bold flex items-center' : 'text-outline'}>
                        {ceremonyStage >= 4 && <span className="material-symbols-outlined text-xs mr-0.5">verified</span>}
                        {ceremonyStage >= 4 ? 'COMMITTED' : 'LOCKED'}
                      </span>
                    </div>
                    <div className="my-1.5">
                      <div className={`text-xs font-bold ${ceremonyStage >= 4 ? 'text-on-surface' : 'text-outline'}`}>
                        ZEROIZE &amp; ATTEST LEDGER
                      </div>
                      <div className="text-[10px] text-outline">Purge Epoch 421 Buffers</div>
                    </div>
                    <div className="w-full bg-surface-container-high h-1 overflow-hidden">
                      <div className={`h-full ${ceremonyStage >= 4 ? 'bg-secondary w-full' : 'bg-outline w-0'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Multi-Party Shardholder Live Authentication Grid */}
              <div className="bg-surface-container-lowest border border-outline-variant p-3 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 pb-1.5 border-b border-outline-variant/40">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-secondary text-sm">badge</span>
                    <span className="text-[10px] text-outline uppercase tracking-wider font-bold">
                      M-OF-N CUSTODIAN SHARD MATRIX
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] bg-secondary/10 border border-secondary/30 px-2 py-0.5 text-secondary font-bold">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span>{shard4Signed ? '4 OF 5 THRESHOLD ACHIEVED (SUPER-QUORUM VALIDATED)' : '3 OF 5 THRESHOLD ACHIEVED (QUORUM VALIDATED)'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                  {/* Custodian 1 */}
                  <div className="bg-surface-container-low border border-secondary/40 p-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-outline font-bold">
                        <span>SLOT 01</span>
                        <span className="text-secondary">SHARD VERIFIED</span>
                      </div>
                      <div className="text-xs font-bold text-on-surface mt-1 truncate">Dir. A. Vance</div>
                      <div className="text-[10px] text-outline">Commander / Enclave Alpha</div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-[9px] text-secondary flex items-center font-bold">
                        <span className="material-symbols-outlined text-xs mr-0.5">contactless</span>
                        SMARTCARD SIGNED
                      </span>
                      <span className="text-secondary text-xs">✓</span>
                    </div>
                  </div>

                  {/* Custodian 2 */}
                  <div className="bg-surface-container-low border border-secondary/40 p-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-outline font-bold">
                        <span>SLOT 02</span>
                        <span className="text-secondary">SHARD VERIFIED</span>
                      </div>
                      <div className="text-xs font-bold text-on-surface mt-1 truncate">SecOps Off. M. Ortiz</div>
                      <div className="text-[10px] text-outline">Operations Division</div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-[9px] text-secondary flex items-center font-bold">
                        <span className="material-symbols-outlined text-xs mr-0.5">key</span>
                        FIDO2 TOKEN INSERTED
                      </span>
                      <span className="text-secondary text-xs">✓</span>
                    </div>
                  </div>

                  {/* Custodian 3 */}
                  <div className="bg-surface-container-low border border-secondary/40 p-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-outline font-bold">
                        <span>SLOT 03</span>
                        <span className="text-secondary">SHARD VERIFIED</span>
                      </div>
                      <div className="text-xs font-bold text-on-surface mt-1 truncate">Chief Bio-Investigator</div>
                      <div className="text-[10px] text-outline">Forensic Enclave Unit</div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-[9px] text-secondary flex items-center font-bold">
                        <span className="material-symbols-outlined text-xs mr-0.5">fingerprint</span>
                        DERMAL BIOMETRIC OK
                      </span>
                      <span className="text-secondary text-xs">✓</span>
                    </div>
                  </div>

                  {/* Custodian 4 */}
                  <div className={`bg-surface-container-low p-2 flex flex-col justify-between border ${
                    shard4Signed ? 'border-secondary/40' : 'border-amber-400/40'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-outline font-bold">
                        <span>SLOT 04</span>
                        <span className={shard4Signed ? 'text-secondary' : 'text-amber-400'}>
                          {shard4Signed ? 'SHARD VERIFIED' : 'PENDING INGEST'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-on-surface mt-1 truncate">Dep. Dir. H. Chen</div>
                      <div className="text-[10px] text-outline">Intelligence Oversight</div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30">
                      {shard4Signed ? (
                        <div className="flex items-center justify-between text-[9px] text-secondary font-bold py-0.5">
                          <span className="flex items-center">
                            <span className="material-symbols-outlined text-xs mr-0.5">verified</span>
                            YUBIKEY TOKEN SIGNED
                          </span>
                          <span>✓</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSignShard4}
                          className="w-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/40 text-[9px] font-mono font-bold py-0.5 px-1 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">usb</span>
                          <span>INSERT HARDWARE TOKEN</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Custodian 5 */}
                  <div className="bg-surface-container-low border border-outline-variant/60 p-2 flex flex-col justify-between opacity-70">
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-outline font-bold">
                        <span>SLOT 05</span>
                        <span className="text-outline">NOT REQUIRED</span>
                      </div>
                      <div className="text-xs font-medium text-outline mt-1 truncate">Legal Counsel Enclave</div>
                      <div className="text-[10px] text-outline/80">Warrant Archive Vault</div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-[9px] text-outline flex items-center">
                        <span className="material-symbols-outlined text-xs mr-0.5">schedule</span>
                        OFFLINE STANDBY
                      </span>
                      <span className="text-outline text-xs">--</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Live Hardware Ceremony Telemetry Terminal */}
              <div className="bg-surface-container-lowest border border-outline-variant p-2.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-outline uppercase pb-1 border-b border-outline-variant/30 mb-1.5 font-bold">
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span>LIVE HARDWARE CEREMONY TELEMETRY &amp; KEY GENERATION LOG (RING-0 ENCLAVE)</span>
                  </div>
                  <span className="text-secondary font-mono">STATUS: QKD_LOCKED // SYMMETRIC CASCADE</span>
                </div>
                <div
                  ref={modalTerminalRef}
                  className="bg-black/60 border border-outline-variant/50 p-2 text-[11px] leading-relaxed space-y-0.5 text-on-surface-variant max-h-28 overflow-y-auto font-mono"
                >
                  {ceremonyLogs.map((log, i) => (
                    <div key={i} className="animate-fade-in">{log}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Modal Footer Action Controls */}
            <div className="px-4 py-2.5 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 font-mono">
              <button
                type="button"
                onClick={closeCeremony}
                className="w-full sm:w-auto border border-error/60 hover:bg-error/20 text-error text-[10px] font-bold px-3 py-1.5 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                <span>ABORT &amp; ZEROIZE BUFFER</span>
              </button>

              <div className="w-full sm:w-auto flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleVerifyLattice}
                  className="flex-1 sm:flex-none border border-outline-variant hover:bg-surface-bright text-on-surface text-[10px] font-bold px-3 py-1.5 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-primary">psychology</span>
                  <span>VERIFY LATTICE COEFFICIENTS</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRotation}
                  className={`flex-1 sm:flex-none font-bold text-[11px] px-4 py-1.5 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md ${
                    isRotationComplete
                      ? 'bg-secondary hover:bg-secondary-fixed text-on-secondary-fixed'
                      : 'bg-primary hover:bg-primary-fixed text-on-primary-fixed shadow-primary/20 hover:shadow-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isRotationComplete ? 'verified' : 'lock_reset'}
                  </span>
                  <span>
                    {isRotationComplete ? 'ROTATION COMPLETE // CLOSE CEREMONY (ESC)' : 'EXECUTE ROTATION & BROADCAST NEW KEK'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zeroize Confirmation Dialog */}
      {isZeroizeModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest border border-error/60 p-6 max-w-md w-full shadow-[0_0_30px_rgba(255,61,0,0.3)]">
            <div className="flex items-center space-x-2 text-error mb-3 font-mono font-bold">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <span className="text-base uppercase tracking-wider">CONFIRM ENCLAVE ZEROIZATION</span>
            </div>
            <p className="text-xs font-mono text-on-surface leading-relaxed mb-4">
              WARNING: This operation executes an immediate hardware crypto-erase across volatile PCIe memory and master keyrings. All active sessions and wiretap streams will be permanently terminated.
            </p>
            <div className="flex justify-end space-x-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsZeroizeModalOpen(false)}
                className="px-3 py-1.5 border border-outline-variant hover:bg-surface-container-high text-on-surface cursor-pointer font-bold"
              >
                ABORT
              </button>
              <button
                type="button"
                onClick={() => handleAction('zeroize')}
                className="px-3 py-1.5 bg-error text-surface-container-lowest font-bold hover:bg-error-container cursor-pointer"
              >
                PROCEED WITH ZEROIZE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyVaultHSM;
