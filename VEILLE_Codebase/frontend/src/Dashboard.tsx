import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api/client';
import NewInvestigationModal from './components/NewInvestigationModal';

interface TargetItem {
  id: string;
  name: string;
  classification: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'TRACKED' | 'COLD';
  threatClass: string;
  dotColor: string;
  knownAssociates: string;
  lastIntercept: string;
  caseId: string;
}

interface ActionTask {
  id: string;
  type: string;
  typeColor: string;
  timeLeft: string;
  description: string;
  actionLabel: string;
  status: 'PENDING' | 'AUTHORIZED' | 'DISMISSED';
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [caseStats, setCaseStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [targetFilter, setTargetFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'TRACKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = () => {
    setLoading(true);
    api.get('/cases')
      .then((data) => {
        const caseList = Array.isArray(data) ? data : [];
        setCases(caseList);
        caseList.forEach((c) => {
          api.get(`/cases/${c.id}/stats`)
            .then((stats) => setCaseStats((prev) => ({ ...prev, [c.id]: stats })))
            .catch(() => setCaseStats((prev) => ({ ...prev, [c.id]: { node_count: 0, edge_count: 0, evidence_count: 0 } })));
        });
      })
      .catch((err) => {
        console.error("Failed to load cases:", err);
        setCases([]);
      })
      .finally(() => setLoading(false));

    api.get('/review-queue')
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.items || []);
        setReviewTasks(items);
      })
      .catch(() => setReviewTasks([]));
  };

  useEffect(() => {
    fetchDashboardData();

    const handleCaseCreatedEvent = () => {
      fetchDashboardData();
    };

    window.addEventListener('case-created', handleCaseCreatedEvent);
    return () => window.removeEventListener('case-created', handleCaseCreatedEvent);
  }, []);

  const targets: TargetItem[] = cases.map((c) => {
    const p = c.priority || 'MEDIUM';
    const threatLevel: TargetItem['threatLevel'] =
      p === 'CRITICAL' ? 'CRITICAL' : p === 'HIGH' ? 'HIGH' : c.status === 'COLD' ? 'COLD' : 'TRACKED';
    const threatClass =
      threatLevel === 'CRITICAL'
        ? 'border-error text-error bg-error/10'
        : threatLevel === 'HIGH'
        ? 'border-amber-400 text-amber-400 bg-amber-400/10'
        : threatLevel === 'COLD'
        ? 'border-outline text-outline bg-surface-container-high'
        : 'border-primary text-primary bg-primary/10';
    const dotColor =
      threatLevel === 'CRITICAL'
        ? 'bg-error'
        : threatLevel === 'HIGH'
        ? 'bg-amber-400'
        : threatLevel === 'COLD'
        ? 'bg-outline'
        : 'bg-primary';

    const stats = caseStats[c.id] || { node_count: 0, edge_count: 0, evidence_count: 0 };

    return {
      id: `CASE-${c.id.slice(0, 8)}`,
      name: c.title,
      classification: `Case // ${c.status || 'ACTIVE'} Priority: ${c.priority || 'MEDIUM'}`,
      threatLevel,
      threatClass,
      dotColor,
      knownAssociates: `${stats.node_count} Nodes / ${stats.edge_count} Edges`,
      lastIntercept: stats.evidence_count > 0 ? `${stats.evidence_count} Evidence Blobs` : 'No Evidence Ingested',
      caseId: c.id
    };
  });

  const tasks: ActionTask[] = reviewTasks.map((t, idx) => ({
    id: t.id || `task-${idx}`,
    type: `ENTITY COLLISION: ${t.source_entity_name || 'IDENT_NODE'}`,
    typeColor: (t.confidence_score || 0) > 0.9 ? 'text-error' : 'text-amber-400',
    timeLeft: `${Math.round((t.confidence_score || 0.8) * 100)}% MATCH`,
    description: `Resolve match with '${t.target_entity_name || 'TARGET_NODE'}' in Case ${t.case_id?.slice(0, 8) || 'N/A'}.`,
    actionLabel: 'MERGE ENTITY',
    status: 'PENDING'
  }));

  const handleTaskAction = async (taskId: string, actionType: 'AUTHORIZE' | 'DISMISS') => {
    try {
      if (actionType === 'AUTHORIZE') {
        await api.post('/review-queue/merge', { task_id: taskId });
        setActionNotice(`DISPATCH EXECUTED: Task ${taskId} merged into knowledge graph.`);
      } else {
        await api.post('/review-queue/reject', { task_id: taskId });
        setActionNotice(`ACTION DISMISSED: Task ${taskId} rejected from review queue.`);
      }
      setReviewTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      setActionNotice(`Action failed: ${err.message}`);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredTargets = targets.filter(t => {
    if (targetFilter !== 'ALL' && t.threatLevel !== targetFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.classification.toLowerCase().includes(q);
    }
    return true;
  });

  const criticalCases = cases.filter(c => c.priority === 'CRITICAL').length;
  const highCases = cases.filter(c => c.priority === 'HIGH').length;
  const totalNodes = Object.values(caseStats).reduce((acc: number, curr: any) => acc + (curr.node_count || 0), 0);

  return (
    <div className="space-y-4 pb-12 antialiased select-none font-sans">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span className="font-bold">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-outline hover:text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-outline-variant pb-3 bg-surface-container-lowest p-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-xs text-primary mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-bold uppercase tracking-wider">COMMAND CENTER</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-on-surface uppercase">
            Operations &amp; Multi-Source Fusion Matrix
          </h1>
        </div>

        <div className="flex items-center space-x-2.5 self-start lg:self-center shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-surface-container-lowest hover:bg-primary-fixed-dim px-3.5 py-2 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ NEW INVESTIGATION</span>
          </button>
          <button
            onClick={() => navigate('/communications-intercept')}
            className="border border-outline-variant bg-surface-container-high hover:bg-surface-container-highest px-3.5 py-2 text-xs font-mono font-bold text-on-surface hover:text-primary flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">broadcast_on_personal</span>
            <span>PIPELINE TELEMETRY</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="border border-outline-variant bg-surface-container-low p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-on-surface-variant">TOTAL ACTIVE CASES</span>
          <div className="text-2xl font-mono text-primary font-bold my-2">{cases.length}</div>
          <div className="pt-2 border-t border-outline-variant text-[11px] font-mono text-secondary">
            PostgreSQL System of Record
          </div>
        </div>

        <div className="border border-outline-variant bg-surface-container-low p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-on-surface-variant">CRITICAL / HIGH THREATS</span>
          <div className="text-2xl font-mono text-error font-bold my-2">{criticalCases + highCases}</div>
          <div className="pt-2 border-t border-outline-variant text-[11px] font-mono text-on-surface-variant">
            {criticalCases} Critical / {highCases} High
          </div>
        </div>

        <div className="border border-outline-variant bg-surface-container-low p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-on-surface-variant">NEO4J GRAPH ENTITIES</span>
          <div className="text-2xl font-mono text-secondary font-bold my-2">{totalNodes}</div>
          <div className="pt-2 border-t border-outline-variant text-[11px] font-mono text-secondary">
            Knowledge Graph Synced
          </div>
        </div>

        <div className="border border-outline-variant bg-surface-container-low p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-on-surface-variant">PENDING REVIEW TASKS</span>
          <div className="text-2xl font-mono text-amber-400 font-bold my-2">{reviewTasks.length}</div>
          <div className="pt-2 border-t border-outline-variant text-[11px] font-mono text-outline">
            Entity Resolution Collision
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Case Watchlist Table (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-outline-variant bg-surface-container-low overflow-hidden">
            <div className="h-9 bg-surface-container px-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center space-x-2 font-mono text-xs font-bold text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">folder</span>
                <span>ACTIVE CASE DOSSIERS</span>
              </div>
              <div className="flex items-center space-x-1 bg-surface-container-lowest p-0.5 border border-outline-variant text-[10px] font-mono">
                {(['ALL', 'CRITICAL', 'HIGH', 'TRACKED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTargetFilter(f)}
                    className={`px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                      targetFilter === f ? 'bg-primary text-surface-container-lowest' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-surface-container-lowest font-mono text-xs text-outline">
                <span className="material-symbols-outlined text-2xl animate-spin mb-1 text-primary">progress_activity</span>
                <div>LOADING CASE DOSSIERS...</div>
              </div>
            ) : filteredTargets.length === 0 ? (
              <div className="p-10 text-center bg-surface-container-lowest font-mono flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-outline text-3xl mb-2">folder_off</span>
                <div className="text-xs font-bold text-on-surface uppercase">NO ACTIVE CASES IN WATCHLIST</div>
                <p className="text-[11px] text-outline mt-1 max-w-sm">
                  Click "+ NEW INVESTIGATION" to create an operational case file and begin evidence extraction.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-primary text-surface-container-lowest font-mono text-xs font-bold hover:bg-primary-fixed-dim transition-colors cursor-pointer"
                >
                  + CREATE FIRST CASE
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant text-[10px] text-outline h-7">
                      <th className="px-4 font-semibold">CASE TITLE</th>
                      <th className="px-4 font-semibold">PRIORITY</th>
                      <th className="px-4 font-semibold">GRAPH TOPOLOGY</th>
                      <th className="px-4 font-semibold">EVIDENCE</th>
                      <th className="px-4 text-right font-semibold">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {filteredTargets.map((target) => (
                      <tr
                        key={target.id}
                        className="bg-surface-container-low hover:bg-surface-container-high transition-colors group cursor-pointer"
                        onClick={() => navigate('/network-explorer', { state: { caseId: target.caseId } })}
                      >
                        <td className="px-4 py-2.5 font-bold text-on-surface group-hover:text-primary transition-colors flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${target.dotColor}`} />
                          <span>{target.name}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`border text-[9px] px-1.5 py-0.5 font-bold ${target.threatClass}`}>
                            {target.threatLevel}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-on-surface-variant">{target.knownAssociates}</td>
                        <td className="px-4 py-2.5 text-outline text-[11px]">{target.lastIntercept}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/network-explorer', { state: { caseId: target.caseId } });
                            }}
                            className="border border-outline-variant hover:border-primary text-primary px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            EXPLORE GRAPH
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Operational Action Tasks (1/3) */}
        <div className="space-y-4 font-mono text-xs">
          <div className="border border-outline-variant bg-surface-container-low overflow-hidden">
            <div className="h-9 bg-surface-container px-4 border-b border-outline-variant flex items-center justify-between">
              <span className="font-bold uppercase text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-400">rule</span>
                CRITICAL ACTION QUEUE
              </span>
              <span className="text-[10px] text-outline font-bold">{tasks.length} PENDING</span>
            </div>

            <div className="p-3 space-y-2.5 bg-surface-container-lowest">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-outline">
                  <span className="material-symbols-outlined text-2xl mb-1 text-secondary">check_circle</span>
                  <div className="font-bold text-on-surface">ALL TASKS RESOLVED</div>
                  <p className="text-[11px] mt-1 text-outline">No pending entity resolution conflicts.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-surface-container-low border border-outline-variant space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-[11px] ${task.typeColor}`}>{task.type}</span>
                      <span className="text-[10px] text-outline font-bold">{task.timeLeft}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{task.description}</p>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => handleTaskAction(task.id, 'DISMISS')}
                        className="px-2 py-1 text-[10px] border border-outline-variant hover:border-error text-outline hover:text-error transition-colors cursor-pointer"
                      >
                        REJECT
                      </button>
                      <button
                        onClick={() => handleTaskAction(task.id, 'AUTHORIZE')}
                        className="px-2.5 py-1 text-[10px] bg-primary text-surface-container-lowest font-bold hover:bg-primary-fixed-dim transition-colors cursor-pointer"
                      >
                        {task.actionLabel}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Investigation Modal */}
      <NewInvestigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCaseCreated={() => fetchDashboardData()}
      />
    </div>
  );
};

export default Dashboard;
