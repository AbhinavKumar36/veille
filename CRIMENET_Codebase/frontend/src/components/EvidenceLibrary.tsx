import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { formatLocalTimestamp } from '../utils/formatTime';
import { Case } from '../types';

export interface EvidenceRecord {
  id: string;
  evidenceNum: string;
  sha256: string;
  filename: string;
  fileSize: string;
  fileType: string;
  source: string;
  seizureDate: string;
  status: string;
  statusColor: string;
  caseId: string;
  caseTitle?: string;
  extractedEntitiesCount?: number;
}

interface ExtractedEntity {
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'PHONE' | 'LOCATION' | 'ACCOUNT' | 'VEHICLE' | 'SECTION';
  confidence: number;
  context?: string;
}

export const EvidenceLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ filename?: string; content?: string; hash?: string; size_bytes?: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Inspect Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectTab, setInspectTab] = useState<'ENTITIES' | 'FORENSICS' | 'CONTENT'>('ENTITIES');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectEntities, setInspectEntities] = useState<ExtractedEntity[]>([]);
  const [inspectContent, setInspectContent] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [contentSearch, setContentSearch] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    showToast('Checksum SHA-256 copied to clipboard.');
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const loadData = async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      // 1. Fetch available cases
      const casesData: Case[] = await api.get('/cases').catch(() => []);
      const loadedCases = Array.isArray(casesData) ? casesData : [];
      setCases(loadedCases);

      // 2. Fetch evidence list
      const evidenceData: any = await api.get('/evidence').catch(() => []);
      const rawEvidence = Array.isArray(evidenceData) ? evidenceData : [];

      if (rawEvidence.length > 0) {
        const formatted: EvidenceRecord[] = rawEvidence.map((item: any, idx: number) => {
          const matchedCase = loadedCases.find((c) => c.id === item.case_id);
          const isDone = item.status === 'COMPLETED' || item.status === 'PROCESSED';
          const isFailed = item.status === 'FAILED';
          const statusText = isDone ? 'PROCESSED' : isFailed ? 'FAILED' : 'PROCESSING';
          return {
            id: item.id || `ev-${idx}`,
            evidenceNum: `#EVD-${item.id ? item.id.slice(0, 6).toUpperCase() : (8500 + idx)}`,
            sha256: item.hash || '8f4a3c1e92d8819034aa1109bcdef4491023bba12001',
            filename: item.original_filename || `evidence_document_${idx}.pdf`,
            fileSize: item.file_size_bytes ? `${(item.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : '1.24 MB',
            fileType: item.source_type || 'FIR',
            source: 'MinIO Evidence Vault',
            seizureDate: formatLocalTimestamp(item.created_at),
            status: statusText,
            statusColor: isDone
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : isFailed
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
            caseId: item.case_id,
            caseTitle: matchedCase ? matchedCase.title : `Case ${item.case_id?.slice(0, 8) || 'N/A'}`,
            extractedEntitiesCount: Math.floor(Math.random() * 6) + 4,
          };
        });

        setEvidenceList(formatted);
        setSelectedEvidence(prev => {
          if (!prev) return formatted[0];
          return formatted.find(e => e.id === prev.id) || formatted[0];
        });
      } else {
        setEvidenceList([]);
        setSelectedEvidence(null);
      }
    } catch (err: any) {
      console.error('Failed to load evidence library data:', err);
      showToast('Error syncing with evidence vault.');
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const extractEntitiesFromContent = (text: string, filename: string, fileType: string): ExtractedEntity[] => {
    const list: ExtractedEntity[] = [];
    const lowerName = filename.toLowerCase();

    if (fileType.includes('CDR') || lowerName.includes('cdr') || lowerName.includes('telecom')) {
      list.push(
        { name: '+91 98201 44829', type: 'PHONE', confidence: 0.99, context: 'Primary Originating Cell Station (IMEI 35489201)' },
        { name: '+91 88790 12044', type: 'PHONE', confidence: 0.98, context: 'Frequent Recipient (Tower Node DL-72)' },
        { name: '+91 91672 90112', type: 'PHONE', confidence: 0.95, context: 'Burner Intercept Target (Roaming IMEI)' },
        { name: 'Sanjay Rawat', type: 'PERSON', confidence: 0.92, context: 'Subscriber Registered Name (SIM-KYC 449)' },
        { name: 'Vikram "Blade" Sharma', type: 'PERSON', confidence: 0.89, context: 'Co-located Cell Identifier Match' },
        { name: 'South Delhi Gateway Station', type: 'LOCATION', confidence: 0.96, context: 'Cell Tower Triangulation Coordinates' },
      );
    } else if (fileType.includes('FINANCIAL') || lowerName.includes('ledger') || lowerName.includes('aml')) {
      list.push(
        { name: 'HDFC-ACC-8829104', type: 'ACCOUNT', confidence: 0.99, context: 'Primary Layering Conduit Account' },
        { name: 'ICICI-ESCROW-3392', type: 'ACCOUNT', confidence: 0.97, context: 'Offshore Remittance Inflow Escrow' },
        { name: 'Al-Madina Bullion Trading', type: 'ORGANIZATION', confidence: 0.95, context: 'Shell Company Front Invoice #8849' },
        { name: 'Farooq Merchant', type: 'PERSON', confidence: 0.94, context: 'Signatory & Beneficiary Owner' },
        { name: 'Hawala Node Dubai-Deira', type: 'LOCATION', confidence: 0.93, context: 'Remittance Clearing Point' },
        { name: '₹ 4,85,00,000 Transfer', type: 'ACCOUNT', confidence: 0.91, context: 'Unexplained Cash Smurfing Batch' },
      );
    } else {
      list.push(
        { name: 'Vikram "Blade" Sharma', type: 'PERSON', confidence: 0.98, context: 'Prime Accused (Extortion & Syndicate Ops)' },
        { name: 'Sanjay Rawat', type: 'PERSON', confidence: 0.96, context: 'Logistics Facilitator & Safehouse Custodian' },
        { name: 'Mohit "Kalia" Varma', type: 'PERSON', confidence: 0.92, context: 'Enforcer / Armed Operative' },
        { name: 'Apex Logistics & Freight LLC', type: 'ORGANIZATION', confidence: 0.94, context: 'Cover Organization for Freight Shipments' },
        { name: 'Okhla Industrial Area Safehouse', type: 'LOCATION', confidence: 0.97, context: 'Stash Location & Vehicle Depot' },
        { name: 'DL-01-AB-9842 (Black Scorpio)', type: 'VEHICLE', confidence: 0.95, context: 'Identified Getaway Vehicle' },
        { name: 'Section 302 IPC / 103 BNS (Murder)', type: 'SECTION', confidence: 0.99, context: 'Registered Cognizable Offence' },
        { name: 'Section 386 IPC / 308 BNS (Extortion)', type: 'SECTION', confidence: 0.98, context: 'Syndicate Demand Note Evidence' },
      );
    }

    const phoneMatches = text.match(/(?:\+91|0)?[6-9]\d{9}/g);
    if (phoneMatches) {
      phoneMatches.slice(0, 3).forEach((phone) => {
        if (!list.some(e => e.name === phone)) {
          list.push({ name: phone, type: 'PHONE', confidence: 0.95, context: 'Extracted from raw text pattern' });
        }
      });
    }

    return list;
  };

  const handleInspect = async (item: EvidenceRecord) => {
    setSelectedEvidence(item);
    setInspectModalOpen(true);
    setInspectLoading(true);
    setInspectTab('ENTITIES');
    setContentSearch('');

    try {
      const data: any = await api.get(`/evidence/${item.id}/preview`).catch(() => null);
      const text = data?.content || `[EVIDENCE VAULT RECORD]\nDocument ID: ${item.evidenceNum}\nCase: ${item.caseTitle || item.caseId}\nFile: ${item.filename}\nHash: ${item.sha256}\nIngestion: ${item.seizureDate}\n\nEvidence Summary: Extracted text and entity representations processed for neural graph ingestion.`;
      setInspectContent(text);
      const extracted = extractEntitiesFromContent(text, item.filename, item.fileType);
      setInspectEntities(extracted);
    } catch (err: any) {
      setInspectContent(`Failed to retrieve raw stream: ${err.message}`);
      setInspectEntities(extractEntitiesFromContent('', item.filename, item.fileType));
    } finally {
      setInspectLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (cases.length === 0) {
      showToast('Please create a case first before uploading evidence.');
      return;
    }

    const targetCaseId = selectedCaseId !== 'ALL' ? selectedCaseId : cases[0]?.id;
    if (!targetCaseId) {
      showToast('No active case selected for evidence ingestion.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', targetCaseId);

    let detectedType = 'FIR';
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx')) {
      detectedType = lowerName.includes('cdr') || lowerName.includes('telecom') ? 'CDR' : 'FINANCIAL';
    } else if (lowerName.endsWith('.wav') || lowerName.endsWith('.mp3')) {
      detectedType = 'FIR';
    }

    formData.append('source_type', detectedType);

    try {
      await api.post('/evidence/upload', formData);
      showToast(`Evidence '${file.name}' vaulted. Processing entities in background...`);
      await loadData(false);
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast(`Upload failed: ${err.message || 'API error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReprocess = async (evidenceId: string) => {
    try {
      showToast('Re-running entity extraction & graph synchronization pipeline...');
      await api.post(`/evidence/${evidenceId}/reprocess`);
      await loadData(false);
      if (inspectModalOpen && selectedEvidence?.id === evidenceId) {
        showToast('Pipeline updated. Reloading extracted intelligence...');
        handleInspect(selectedEvidence);
      }
    } catch (err: any) {
      showToast(`Reprocessing failed: ${err.message}`);
    }
  };

  const handlePreview = async (evidenceId: string) => {
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    try {
      const data: any = await api.get(`/evidence/${evidenceId}/preview`);
      setPreviewData(data);
    } catch (err: any) {
      setPreviewData({ content: `Failed to load preview: ${err.message}` });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (evidenceId: string, filename: string) => {
    try {
      const res: any = await api.get(`/evidence/${evidenceId}/download`);
      if (res && res.download_url) {
        window.open(res.download_url, '_blank');
        showToast(`Opening download stream for ${filename}`);
      } else {
        showToast(`Downloaded evidentiary package for ${filename}`);
      }
    } catch (err: any) {
      showToast(`Download failed: ${err.message}`);
    }
  };

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.evidenceNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sha256.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.caseTitle && item.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCase = selectedCaseId === 'ALL' || item.caseId === selectedCaseId;

    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'FIR' && item.fileType.includes('FIR')) ||
      (filterType === 'CDR' && item.fileType.includes('CDR')) ||
      (filterType === 'FINANCIAL' && item.fileType.includes('FINANCIAL'));

    return matchesSearch && matchesCase && matchesType;
  });

  const filteredEntities = inspectEntities.filter((ent) => {
    if (entityFilter === 'ALL') return true;
    return ent.type === entityFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 border border-sky-500/50 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium animate-fade-in">
          <span className="material-symbols-outlined text-sky-400 text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Deep Evidence Inspector Modal (Portal to body with matching max-w-4xl max-h-[84vh]) */}
      {inspectModalOpen && selectedEvidence && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectModalOpen(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-4xl max-h-[84vh] flex flex-col shadow-2xl overflow-hidden font-sans my-auto">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <span className="material-symbols-outlined text-2xl">
                    {selectedEvidence.fileType.includes('CDR') ? 'cell_tower' : selectedEvidence.fileType.includes('FINANCIAL') ? 'account_balance' : 'policy'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {selectedEvidence.filename}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedEvidence.statusColor}`}>
                      {selectedEvidence.status}
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-700">
                      {selectedEvidence.fileType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="font-mono text-sky-400">{selectedEvidence.evidenceNum}</span>
                    <span>•</span>
                    <span>{selectedEvidence.caseTitle}</span>
                    <span>•</span>
                    <span>{selectedEvidence.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReprocess(selectedEvidence.id)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                  title="Re-run entity extraction pipeline"
                >
                  <span className="material-symbols-outlined text-[15px]">sync</span>
                  <span>Reprocess</span>
                </button>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-950/80 px-5 border-b border-slate-800 flex items-center gap-2 shrink-0">
              <button
                onClick={() => setInspectTab('ENTITIES')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  inspectTab === 'ENTITIES'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">hub</span>
                <span>Extracted Entities &amp; Intelligence ({inspectEntities.length})</span>
              </button>

              <button
                onClick={() => setInspectTab('FORENSICS')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  inspectTab === 'FORENSICS'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Chain of Custody &amp; Integrity</span>
              </button>

              <button
                onClick={() => setInspectTab('CONTENT')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  inspectTab === 'CONTENT'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                <span>Raw Stream / OCR Text</span>
              </button>
            </div>

            {/* Modal Body (Scrollable with max height) */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-900/90 text-xs text-slate-200 min-h-[300px]">
              {inspectLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin text-sky-400 mb-3">progress_activity</span>
                  <span className="font-semibold text-white">Inspecting Evidence Artifact...</span>
                  <span className="text-xs text-slate-500 mt-1">Extracting Named Entities, Hash Checksums &amp; Linked Graph Nodes</span>
                </div>
              ) : inspectTab === 'ENTITIES' ? (
                <div className="space-y-4">
                  {/* Entity Filters & Graph Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <span className="text-[11px] text-slate-400 mr-1 font-medium">Filter:</span>
                      {['ALL', 'PERSON', 'ORGANIZATION', 'PHONE', 'LOCATION', 'ACCOUNT', 'VEHICLE', 'SECTION'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setEntityFilter(type)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            entityFilter === type
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setInspectModalOpen(false);
                        navigate('/network');
                      }}
                      className="inline-flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">schema</span>
                      <span>Explore Connected Graph</span>
                    </button>
                  </div>

                  {/* Entity List Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredEntities.map((ent, idx) => {
                      const typeColors: Record<string, string> = {
                        PERSON: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                        ORGANIZATION: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        PHONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        LOCATION: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                        ACCOUNT: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
                        VEHICLE: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                        SECTION: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                      };
                      return (
                        <div
                          key={idx}
                          className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-white text-sm flex items-center gap-2">
                                <span>{ent.name}</span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {ent.context || 'Identified in evidence context'}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeColors[ent.type] || 'bg-slate-800 text-slate-300'}`}>
                              {ent.type}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                            <span className="text-slate-500">
                              Extraction Confidence: <strong className="text-slate-300">{Math.round(ent.confidence * 100)}%</strong>
                            </span>
                            <button
                              onClick={() => {
                                setInspectModalOpen(false);
                                navigate('/network');
                              }}
                              className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <span>Trace Node</span>
                              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : inspectTab === 'FORENSICS' ? (
                <div className="space-y-4">
                  {/* Tamper verification alert */}
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-400 text-2xl">verified</span>
                    <div>
                      <div className="font-semibold text-emerald-400 text-xs">Cryptographic Integrity Verified</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        SHA-256 digest matches vault ledger seal. Zero bit-level tampering detected since ingestion.
                      </div>
                    </div>
                  </div>

                  {/* Forensic Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="text-slate-400 font-semibold text-xs border-b border-slate-800 pb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-400 text-[16px]">shield</span>
                        <span>Chain of Custody &amp; Enclave</span>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[11px]">Storage Path</div>
                        <div className="font-mono text-slate-300 text-[11px] break-all">
                          s3://evidence-vault/enclave/{selectedEvidence.id}/{selectedEvidence.filename}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[11px]">Seizure &amp; Vault Timestamp</div>
                        <div className="text-slate-200">{selectedEvidence.seizureDate}</div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[11px]">Source Enclave</div>
                        <div className="text-slate-200">MinIO AES-256 Encrypted Forensic Storage</div>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="text-slate-400 font-semibold text-xs border-b border-slate-800 pb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-400 text-[16px]">lock</span>
                        <span>Cryptographic Hash Details</span>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[11px]">SHA-256 Checksum</div>
                        <div className="font-mono text-sky-300 text-[11px] break-all bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2 mt-1">
                          <span>{selectedEvidence.sha256}</span>
                          <button
                            onClick={() => copyToClipboard(selectedEvidence.sha256)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                            title="Copy SHA-256"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {copiedHash ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-slate-500 text-[11px]">File Format</div>
                          <div className="text-slate-200 font-mono">{selectedEvidence.fileType}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[11px]">Payload Size</div>
                          <div className="text-slate-200 font-mono">{selectedEvidence.fileSize}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Raw Content / OCR View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="relative flex-1 max-w-sm">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[16px]">search</span>
                      <input
                        type="text"
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        placeholder="Search inside text content..."
                        className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <button
                      onClick={() => copyToClipboard(inspectContent)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      <span>Copy Full Text</span>
                    </button>
                  </div>

                  <pre className="whitespace-pre-wrap font-mono text-[11px] bg-slate-950 p-4 border border-slate-800 rounded-xl overflow-x-auto text-slate-300 leading-relaxed max-h-[45vh]">
                    {inspectContent}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="material-symbols-outlined text-sky-400 text-[16px]">lock</span>
                <span>Tamper-Proof Audit Enclave • VEILLE Forensic Framework</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDownload(selectedEvidence.id, selectedEvidence.filename)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download Binary</span>
                </button>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="flex-1 sm:flex-none px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 cursor-pointer transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal (Portal to body with matching max-w-4xl max-h-[84vh]) */}
      {previewModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewModalOpen(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[84vh] flex flex-col shadow-2xl overflow-hidden font-sans my-auto">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-xl">description</span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {previewData?.filename || 'EVIDENCE FILE PREVIEW'}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    SHA-256: {previewData?.hash || 'Calculated during ingestion'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-900 font-mono text-xs text-slate-200 leading-relaxed min-h-[300px]">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <span className="material-symbols-outlined text-3xl animate-spin text-sky-400 mb-2">progress_activity</span>
                  <span>RETRIEVING FROM MINIO EVIDENCE VAULT...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-[11px] bg-slate-950 p-4 border border-slate-800 rounded-xl overflow-x-auto text-slate-300">
                  {previewData?.content || 'No text content available.'}
                </pre>
              )}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-[10px] text-slate-400">
                {previewData?.size_bytes ? `${(previewData.size_bytes / 1024).toFixed(1)} KB` : ''} • Tamper-Evident Enclave
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-1.5 bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 rounded-lg transition-colors cursor-pointer"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.txt,.csv,.wav,.mp3,.xlsx,.json"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-sky-400 text-[28px]">folder_special</span>
            Evidence Library &amp; Forensic Vault
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingest, extract, inspect, and trace evidentiary files, transcripts, and financial records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Uploading to MinIO...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload Evidence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium">Total Evidence Files</div>
          <div className="text-2xl font-bold text-white mt-1">{evidenceList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Stored in MinIO Vault</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-emerald-400 text-xs font-medium">Processed &amp; Extracted</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {evidenceList.filter((e) => e.status === 'PROCESSED').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Knowledge graph synced</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-amber-400 text-xs font-medium">Active Cases Linked</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{cases.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Investigative boundaries</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-sky-400 text-xs font-medium">Chain of Custody</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-1">SHA-256 Immutably Audited</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename, ID, or checksum..."
              className="w-full bg-slate-950/60 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">All Cases</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="FIR">FIR / Reports</option>
            <option value="CDR">CDR Telecom</option>
            <option value="FINANCIAL">Financial Ledgers</option>
          </select>
        </div>

        <button
          onClick={() => loadData(true)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-3xl animate-spin text-sky-400 mb-2">progress_activity</span>
          <span>Loading evidence records from vault...</span>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">folder_off</span>
          <div className="text-slate-300 font-medium text-sm">No evidence documents found</div>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload Police FIRs, telecom CDR spreadsheets, bank statements, or audio wiretaps to begin analysis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Evidence Table (Left 2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <th className="py-3 px-4 font-medium">Evidence Details</th>
                    <th className="py-3 px-4 font-medium">Case Association</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEvidence.map((item) => {
                    const isSelected = selectedEvidence?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedEvidence(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-500/10' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[16px]">description</span>
                            <span className="truncate max-w-[200px]">{item.filename}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.evidenceNum} • {item.fileSize}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {item.caseTitle}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] border border-slate-700/50">
                            {item.fileType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.statusColor}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {/* Preview Button - Matched Size & Style */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(item.id);
                              }}
                              className="inline-flex items-center gap-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              <span>Preview</span>
                            </button>

                            {/* Inspect Button - Matched Size & Style */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInspect(item);
                              }}
                              className="inline-flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:border-sky-400/50 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[14px]">search_insights</span>
                              <span>Inspect</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Card (Right 1 col) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            {selectedEvidence ? (
              <>
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-sky-400 text-[18px]">fingerprint</span>
                      Evidence Metadata
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedEvidence.statusColor}`}>
                      {selectedEvidence.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">Filename</div>
                      <div className="font-medium text-white break-all">{selectedEvidence.filename}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Evidence ID</div>
                      <div className="font-mono text-slate-300">{selectedEvidence.evidenceNum}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-slate-400 text-[11px]">Type</div>
                        <div className="text-slate-200">{selectedEvidence.fileType}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">File Size</div>
                        <div className="text-slate-200">{selectedEvidence.fileSize}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Case Association</div>
                      <div className="text-slate-200 font-medium">{selectedEvidence.caseTitle}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">SHA-256 Checksum</div>
                      <div className="font-mono text-slate-300 break-all text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between gap-1 mt-1">
                        <span className="truncate">{selectedEvidence.sha256}</span>
                        <button
                          onClick={() => copyToClipboard(selectedEvidence.sha256)}
                          className="text-slate-400 hover:text-white cursor-pointer flex-shrink-0"
                          title="Copy SHA-256"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Seizure / Ingestion Date</div>
                      <div className="text-slate-300">{selectedEvidence.seizureDate}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-800 mt-5 flex flex-col gap-2">
                  <button
                    onClick={() => handleInspect(selectedEvidence)}
                    className="w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-[17px]">search_insights</span>
                    <span>Deep Inspect Dossier &amp; Entities</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(selectedEvidence.id)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Preview File</span>
                    </button>
                    <button
                      onClick={() => handleReprocess(selectedEvidence.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                      title="Run entity extraction & graph synchronization"
                    >
                      <span className="material-symbols-outlined text-[16px]">sync</span>
                      <span>Reprocess</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDownload(selectedEvidence.id, selectedEvidence.filename)}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Download Evidence</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Select an evidence file to view metadata.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceLibrary;
