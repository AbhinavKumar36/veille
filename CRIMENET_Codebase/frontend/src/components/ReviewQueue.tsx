import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TableSkeleton } from './skeletons/TableSkeleton';
import { ErrorState } from './ErrorState';

interface ReviewTask {
  id: string;
  case_id: string;
  source_entity_name: string;
  target_entity_name: string;
  confidence_score: number;
  status: 'PENDING' | 'MERGED' | 'REJECTED';
}

const ReviewQueue: React.FC = () => {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 4000);
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/review-queue');
      const list = Array.isArray(data) ? data : (data?.items || []);
      setTasks(list);
    } catch (err: any) {
      console.error("Failed to load review queue from backend:", err);
      setError(err?.message || "Failed to connect to Review Queue backend service.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (taskId: string, action: 'merge' | 'reject') => {
    try {
      await api.post(`/review-queue/${action}`, { task_id: taskId });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      triggerToast(`Task ${taskId} successfully ${action === 'merge' ? 'merged into knowledge graph' : 'rejected'}.`);
    } catch (err: any) {
      triggerToast(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] -m-4 lg:-m-8 bg-surface text-on-surface antialiased select-none overflow-hidden border-t border-outline-variant font-sans">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="bg-primary/10 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">rule</span>
            <span>{toastNotice}</span>
          </div>
          <button onClick={() => setToastNotice(null)} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex justify-between items-center w-full px-4 h-10 border-b border-outline-variant bg-surface-container-lowest z-40 shrink-0 font-mono">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold tracking-wider text-primary uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">rule</span>
            VEILLE // ENTITY DISAMBIGUATION REVIEW QUEUE
          </span>
          <span className="text-outline-variant">|</span>
          <span className="text-[10px] text-outline">PENDING CONFLICTS: {tasks.length}</span>
        </div>

        <button
          onClick={fetchQueue}
          className="px-2.5 py-1 bg-surface-container border border-outline-variant text-[10px] text-on-surface hover:text-primary hover:border-primary transition-colors flex items-center gap-1 cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined text-xs">refresh</span>
          <span>SYNC QUEUE</span>
        </button>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-surface">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} onRetry={fetchQueue} /></div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 border border-outline-variant bg-surface-container-lowest p-8 text-center font-mono">
            <div className="w-12 h-12 rounded-full border border-secondary/30 bg-secondary/10 flex items-center justify-center text-secondary mb-3">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">REVIEW QUEUE NOMINAL // ZERO PENDING CONFLICTS</h3>
            <p className="text-xs text-outline mt-1 max-w-md">
              All extracted entities from FIRs, CDR intercepts, and financial ledgers have been automatically resolved or verified. New entity collision alerts will populate here in real-time.
            </p>
          </div>
        ) : (
          <div className="border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-outline text-[10px] uppercase tracking-wider h-8">
                  <th className="px-3 py-2 font-semibold">CASE UID</th>
                  <th className="px-3 py-2 font-semibold">SOURCE ENTITY (INGESTED)</th>
                  <th className="px-3 py-2 font-semibold">TARGET ENTITY (KNOWLEDGE GRAPH)</th>
                  <th className="px-3 py-2 font-semibold text-center">CONFIDENCE MATCH</th>
                  <th className="px-3 py-2 font-semibold text-right">RESOLUTION DIRECTIVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-3 py-2.5 text-outline text-[11px]">{task.case_id}</td>
                    <td className="px-3 py-2.5 font-bold text-primary">{task.source_entity_name}</td>
                    <td className="px-3 py-2.5 font-bold text-on-surface">{task.target_entity_name}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400 text-amber-400 text-[10px] font-bold">
                        {(task.confidence_score * 100).toFixed(1)}% MATCH
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-2">
                      <button
                        onClick={() => handleAction(task.id, 'reject')}
                        className="px-2.5 py-1 text-[10px] text-error border border-error/40 hover:bg-error/10 transition-colors uppercase font-bold cursor-pointer"
                      >
                        REJECT
                      </button>
                      <button
                        onClick={() => handleAction(task.id, 'merge')}
                        className="px-2.5 py-1 text-[10px] text-surface-container-lowest bg-primary border border-primary hover:bg-primary-fixed-dim transition-colors uppercase font-bold cursor-pointer"
                      >
                        MERGE ENTITY
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
  );
};

export default ReviewQueue;
