import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  status: string;
  description?: string;
  created_at?: string;
  priority?: string;
}

interface SuspectProfile {
  id: string;
  name: string;
  role: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'AT_LARGE' | 'DETAINED' | 'UNDER_SURVEILLANCE' | 'PERSON_OF_INTEREST';
  phone?: string;
  location?: string;
  lastSeen?: string;
  notes?: string;
}

interface Milestone {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: 'EVIDENCE' | 'INTERCEPT' | 'ARREST' | 'WARRANT' | 'INTELLIGENCE';
}

interface CaseTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const CaseWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUSPECTS' | 'TIMELINE' | 'TASKS' | 'NOTES'>('OVERVIEW');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Investigator dynamic notes & hypothesis
  const [investigatorNotes, setInvestigatorNotes] = useState<string>(() => {
    return localStorage.getItem('veille_investigator_notes') || 
`[2026-09-07 09:30 UTC] Cross-referenced CDR telemetry with Hawala financial transfer #TRX-9941.
• Target subject communicated with intermediary node at 03:14 AM.
• Cell tower fix indicates physical presence within 1.2km radius of Bandra port.
• Action item: File supplementary section 65B electronic certificate for CDR ledger.`;
  });

  // Sample dynamic timeline milestones
  const [milestones] = useState<Milestone[]>([
    {
      id: 'm-1',
      timestamp: '2026-09-07 08:45',
      title: 'Wiretap Intercept Intercepted',
      description: 'GSM-PDU communication intercept recorded on Port 9092. Keywords matched Hawala transfer routing.',
      category: 'INTERCEPT'
    },
    {
      id: 'm-2',
      timestamp: '2026-09-06 19:12',
      title: 'Geospatial Signal Fix',
      description: 'Cell tower triangulation detected burner SIM card activation in Zone 4.',
      category: 'INTELLIGENCE'
    },
    {
      id: 'm-3',
      timestamp: '2026-09-05 14:30',
      title: 'Evidence Ingestion: Bank Account Ledger',
      description: '142 financial transactions ingested and cross-referenced with Neo4j entity graph.',
      category: 'EVIDENCE'
    },
    {
      id: 'm-4',
      timestamp: '2026-09-04 10:00',
      title: 'Initial Case Filing (FIR #0921/26)',
      description: 'Cyber forensics unit initiated active surveillance under judicial warrant #W-8821.',
      category: 'WARRANT'
    }
  ]);

  // Sample POI list
  const [suspects] = useState<SuspectProfile[]>([
    {
      id: 's-1',
      name: 'Vikram "Falcon" Singhania',
      role: 'Syndicate Logistics Coordinator',
      threatLevel: 'CRITICAL',
      status: 'AT_LARGE',
      phone: '+91 98201 44921',
      location: 'Mumbai Port Area / South Zone',
      lastSeen: '2026-09-07 03:14',
      notes: 'Primary custodian of encrypted burner handsets and international escrow channels.'
    },
    {
      id: 's-2',
      name: 'Devraj Kapoor',
      role: 'Shell Corporation Director',
      threatLevel: 'HIGH',
      status: 'UNDER_SURVEILLANCE',
      phone: '+91 98110 33819',
      location: 'Bandra West, Mumbai',
      lastSeen: '2026-09-06 18:22',
      notes: 'Authorized signatory for 4 shell entity bank accounts linked to Hawala routing.'
    },
    {
      id: 's-3',
      name: 'Ananya Sharma',
      role: 'Encrypted Comms Technical Operator',
      threatLevel: 'MEDIUM',
      status: 'PERSON_OF_INTEREST',
      phone: '+91 97654 22109',
      location: 'Andheri East Tech Park',
      lastSeen: '2026-09-05 11:05',
      notes: 'Discovered in SIP relay metadata headers as relay proxy maintainer.'
    }
  ]);

  // Tasks list
  const [tasks, setTasks] = useState<CaseTask[]>([
    {
      id: 't-1',
      title: 'Subpoena cell tower CDR logs for Bandra cell tower TWR-MUMBAI-01',
      assignee: 'Operator Vance',
      dueDate: '2026-09-08',
      completed: false,
      priority: 'HIGH'
    },
    {
      id: 't-2',
      title: 'Run AI entity resolution on newly seized invoice PDFs',
      assignee: 'Forensics Lead Miller',
      dueDate: '2026-09-07',
      completed: true,
      priority: 'MEDIUM'
    },
    {
      id: 't-3',
      title: 'Cross-examine bank account transaction ledger with P2P escrow routes',
      assignee: 'Operator Vance',
      dueDate: '2026-09-09',
      completed: false,
      priority: 'HIGH'
    },
    {
      id: 't-4',
      title: 'Generate Section 65B Electronic Evidence Notarized Certificate',
      assignee: 'Legal Officer Rao',
      dueDate: '2026-09-10',
      completed: false,
      priority: 'LOW'
    }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    api.get('/cases')
      .then((data: any) => {
        const caseList = Array.isArray(data) ? data : (data?.cases || []);
        setCases(caseList);
        if (caseList.length > 0) {
          setSelectedCaseId(caseList[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load cases:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0] || null;

  const handleSaveNotes = () => {
    localStorage.setItem('veille_investigator_notes', investigatorNotes);
    triggerToast('Investigative briefing notes saved to secure vault.');
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: CaseTask = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: 'Active Operator',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      completed: false,
      priority: 'HIGH'
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    triggerToast('Investigative task added.');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] -m-4 lg:-m-8 bg-surface text-on-surface antialiased select-none overflow-hidden font-sans border-t border-outline-variant">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Top Banner & Case Selector */}
      <header className="flex flex-wrap justify-between items-center px-4 py-2.5 border-b border-outline-variant bg-surface-container-lowest z-40 shrink-0 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">badge</span>
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-primary uppercase flex items-center gap-2">
              <span>VEILLE // INVESTIGATOR WORKSPACE</span>
              <span className="px-1.5 py-0.2 bg-secondary/10 text-secondary border border-secondary/30 rounded text-[9px]">
                ACTIVE BRIEFING
              </span>
            </div>
            <div className="text-[11px] text-outline font-mono">
              Lead Officer Case Management &amp; Syndicate Tracking Dossier
            </div>
          </div>
        </div>

        {/* Case Dropdown & Quick Actions */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-outline text-[11px]">CASE DOSSIER:</span>
            {cases.length > 0 ? (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-surface-container-low border border-outline-variant text-primary px-2.5 py-1 font-mono text-xs focus:outline-none focus:border-primary"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-outline italic">NO ACTIVE CASES</span>
            )}
          </div>

          <button
            onClick={() => navigate('/network-explorer')}
            className="px-3 py-1 bg-surface-container-high border border-outline-variant hover:border-primary text-primary transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-[14px]">hub</span>
            <span>OPEN GRAPH</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center px-4 border-b border-outline-variant bg-surface-container-low shrink-0 overflow-x-auto text-xs font-mono">
        {[
          { id: 'OVERVIEW', label: 'CASE OVERVIEW', icon: 'dashboard' },
          { id: 'SUSPECTS', label: `PERSONS OF INTEREST (${suspects.length})`, icon: 'person_search' },
          { id: 'TIMELINE', label: `CHRONOLOGY (${milestones.length})`, icon: 'timeline' },
          { id: 'TASKS', label: `ACTION ITEMS (${tasks.filter(t => !t.completed).length})`, icon: 'checklist' },
          { id: 'NOTES', label: 'INVESTIGATOR LOG', icon: 'edit_note' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-surface-container-lowest'
                : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-surface min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-outline font-mono text-xs">
            <span className="material-symbols-outlined text-3xl animate-spin text-primary mb-2">progress_activity</span>
            <span>LOADING INVESTIGATOR DOSSIER...</span>
          </div>
        ) : activeTab === 'OVERVIEW' ? (
          /* ================= 1. CASE OVERVIEW TAB ================= */
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded">
                <div className="text-outline text-[10px] uppercase font-bold">CASE CLASSIFICATION</div>
                <div className="text-xl font-bold text-primary mt-1">TOP SECRET // LE</div>
                <div className="text-[10px] text-outline mt-0.5">Judicial Warrant #W-8821</div>
              </div>
              <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded">
                <div className="text-outline text-[10px] uppercase font-bold">SYNDICATE THREAT LEVEL</div>
                <div className="text-xl font-bold text-error mt-1">CRITICAL (88/100)</div>
                <div className="text-[10px] text-outline mt-0.5">Multi-Jurisdiction Network</div>
              </div>
              <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded">
                <div className="text-outline text-[10px] uppercase font-bold">TRACKED SUSPECTS</div>
                <div className="text-xl font-bold text-on-surface mt-1">{suspects.length} Targets</div>
                <div className="text-[10px] text-secondary mt-0.5">1 At-Large, 1 Monitored</div>
              </div>
              <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded">
                <div className="text-outline text-[10px] uppercase font-bold">OPEN ACTION ITEMS</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{tasks.filter(t => !t.completed).length} Pending</div>
                <div className="text-[10px] text-outline mt-0.5">{tasks.filter(t => t.completed).length} Completed</div>
              </div>
            </div>

            {/* Case Summary Card */}
            <div className="p-5 bg-surface-container-lowest border border-outline-variant rounded space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1 bg-primary/10 border border-primary/40 text-primary font-mono text-xs font-bold rounded">
                    {activeCase?.case_number || 'CASE-2026-0921'}
                  </div>
                  <h2 className="text-base font-bold text-on-surface font-headline-sm">
                    {activeCase?.title || 'Operation Black Falcon: Transnational Hawala & Crypto Smuggling Syndicate'}
                  </h2>
                </div>
                <span className="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/30 text-[10px] font-mono font-bold uppercase rounded">
                  STATUS: ACTIVE SURVEILLANCE
                </span>
              </div>

              <div className="text-xs leading-relaxed text-on-surface-variant font-mono space-y-2">
                <p>
                  <strong>Executive Summary:</strong> Tactical investigation targeting a high-yield illicit fund movement network utilizing layered shell entities, encrypted VoIP relays, and hawala broker nodes across Mumbai, Dubai, and Singapore.
                </p>
                <p>
                  Forensic cross-matching of seized CDR logs, electronic bank ledgers, and wiretap transcripts has mapped 18 key entities and over 40 cross-entity financial/telecom edges in the Neo4j knowledge graph.
                </p>
              </div>

              {/* Quick Launchers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => navigate('/communications-intercept')}
                  className="p-3 bg-surface-container-low border border-outline-variant hover:border-primary rounded flex items-center justify-between text-xs font-mono text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-on-surface">Comms Intercept</div>
                    <div className="text-[10px] text-outline">Listen to wiretap audio</div>
                  </div>
                  <span className="material-symbols-outlined text-primary">phone_in_talk</span>
                </button>

                <button
                  onClick={() => navigate('/geospatial-explorer')}
                  className="p-3 bg-surface-container-low border border-outline-variant hover:border-primary rounded flex items-center justify-between text-xs font-mono text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-on-surface">Geospatial Fixes</div>
                    <div className="text-[10px] text-outline">Cell tower &amp; sighting map</div>
                  </div>
                  <span className="material-symbols-outlined text-primary">pin_drop</span>
                </button>

                <button
                  onClick={() => navigate('/ai-assistant')}
                  className="p-3 bg-surface-container-low border border-outline-variant hover:border-primary rounded flex items-center justify-between text-xs font-mono text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-on-surface">AI Synthesis</div>
                    <div className="text-[10px] text-outline">Query Gemini GraphRAG</div>
                  </div>
                  <span className="material-symbols-outlined text-primary">smart_toy</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'SUSPECTS' ? (
          /* ================= 2. SUSPECTS / POI TAB ================= */
          <div className="space-y-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-outline">
                PRIMARY PERSONS OF INTEREST &amp; SYNDICATE OPERATIVES
              </div>
              <button
                onClick={() => navigate('/network-explorer')}
                className="px-3 py-1 bg-primary text-surface-container-lowest font-mono text-xs font-bold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 cursor-pointer rounded"
              >
                <span className="material-symbols-outlined text-xs">schema</span>
                <span>VIEW IN RELATIONSHIP GRAPH</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suspects.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-surface-container-lowest border border-outline-variant hover:border-primary/60 rounded flex flex-col justify-between font-mono text-xs space-y-3 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-on-surface">{s.name}</div>
                        <div className="text-[11px] text-outline mt-0.5">{s.role}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                          s.threatLevel === 'CRITICAL'
                            ? 'bg-red-500/15 text-red-400 border-red-500/40'
                            : s.threatLevel === 'HIGH'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                        }`}
                      >
                        {s.threatLevel}
                      </span>
                    </div>

                    <div className="p-2.5 bg-surface-container-low border border-outline-variant/60 rounded space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-outline">STATUS:</span>
                        <span className="text-secondary font-bold">{s.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">PHONE / SIP:</span>
                        <span className="text-on-surface">{s.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">LOCATION:</span>
                        <span className="text-on-surface truncate max-w-[140px]">{s.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">LAST FIX:</span>
                        <span className="text-primary">{s.lastSeen}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {s.notes}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/40 flex items-center gap-2">
                    <button
                      onClick={() => navigate('/communications-intercept')}
                      className="flex-1 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary text-[11px] font-bold rounded text-center cursor-pointer transition-colors"
                    >
                      INTERCEPT COMMS
                    </button>
                    <button
                      onClick={() => navigate('/geospatial-explorer')}
                      className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-secondary text-[11px] font-bold rounded cursor-pointer transition-colors"
                      title="Track GPS Fix"
                    >
                      <span className="material-symbols-outlined text-sm">my_location</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'TIMELINE' ? (
          /* ================= 3. CHRONOLOGY TIMELINE TAB ================= */
          <div className="space-y-4 max-w-4xl mx-auto font-mono text-xs">
            <div className="text-xs text-outline mb-4">
              FORENSIC INCIDENT &amp; INTELLIGENCE MILESTONE CHRONOLOGY
            </div>

            <div className="relative border-l-2 border-outline-variant ml-4 pl-6 space-y-6">
              {milestones.map((m) => (
                <div key={m.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface-container-lowest shadow-[0_0_8px_rgba(0,229,255,0.4)]" />

                  <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded space-y-1.5 group-hover:border-primary/60 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">{m.title}</span>
                      <span className="text-[10px] text-outline">{m.timestamp}</span>
                    </div>
                    <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-surface-container border border-outline-variant text-secondary uppercase rounded">
                      {m.category}
                    </span>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
                      {m.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'TASKS' ? (
          /* ================= 4. ACTION ITEMS / TASKS TAB ================= */
          <div className="space-y-4 max-w-4xl mx-auto font-mono text-xs">
            {/* Add Task Bar */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter new investigative action item or lead to track..."
                className="flex-1 bg-surface-container-lowest border border-outline-variant px-3 py-2 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-surface-container-lowest font-bold text-xs hover:bg-primary-fixed-dim transition-colors cursor-pointer rounded"
              >
                ADD TASK
              </button>
            </form>

            <div className="bg-surface-container-lowest border border-outline-variant rounded divide-y divide-surface-container-high overflow-hidden">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    task.completed ? 'bg-surface-container/30 opacity-70' : 'hover:bg-surface-container-high/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      task.completed ? 'bg-secondary border-secondary text-surface-container-lowest' : 'border-outline'
                    }`}>
                      {task.completed && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </div>
                    <span className={`text-xs ${task.completed ? 'line-through text-outline' : 'text-on-surface font-bold'}`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[10px]">
                    <span className="text-outline font-mono">DUE: {task.dueDate}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      task.priority === 'HIGH' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================= 5. NOTES & HYPOTHESIS TAB ================= */
          <div className="space-y-4 max-w-4xl mx-auto font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-outline">TACTICAL INVESTIGATOR NOTE PAD (AUTO-ENCRYPTED)</span>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold text-xs hover:bg-primary-fixed-dim transition-colors cursor-pointer rounded flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">save</span>
                <span>SAVE BRIEFING</span>
              </button>
            </div>

            <textarea
              value={investigatorNotes}
              onChange={(e) => setInvestigatorNotes(e.target.value)}
              rows={16}
              className="w-full bg-surface-container-lowest border border-outline-variant p-4 font-mono text-xs text-on-surface leading-relaxed focus:outline-none focus:border-primary rounded"
              placeholder="Record forensic observations, witness interview takeaways, hypothesis notes..."
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default CaseWorkspace;
