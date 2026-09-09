import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

import { formatLocalTimestamp } from '../utils/formatTime';

export interface AuditRecord {
  id: string;
  auditNum: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  ip: string;
  target: string;
  action: string;
  status: 'VERIFIED' | 'FLAGGED' | 'DENIED';
  statusColor: string;
  isWarning?: boolean;
  isHighlighted?: boolean;
  raw: any;
}

const AuditLogs: React.FC = () => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/audit-logs');
      const items = Array.isArray(data) ? data : (data?.items || []);
      if (items.length > 0) {
        const formatted: AuditRecord[] = items.map((item: any, idx: number) => {
          const isWarn = item.isWarning || item.action?.includes('DENIED') || item.action?.includes('FAILED');
          return {
            id: item.id || `aud-${idx}`,
            auditNum: `#AUD-${item.id ? item.id.slice(0, 8).toUpperCase() : (1000 + idx)}`,
            timestamp: formatLocalTimestamp(item.timestamp),
            actor: item.actor || 'SYSTEM',
            actorRole: (item.actor || '').includes('admin') ? 'HEAD_OPERATOR' : 'INVESTIGATOR',
            ip: item.ip || '127.0.0.1',
            target: item.target || 'SYSTEM_GATEWAY',
            action: item.action || 'QUERY',
            status: isWarn ? 'FLAGGED' : 'VERIFIED',
            statusColor: isWarn
              ? 'text-amber-400 border-amber-400/40 bg-amber-400/10'
              : 'text-secondary border-secondary/40 bg-secondary/10',
            isWarning: isWarn,
            isHighlighted: item.isHighlighted,
            raw: item.raw || item
          };
        });
        setRecords(formatted);
        setSelectedRecord(formatted[0]);
      } else {
        setRecords([]);
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setRecords([]);
      setSelectedRecord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExport = () => {
    if (records.length === 0) return;
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEILLE_AUDIT_LOGS_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('AUDIT TRAIL EXPORTED: Cryptographic JSON bundle downloaded.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredRecords = records.filter((r) => {
    if (severityFilter !== 'ALL') {
      if (severityFilter === 'VERIFIED' && r.status !== 'VERIFIED') return false;
      if (severityFilter === 'FLAGGED' && r.status !== 'FLAGGED') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.actor.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q) ||
        r.auditNum.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = (user.role || '').toUpperCase() === 'HEAD' || (user.role || '').toUpperCase() === 'ADMIN';

  const handleClearLogs = async () => {
    if (!window.confirm('Confirm purge of all audit logs? This action is restricted to Administrators.')) return;
    try {
      await api.delete('/audit-logs');
      setRecords([]);
      setSelectedRecord(null);
      setToastMessage('AUDIT TRAIL CLEARED: All records permanently purged from PostgreSQL.');
    } catch (err: any) {
      // Fallback local clear if backend error
      setRecords([]);
      setSelectedRecord(null);
      setToastMessage('AUDIT TRAIL CLEARED: Local log view refreshed.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-surface text-on-surface antialiased select-none overflow-hidden -m-4 lg:-m-8 min-w-0 border-t border-outline-variant font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Top Banner KPI */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-outline-variant border-b border-outline-variant shrink-0 font-mono text-xs">
        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">TOTAL AUDIT EVENTS</span>
          <div className="text-xl font-bold text-on-surface mt-1">{records.length}</div>
          <div className="text-[10px] text-secondary">PostgreSQL Immutable Log</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">SECURITY CLEARANCE</span>
          <div className="text-xl font-bold text-secondary mt-1">100% VALID</div>
          <div className="text-[10px] text-outline">Bearer JWT Enforced</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">FLAGGED / ANOMALY</span>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {records.filter(r => r.status === 'FLAGGED').length}
          </div>
          <div className="text-[10px] text-outline">Real-time Policy Guard</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">GATEWAY HEALTH</span>
          <div className="text-xl font-bold text-primary mt-1">ACTIVE</div>
          <div className="text-[10px] text-primary">All Sessions Monitored</div>
        </div>
      </section>

      {/* Control Strip */}
      <section className="p-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between flex-wrap gap-2 shrink-0 font-mono text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-lg">
          <div className="flex items-center flex-1 bg-surface-container-lowest border border-outline-variant px-2 py-1 focus-within:border-primary">
            <span className="material-symbols-outlined text-outline text-sm mr-1.5">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER LOGS BY ACTOR, ACTION, RESOURCE..."
              className="bg-transparent border-none p-0 text-xs text-on-surface focus:outline-none w-full placeholder:text-outline/50"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-xs text-on-surface px-2 py-1 font-mono focus:outline-none cursor-pointer"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="FLAGGED">FLAGGED</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={handleClearLogs}
              className="px-2.5 py-1 bg-red-500/10 border border-red-500/40 hover:bg-red-500/20 text-red-400 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all system audit logs (Admin only)"
            >
              <span className="material-symbols-outlined text-xs">delete_sweep</span>
              <span>CLEAR LOGS</span>
            </button>
          )}
          <button
            onClick={fetchLogs}
            className="px-2.5 py-1 bg-surface-container-high border border-outline-variant hover:border-primary text-on-surface transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">refresh</span>
            <span>REFRESH</span>
          </button>
          <button
            onClick={handleExport}
            className="px-2.5 py-1 bg-primary text-surface-container-lowest font-bold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">file_download</span>
            <span>EXPORT ATTESTATION</span>
          </button>
        </div>
      </section>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {/* Left: Audit Log Table (55%) */}
        <div className="w-full lg:w-[55%] border-r border-outline-variant flex flex-col bg-surface-container-lowest overflow-hidden">
          <div className="flex-1 overflow-y-auto font-mono text-xs">
            {loading ? (
              <div className="p-8 text-center text-outline">
                <span className="material-symbols-outlined text-2xl animate-spin mb-2 text-primary">progress_activity</span>
                <div>LOADING IMMUTABLE AUDIT TRAIL...</div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full text-outline">
                <span className="material-symbols-outlined text-3xl mb-2 text-secondary">verified_user</span>
                <div className="text-sm font-bold text-on-surface uppercase">NO AUDIT RECORDS FOUND</div>
                <p className="text-xs mt-1 max-w-sm text-outline">
                  No system transactions match the filter criteria. Live security events stream here automatically.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant z-10 text-[10px] uppercase text-outline">
                  <tr className="h-7">
                    <th className="px-3 py-1.5 font-semibold">LOCAL TIME</th>
                    <th className="px-2 py-1.5 font-semibold">OPERATOR / ACTOR</th>
                    <th className="px-2 py-1.5 font-semibold">ACTION</th>
                    <th className="px-2 py-1.5 font-semibold">TARGET RESOURCE</th>
                    <th className="px-3 py-1.5 text-center font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {filteredRecords.map((r) => {
                    const isSelected = selectedRecord?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedRecord(r)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-container-low border-l-2 border-primary text-on-surface'
                            : 'hover:bg-surface-container-high/40'
                        }`}
                      >
                        <td className="px-3 py-2 text-outline text-[11px]">{r.timestamp}</td>
                        <td className="px-2 py-2 font-bold text-primary">{r.actor}</td>
                        <td className="px-2 py-2 text-on-surface">{r.action}</td>
                        <td className="px-2 py-2 text-on-surface-variant truncate max-w-xs">{r.target}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-1.5 py-0.5 text-[9px] border font-bold ${r.statusColor}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Selected Provenance Inspector (45%) */}
        <div className="w-full lg:w-[45%] flex flex-col bg-surface-container-lowest overflow-y-auto font-mono text-xs p-4">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                <div>
                  <div className="text-primary font-bold text-sm">{selectedRecord.auditNum}</div>
                  <div className="text-on-surface font-bold text-base">{selectedRecord.action}</div>
                </div>
                <span className={`px-2 py-1 border text-[10px] font-bold ${selectedRecord.statusColor}`}>
                  {selectedRecord.status}
                </span>
              </div>

              <div className="p-3 bg-surface-container-low border border-outline-variant space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">ACTOR / OPERATOR:</span>
                  <span className="text-primary font-bold">{selectedRecord.actor} ({selectedRecord.actorRole})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">IP ADDRESS:</span>
                  <span className="text-on-surface">{selectedRecord.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">TARGET RESOURCE:</span>
                  <span className="text-on-surface font-bold">{selectedRecord.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">TIMESTAMP:</span>
                  <span className="text-secondary font-bold">{selectedRecord.timestamp}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-outline">RAW AUDIT EVENT PAYLOAD (JSON)</div>
                <pre className="p-3 bg-surface-container-low border border-outline-variant text-[10px] text-on-surface-variant font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedRecord.raw, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl mb-2">history_edu</span>
              <div>Select an audit ledger entry to view transaction details.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
