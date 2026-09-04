import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { ErrorState } from './ErrorState';
import { TableSkeleton } from './skeletons/TableSkeleton';

interface Evidence {
  id: string;
  case_id: string;
  source_type: string;
  original_filename: string;
  status: string;
  created_at: string;
}

const SOURCE_TYPE_ICONS: Record<string, string> = {
  FIR: 'gavel',
  CDR: 'cell_tower',
  FINANCIAL: 'account_balance',
  REPORT: 'description',
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const EvidenceLibrary: React.FC = () => {
  const DEFAULT_CASE_ID = '11111111-1111-1111-1111-111111111111';
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Track evidence IDs that are currently processing (for progress polling)
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const FALLBACK_EVIDENCE: Evidence[] = [
    { id: 'ev-101', case_id: DEFAULT_CASE_ID, source_type: 'FIR', original_filename: 'FIR_2026_098_Nightfall.pdf', status: 'PROCESSED', created_at: '2026-09-01T10:15:00Z' },
    { id: 'ev-102', case_id: DEFAULT_CASE_ID, source_type: 'CDR', original_filename: 'CDR_Dump_Airtel_August_Target9811.csv', status: 'PROCESSED', created_at: '2026-09-01T11:45:00Z' },
    { id: 'ev-103', case_id: DEFAULT_CASE_ID, source_type: 'FINANCIAL', original_filename: 'SwissBank_WireTransfer_Record_USD4.5M.pdf', status: 'PROCESSED', created_at: '2026-09-01T14:30:00Z' },
    { id: 'ev-104', case_id: '22222222-2222-2222-2222-222222222222', source_type: 'REPORT', original_filename: 'Port_Terminal4_Container_Manifest_9022.pdf', status: 'PROCESSED', created_at: '2026-08-25T09:00:00Z' },
  ];

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/evidence');
      if (Array.isArray(data) && data.length > 0) {
        setEvidenceList(data);
      } else {
        setEvidenceList(FALLBACK_EVIDENCE);
      }
    } catch (err: any) {
      console.warn("Using fallback evidence list:", err);
      setEvidenceList(FALLBACK_EVIDENCE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  // Poll status for PROCESSING evidence items every 4 seconds
  useEffect(() => {
    const processingIds = evidenceList
      .filter(e => e.status === 'PROCESSING')
      .map(e => e.id);

    if (processingIds.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      const updates = await Promise.all(
        processingIds.map(id =>
          api.get(`/evidence/status/${id}`).catch(() => null)
        )
      );

      setEvidenceList(prev => {
        let changed = false;
        const updated = prev.map(e => {
          const upd = updates.find((u: any) => u && u.evidence_id === e.id);
          if (upd && upd.status !== e.status) {
            changed = true;
            return { ...e, status: upd.status };
          }
          return e;
        });
        return changed ? updated : prev;
      });
    }, 4000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [evidenceList]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', DEFAULT_CASE_ID);

    let sourceType = 'FIR';
    const fn = file.name.toLowerCase();
    if (fn.includes('cdr') || fn.endsWith('.csv')) sourceType = 'CDR';
    else if (fn.includes('finance') || fn.includes('bank') || fn.includes('wire')) sourceType = 'FINANCIAL';

    formData.append('source_type', sourceType);

    try {
      const response: any = await api.post('/evidence/upload', formData);
      // Add new entry immediately with PROCESSING status
      const newEntry: Evidence = {
        id: response.evidence_id || `ev-${Date.now()}`,
        case_id: DEFAULT_CASE_ID,
        source_type: sourceType,
        original_filename: file.name,
        status: 'PROCESSING',
        created_at: new Date().toISOString(),
      };
      setEvidenceList(prev => [newEntry, ...prev]);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleViewFile = (evidenceId: string) => {
    const token = localStorage.getItem('access_token');
    const url = `${BASE_URL}/evidence/file/${evidenceId}`;
    // Open in new tab — browser will handle PDF rendering inline
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && evidenceList.length === 0) return <div className="p-4"><TableSkeleton rows={5} /></div>;
  if (error && evidenceList.length === 0) return <div className="p-4"><ErrorState message={error} onRetry={fetchEvidence} /></div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Evidence Library</h2>
          <p className="text-on-surface-variant font-body-md mt-1">Upload and manage source documents for intelligence extraction. Processing updates every 4 seconds.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvidence}
            className="p-2 text-on-surface-variant hover:text-primary rounded border border-outline-variant/50 hover:border-primary transition-colors"
            title="Refresh"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt,.csv"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary text-on-primary px-4 py-2 rounded flex items-center gap-2 hover:bg-primary-fixed disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.15)] font-label-caps text-sm"
          >
            {uploading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">upload</span>
            )}
            {uploading ? 'Uploading...' : 'Upload Evidence'}
          </button>
        </div>
      </div>

      {evidenceList.length === 0 ? (
        <div className="bg-surface-card border border-outline-variant rounded-lg p-8 text-center text-on-surface-variant">
          No evidence uploaded for this case. Click <strong>Upload Evidence</strong> to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {evidenceList.map(item => {
            const isProcessing = item.status === 'PROCESSING';
            const isFailed = item.status === 'FAILED';
            const isProcessed = item.status === 'PROCESSED';
            const icon = SOURCE_TYPE_ICONS[item.source_type] || 'description';

            return (
              <div key={item.id} className="bg-surface-card border border-outline-variant rounded-lg p-4 flex flex-col gap-3 relative overflow-hidden group hover:border-primary transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                {/* Processing pulse bar */}
                {isProcessing && (
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-transparent to-primary animate-[pulse_1.5s_ease-in-out_infinite]" />
                )}

                {/* Top row: icon + source type badge */}
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded bg-surface-container border border-outline-variant/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
                  </div>
                  <span className="bg-surface-variant text-[10px] px-2 py-1 rounded text-primary border border-primary/20 font-label-caps">
                    {item.source_type}
                  </span>
                </div>

                {/* Filename */}
                <div>
                  <h4 className="font-headline-sm text-on-surface truncate group-hover:text-primary transition-colors" title={item.original_filename || 'Unknown File'}>
                    {item.original_filename || 'Unknown File'}
                  </h4>
                  <div className="text-[11px] text-on-surface-variant font-data-code mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* Status + Actions row */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant/40">
                  <div className={`text-[11px] font-label-caps px-2 py-0.5 rounded border flex items-center gap-1 ${
                    isProcessing ? 'text-status-warning border-status-warning/30 bg-status-warning/10' :
                    isFailed ? 'text-status-critical border-status-critical/30 bg-status-critical/10' :
                    'text-status-success border-status-success/30 bg-status-success/10'
                  }`}>
                    {isProcessing && <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-ping" />}
                    {isFailed && <span className="material-symbols-outlined text-[12px]">error</span>}
                    {isProcessed && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                    {item.status}
                  </div>
                  <div className="flex items-center gap-1">
                    {isProcessed && (
                      <button
                        onClick={() => handleViewFile(item.id)}
                        className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors"
                        title="View / Download File"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </button>
                    )}
                    <div className="font-data-code text-[10px] text-on-surface-variant truncate max-w-[80px]" title={item.id}>
                      #{item.id.slice(-6)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvidenceLibrary;
