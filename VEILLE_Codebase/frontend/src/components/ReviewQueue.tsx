import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TableSkeleton } from './skeletons/TableSkeleton';
import { ErrorState } from './ErrorState';

interface ReviewTask {
  id: string;
  review_id?: string;
  candidate_id?: string;
  case_id: string;
  source_entity_name: string;
  target_entity_name: string;
  candidate_label?: string;
  confidence_score: number;
  lexical_score?: number | null;
  structural_score?: number | null;
  status: 'PENDING' | 'MERGED' | 'REJECTED';
}

const ReviewQueue: React.FC = () => {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 4500);
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await api.get('/review-queue');
      const list = Array.isArray(data) ? data : (data?.items || []);
      const formatted: ReviewTask[] = list.map((item: any, idx: number) => {
        const uid = item.id || item.review_id || item.task_id || item.candidate_id || `task-${idx}`;
        return {
          id: uid,
          review_id: item.review_id || uid,
          candidate_id: item.candidate_id,
          case_id: item.case_id || 'GENERAL',
          source_entity_name: item.source_entity_name || item.candidate_name || 'Candidate Node',
          target_entity_name: item.target_entity_name || item.match_name || 'Existing Entity',
          candidate_label: item.candidate_label || item.label || 'Person',
          confidence_score: Number(item.confidence_score ?? item.total_confidence ?? 0.75),
          lexical_score: item.lexical_score ? Number(item.lexical_score) : null,
          structural_score: item.structural_score ? Number(item.structural_score) : null,
          status: item.status || 'PENDING',
        };
      });
      setTasks(formatted);
    } catch (err: any) {
      console.error('Failed to load review queue from backend:', err);
      setError(err?.message || 'Failed to connect to Review Queue backend service.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (task: ReviewTask, action: 'merge' | 'reject') => {
    setActionInProgress(task.id);
    try {
      await api.post(`/review-queue/${action}`, {
        review_id: task.review_id || task.id,
        task_id: task.id,
        candidate_id: task.candidate_id,
      });
      setTasks(prev => prev.filter(t => t.id !== task.id));
      triggerToast(
        action === 'merge'
          ? `Entity "${task.source_entity_name}" successfully MERGED into canonical record "${task.target_entity_name}".`
          : `Entity "${task.source_entity_name}" REJECTED — kept as separate distinct node.`
      );
    } catch (err: any) {
      triggerToast(`Resolution directive failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleGenerateSample = async () => {
    try {
      await api.post('/review-queue/generate-sample', {});
      triggerToast('Borderline entity collision conflict generated for testing.');
      fetchQueue();
    } catch (err: any) {
      triggerToast(`Failed to generate test conflict: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] -m-4 lg:-m-8 bg-surface text-on-surface antialiased select-none overflow-hidden border-t border-outline-variant font-sans">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
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
            ENTITY DISAMBIGUATION REVIEW QUEUE
          </span>
          <span className="text-outline-variant">|</span>
          <span className="text-[10px] text-outline">PENDING CONFLICTS: {tasks.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSample}
            className="px-2.5 py-1 bg-surface-container border border-primary/40 text-[10px] text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 cursor-pointer font-bold"
            title="Inject sample ambiguous match for testing"
          >
            <span className="material-symbols-outlined text-xs">add_circle</span>
            <span>SIMULATE CONFLICT</span>
          </button>

          <button
            onClick={fetchQueue}
            className="px-2.5 py-1 bg-surface-container border border-outline-variant text-[10px] text-on-surface hover:text-primary hover:border-primary transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-xs">refresh</span>
            <span>SYNC QUEUE</span>
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-surface">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} onRetry={fetchQueue} /></div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 border border-outline-variant bg-surface-container-lowest p-8 text-center font-mono">
            <div className="w-14 h-14 rounded-full border border-secondary/30 bg-secondary/10 flex items-center justify-center text-secondary mb-4">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">REVIEW QUEUE NOMINAL // ZERO PENDING CONFLICTS</h3>
            <p className="text-xs text-outline mt-2 max-w-lg leading-relaxed">
              All extracted entities from FIRs, CDR telecom intercepts, and financial ledgers have been automatically resolved or verified. New entity collision alerts will populate here in real-time.
            </p>
            <button
              onClick={handleGenerateSample}
              className="mt-5 px-3 py-1.5 bg-primary/15 border border-primary/50 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">science</span>
              <span>SIMULATE TEST DISAMBIGUATION CONFLICT</span>
            </button>
          </div>
        ) : (
          <div className="border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-outline text-[10px] uppercase tracking-wider h-9">
                  <th className="px-3 py-2 font-semibold">CASE REF</th>
                  <th className="px-3 py-2 font-semibold">TYPE</th>
                  <th className="px-3 py-2 font-semibold">INGESTED CANDIDATE</th>
                  <th className="px-3 py-2 font-semibold">GRAPH CANONICAL MATCH</th>
                  <th className="px-3 py-2 font-semibold text-center">CONFIDENCE METRICS</th>
                  <th className="px-3 py-2 font-semibold text-right">RESOLUTION DIRECTIVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {tasks.map((task, idx) => (
                  <tr key={task.id || `row-${idx}`} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-3 py-3 text-outline text-[11px] font-medium">{task.case_id}</td>
                    <td className="px-3 py-3">
                      <span className="px-1.5 py-0.5 bg-surface-container border border-outline-variant text-[10px] text-primary font-bold uppercase">
                        {task.candidate_label}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-primary">
                      {task.source_entity_name}
                      {task.candidate_id && (
                        <div className="text-[10px] font-normal text-outline">{task.candidate_id}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-bold text-on-surface">
                      {task.target_entity_name}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400 text-amber-400 text-[10px] font-bold">
                          {(task.confidence_score * 100).toFixed(1)}% MATCH
                        </span>
                        {task.lexical_score != null && task.structural_score != null && (
                          <div className="text-[9px] text-outline flex items-center gap-1.5">
                            <span>LEX: {(Number(task.lexical_score) * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>STRUCT: {(Number(task.structural_score) * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleAction(task, 'reject')}
                        disabled={actionInProgress === task.id}
                        className="px-2.5 py-1 text-[10px] text-error border border-error/40 hover:bg-error/10 disabled:opacity-50 transition-colors uppercase font-bold cursor-pointer"
                      >
                        REJECT (KEEP SEPARATE)
                      </button>
                      <button
                        onClick={() => handleAction(task, 'merge')}
                        disabled={actionInProgress === task.id}
                        className="px-2.5 py-1 text-[10px] text-surface-container-lowest bg-primary border border-primary hover:bg-primary-fixed-dim disabled:opacity-50 transition-colors uppercase font-bold cursor-pointer"
                      >
                        {actionInProgress === task.id ? 'MERGING...' : 'MERGE INTO GRAPH'}
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
