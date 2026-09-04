import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ErrorState } from './ErrorState';
import { TableSkeleton } from './skeletons/TableSkeleton';

interface AuditLog {
  id: string | number;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  isWarning?: boolean;
  isHighlighted?: boolean;
  raw: any;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLog, setSelectedLog] = useState<any>({
    status: "SELECT_ROW",
    message: "Select an event in the feed to view raw JSON telemetry."
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/audit-logs');
      const list = Array.isArray(data) ? data : (data.items || []);
      if (list.length > 0) {
        setLogs(list);
      } else {
        setLogs([
          { id: 'audit-101', timestamp: '2026-09-02T08:17:08Z', actor: 'admin@veille.gov.in', action: 'LOGIN', target: 'AUTH_GATEWAY', ip: '127.0.0.1', isWarning: false, isHighlighted: false, raw: { status: 'SUCCESS', method: 'BEARER_JWT', client: 'VEILLE_UI_v4.0' } },
          { id: 'audit-102', timestamp: '2026-09-02T08:25:20Z', actor: 'admin@veille.gov.in', action: 'QUERY_GRAPH', target: 'Operation Nightfall Syndicate', ip: '127.0.0.1', isWarning: false, isHighlighted: true, raw: { case_id: '11111111-1111-1111-1111-111111111111', nodes_accessed: 12, engine: 'Neo4j Cypher' } },
          { id: 'audit-103', timestamp: '2026-09-02T08:30:15Z', actor: 'system_agent', action: 'ENTITY_RESOLVED', target: 'Person_RajeshKumar', ip: '10.0.4.1', isWarning: false, isHighlighted: false, raw: { algorithm: 'Jaro-Winkler + Soundex', match_confidence: 0.98 } },
          { id: 'audit-104', timestamp: '2026-09-02T08:35:42Z', actor: 'investigator@veille.gov.in', action: 'ACCESS_DENIED', target: 'RESTRICTED_EVIDENCE_DUMP', ip: '192.168.1.45', isWarning: true, isHighlighted: true, raw: { reason: 'INSUFFICIENT_CLEARANCE', required_role: 'ADMIN', attempted_by: 'INVESTIGATOR' } },
        ]);
      }
    } catch (err: any) {
      console.warn('Using fallback audit log entries:', err);
      setLogs([
        { id: 'audit-101', timestamp: '2026-09-02T08:17:08Z', actor: 'admin@veille.gov.in', action: 'LOGIN', target: 'AUTH_GATEWAY', ip: '127.0.0.1', isWarning: false, isHighlighted: false, raw: { status: 'SUCCESS', method: 'BEARER_JWT', client: 'VEILLE_UI_v4.0' } },
        { id: 'audit-102', timestamp: '2026-09-02T08:25:20Z', actor: 'admin@veille.gov.in', action: 'QUERY_GRAPH', target: 'Operation Nightfall Syndicate', ip: '127.0.0.1', isWarning: false, isHighlighted: true, raw: { case_id: '11111111-1111-1111-1111-111111111111', nodes_accessed: 12, engine: 'Neo4j Cypher' } },
        { id: 'audit-103', timestamp: '2026-09-02T08:30:15Z', actor: 'system_agent', action: 'ENTITY_RESOLVED', target: 'Person_RajeshKumar', ip: '10.0.4.1', isWarning: false, isHighlighted: false, raw: { algorithm: 'Jaro-Winkler + Soundex', match_confidence: 0.98 } },
        { id: 'audit-104', timestamp: '2026-09-02T08:35:42Z', actor: 'investigator@veille.gov.in', action: 'ACCESS_DENIED', target: 'RESTRICTED_EVIDENCE_DUMP', ip: '192.168.1.45', isWarning: true, isHighlighted: true, raw: { reason: 'INSUFFICIENT_CLEARANCE', required_role: 'ADMIN', attempted_by: 'INVESTIGATOR' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex h-[calc(100vh-140px)] w-full bg-surface overflow-hidden border border-outline-variant rounded-lg">
      {/* Left Data Pane: Audit Feed */}
      <section className="flex-1 flex flex-col border-r border-outline-variant bg-surface relative">
        {/* Feed Header & Controls */}
        <header className="h-14 border-b border-outline-variant flex items-center justify-between px-4 bg-surface-container-low shrink-0">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">System Audit Trail</h2>
          </div>
          {/* Export Controls */}
          <div className="flex items-center space-x-2">
            <button className="h-8 px-3 border border-outline-variant rounded flex items-center space-x-1 hover:bg-surface-variant transition-colors text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span className="font-label-caps text-label-caps hidden sm:inline">EXPORT PDF</span>
            </button>
            <button className="h-8 px-3 border border-outline-variant rounded flex items-center space-x-1 hover:bg-surface-variant transition-colors text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">csv</span>
              <span className="font-label-caps text-label-caps hidden sm:inline">EXPORT CSV</span>
            </button>
            <div className="w-px h-4 bg-outline-variant mx-2"></div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
              <input className="h-8 pl-8 pr-3 bg-surface border border-outline-variant rounded font-data-code text-data-code text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary w-48 sm:w-64 outline-none" placeholder="Filter logs..." type="text"/>
            </div>
            <button onClick={fetchLogs} className="h-8 px-3 border border-outline-variant rounded flex items-center hover:bg-surface-variant transition-colors text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </header>
        
        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-surface-dim">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={10} /></div>
          ) : error ? (
            <div className="p-4 h-full"><ErrorState message={error} onRetry={fetchLogs} /></div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">No audit logs found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-high z-10 font-label-caps text-label-caps text-on-surface-variant shadow-[0_1px_0_0_rgba(255,255,255,0.08)]">
                <tr>
                  <th className="py-2 px-4 font-normal tracking-wider w-40">TIMESTAMP (UTC)</th>
                  <th className="py-2 px-4 font-normal tracking-wider w-32">ACTOR ID</th>
                  <th className="py-2 px-4 font-normal tracking-wider w-48">ACTION</th>
                  <th className="py-2 px-4 font-normal tracking-wider w-40">TARGET / CASE ID</th>
                  <th className="py-2 px-4 font-normal tracking-wider">SOURCE IP / DEVICE</th>
                </tr>
              </thead>
              <tbody className="font-data-code text-data-code text-on-surface divide-y divide-outline-variant/30">
                {logs.map((log) => (
                  <tr 
                    key={log.id}
                    onClick={() => setSelectedLog(log.raw)}
                    className={`transition-colors cursor-pointer ${
                      log.isWarning ? 'bg-status-warning/5 hover:bg-surface-variant/30' : 
                      log.isHighlighted ? 'bg-surface-variant/10 hover:bg-surface-variant/30' : 
                      'hover:bg-surface-variant/30'
                    }`}
                  >
                    <td className="py-2 px-4 text-on-surface-variant">{log.timestamp}</td>
                    <td className={`py-2 px-4 ${log.isWarning ? 'text-status-warning' : 'text-primary'}`}>{log.actor}</td>
                    <td className={`py-2 px-4 ${log.isWarning ? 'text-status-warning flex items-center space-x-1' : log.isHighlighted ? 'text-data-node-person' : ''}`}>
                      {log.isWarning && <span className="material-symbols-outlined text-[16px]">warning</span>}
                      <span>{log.action}</span>
                    </td>
                    <td className="py-2 px-4 text-secondary">{log.target}</td>
                    <td className="py-2 px-4 text-on-surface-variant">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      
      {/* Right Inspector Pane */}
      <aside className="w-[400px] bg-surface-elevated flex flex-col border-l border-outline-variant shrink-0 relative z-20 hidden lg:flex">
        {/* Security Alerts Panel (Top half) */}
        <div className="h-1/2 flex flex-col border-b border-outline-variant">
          <header className="h-10 px-4 flex items-center bg-surface-container-high border-b border-outline-variant shrink-0">
            <span className="material-symbols-outlined text-status-warning mr-2 text-[18px]">security</span>
            <h3 className="font-label-caps text-label-caps text-on-surface">SECURITY ALERTS</h3>
          </header>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {/* Alert Card */}
            <div className="bg-surface-card border border-status-warning/30 rounded p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-status-warning"></div>
              <div className="flex justify-between items-start mb-1">
                <span className="font-label-caps text-label-caps text-status-warning">UNUSUAL ACCESS PATTERN</span>
                <span className="font-data-code text-[10px] text-on-surface-variant">08:22:11 UTC</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface mb-2">Cross-case query detected between <span className="text-secondary">2024-ALPHA-09</span> and restricted case <span className="text-status-critical">2023-OMEGA-12</span>.</p>
              <div className="flex justify-end space-x-2 mt-2">
                <button className="font-label-caps text-[10px] text-on-surface-variant hover:text-on-surface uppercase tracking-wider">Dismiss</button>
                <button className="font-label-caps text-[10px] text-status-warning hover:text-status-warning/80 uppercase tracking-wider border border-status-warning/50 rounded px-2 py-0.5">Investigate</button>
              </div>
            </div>
            
            {/* Alert Card (Critical) */}
            <div className="bg-surface-card border border-status-critical/30 rounded p-3 relative overflow-hidden shadow-[0_0_12px_rgba(255,61,0,0.1)]">
              <div className="absolute top-0 left-0 w-1 h-full bg-status-critical"></div>
              <div className="flex justify-between items-start mb-1">
                <span className="font-label-caps text-label-caps text-status-critical">FAILED AUTHENTICATION</span>
                <span className="font-data-code text-[10px] text-on-surface-variant">07:45:02 UTC</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface">5 consecutive failed login attempts for ID <span className="text-primary font-data-code">OP-0888-Y</span> from unverified IP.</p>
            </div>
          </div>
        </div>
        
        {/* Verbatim JSON Inspector (Bottom half) */}
        <div className="h-1/2 flex flex-col bg-surface-dim">
          <header className="h-10 px-4 flex items-center justify-between bg-surface-container-high border-b border-outline-variant shrink-0">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">data_object</span>
              <h3 className="font-label-caps text-label-caps text-on-surface">RAW EVENT DATA</h3>
            </div>
            <button className="text-on-surface-variant hover:text-primary transition-colors" title="Copy JSON">
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          </header>
          <div className="flex-1 overflow-auto p-4 relative group">
            <pre className="font-data-code text-data-code text-tertiary-fixed-dim whitespace-pre-wrap break-all" style={{tabSize: 4}}>
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AuditLogs;
