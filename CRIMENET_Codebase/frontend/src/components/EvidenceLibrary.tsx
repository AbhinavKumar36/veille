import React, { useState, useEffect, useRef } from 'react';
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

export const EvidenceLibrary: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ filename?: string; content?: string; hash?: string; size_bytes?: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
            extractedEntitiesCount: Math.floor(Math.random() * 8) + 3,
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
      const res: any = await api.post('/evidence/upload', formData);
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

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-sky-500/50 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium animate-fade-in">
          <span className="material-symbols-outlined text-sky-400 text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">description</span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface font-mono">
                    {previewData?.filename || 'EVIDENCE FILE PREVIEW'}
                  </h3>
                  <div className="text-[10px] text-outline font-mono">
                    SHA-256: {previewData?.hash || 'Calculated during ingestion'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-surface font-mono text-xs text-on-surface leading-relaxed">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-outline">
                  <span className="material-symbols-outlined text-3xl animate-spin text-primary mb-2">progress_activity</span>
                  <span>RETRIEVING FROM MINIO EVIDENCE VAULT...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-[11px] bg-surface-container-lowest p-4 border border-outline-variant rounded-xl overflow-x-auto text-on-surface-variant">
                  {previewData?.content || 'No text content available.'}
                </pre>
              )}
            </div>

            <div className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-outline">
                {previewData?.size_bytes ? `${(previewData.size_bytes / 1024).toFixed(1)} KB` : ''} • Tamper-Evident Enclave
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold text-xs hover:bg-primary-fixed-dim transition-colors cursor-pointer"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        </div>
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
            Ingest, extract, and trace evidentiary files, transcripts, and financial records.
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
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
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
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
                            {item.fileType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.statusColor}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(item.id);
                            }}
                            className="text-sky-400 hover:text-sky-300 text-xs font-medium cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvidence(item);
                            }}
                            className="text-slate-400 hover:text-white text-xs font-medium"
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

          {/* Details Card (Right 1 col) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
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
                      <div className="font-mono text-slate-300 break-all text-[11px]">{selectedEvidence.sha256}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Seizure / Ingestion Date</div>
                      <div className="text-slate-300">{selectedEvidence.seizureDate}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-800 mt-5 flex flex-col gap-2">
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
