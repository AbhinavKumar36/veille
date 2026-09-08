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

  // Investigator dynamic notes & hypothesis (starts clean, persists per case)
  const [investigatorNotes, setInvestigatorNotes] = useState<string>(() => {
    return localStorage.getItem('veille_investigator_notes') || '';
  });

  // Dynamic timeline milestones (starts empty, editable)
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    try {
      const saved = localStorage.getItem('veille_case_milestones');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persons of Interest list (starts empty, editable)
  const [suspects, setSuspects] = useState<SuspectProfile[]>(() => {
    try {
      const saved = localStorage.getItem('veille_case_suspects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Action Items / Tasks list (starts empty, editable)
  const [tasks, setTasks] = useState<CaseTask[]>(() => {
    try {
      const saved = localStorage.getItem('veille_case_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Modals for adding suspect and milestone
  const [isSuspectModalOpen, setIsSuspectModalOpen] = useState(false);
  const [newSuspect, setNewSuspect] = useState<Partial<SuspectProfile>>({
    name: '',
    role: '',
    threatLevel: 'HIGH',
    status: 'PERSON_OF_INTEREST',
    phone: '',
    location: '',
    notes: ''
  });

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '',
    description: '',
    category: 'INTELLIGENCE',
    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
  });

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
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem('veille_case_tasks', JSON.stringify(updated));
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem('veille_case_tasks', JSON.stringify(updated));
    triggerToast('Action item removed.');
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
      priority: newTaskPriority
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem('veille_case_tasks', JSON.stringify(updated));
    setNewTaskTitle('');
    triggerToast('Action item added to investigation queue.');
  };

  const handleAddSuspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuspect.name?.trim()) return;
    const suspect: SuspectProfile = {
      id: `s-${Date.now()}`,
      name: newSuspect.name.trim(),
      role: newSuspect.role || 'Person of Interest',
      threatLevel: newSuspect.threatLevel || 'MEDIUM',
      status: newSuspect.status || 'PERSON_OF_INTEREST',
      phone: newSuspect.phone || 'N/A',
      location: newSuspect.location || 'Unknown',
      lastSeen: new Date().toISOString().slice(0, 16).replace('T', ' '),
      notes: newSuspect.notes || ''
    };
    const updated = [suspect, ...suspects];
    setSuspects(updated);
    localStorage.setItem('veille_case_suspects', JSON.stringify(updated));
    setIsSuspectModalOpen(false);
    setNewSuspect({ name: '', role: '', threatLevel: 'HIGH', status: 'PERSON_OF_INTEREST', phone: '', location: '', notes: '' });
    triggerToast(`Person of Interest added: ${suspect.name}`);
  };

  const handleDeleteSuspect = (suspectId: string) => {
    const updated = suspects.filter(s => s.id !== suspectId);
    setSuspects(updated);
    localStorage.setItem('veille_case_suspects', JSON.stringify(updated));
    triggerToast('Person of Interest removed.');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title?.trim()) return;
    const milestone: Milestone = {
      id: `m-${Date.now()}`,
      timestamp: newMilestone.timestamp || new Date().toISOString().slice(0, 16).replace('T', ' '),
      title: newMilestone.title.trim(),
      description: newMilestone.description || '',
      category: newMilestone.category || 'INTELLIGENCE'
    };
    const updated = [milestone, ...milestones];
    setMilestones(updated);
    localStorage.setItem('veille_case_milestones', JSON.stringify(updated));
    setIsMilestoneModalOpen(false);
    setNewMilestone({ title: '', description: '', category: 'INTELLIGENCE', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    triggerToast('Chronology event recorded.');
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    const updated = milestones.filter(m => m.id !== milestoneId);
    setMilestones(updated);
    localStorage.setItem('veille_case_milestones', JSON.stringify(updated));
    triggerToast('Chronology event removed.');
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
          <div className="space-y-6 max-w-6xl mx-auto font-mono">
            {!activeCase ? (
              <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant rounded flex flex-col items-center justify-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline">folder_off</span>
                <div className="text-sm font-bold text-on-surface uppercase">NO ACTIVE INVESTIGATION FILE</div>
                <p className="text-xs text-outline max-w-md">
                  No cases are currently open in the PostgreSQL system of record. Initialize an investigation to start logging dossiers.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-2 px-4 py-2 bg-primary text-surface-container-lowest font-bold text-xs hover:bg-primary-fixed-dim transition-colors rounded cursor-pointer"
                >
                  GO TO COMMAND CENTER
                </button>
              </div>
            ) : (
              <>
                {/* Top Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded">
                    <div className="text-outline text-[10px] uppercase font-bold">CASE CLASSIFICATION</div>
                    <div className="text-xl font-bold text-primary mt-1">{activeCase.priority || 'MEDIUM'} PRIORITY</div>
                    <div className="text-[10px] text-outline mt-0.5">{activeCase.case_number}</div>
                  </div>
                  <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded">
                    <div className="text-outline text-[10px] uppercase font-bold">OPERATIONAL STATUS</div>
                    <div className="text-xl font-bold text-secondary mt-1">{activeCase.status || 'ACTIVE'}</div>
                    <div className="text-[10px] text-outline mt-0.5">PostgreSQL System of Record</div>
                  </div>
                  <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded">
                    <div className="text-outline text-[10px] uppercase font-bold">TRACKED SUSPECTS</div>
                    <div className="text-xl font-bold text-on-surface mt-1">{suspects.length} Targets</div>
                    <div className="text-[10px] text-outline mt-0.5">Active Persons of Interest</div>
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
                      <div className="px-2 py-1 bg-primary/10 border border-primary/40 text-primary text-xs font-bold rounded">
                        {activeCase.case_number}
                      </div>
                      <h2 className="text-base font-bold text-on-surface font-sans">
                        {activeCase.title}
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/30 text-[10px] font-bold uppercase rounded">
                      {activeCase.status}
                    </span>
                  </div>

                  <div className="text-xs leading-relaxed text-on-surface-variant space-y-2">
                    <p>
                      <strong>Case Description:</strong> {activeCase.description || 'No detailed briefing description attached yet.'}
                    </p>
                    {activeCase.created_at && (
                      <p className="text-[11px] text-outline">
                        <strong>Opened:</strong> {new Date(activeCase.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Quick Launchers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={() => navigate('/communications-intercept')}
                      className="p-3 bg-surface-container-low border border-outline-variant hover:border-primary rounded flex items-center justify-between text-xs text-left cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-on-surface">Comms Intercept</div>
                        <div className="text-[10px] text-outline">CDR &amp; wiretap telemetry</div>
                      </div>
                      <span className="material-symbols-outlined text-primary">phone_in_talk</span>
                    </button>

                    <button
                      onClick={() => navigate('/geospatial-explorer')}
                      className="p-3 bg-surface-container-low border border-outline-variant hover:border-primary rounded flex items-center justify-between text-xs text-left cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-on-surface">Geospatial Radar</div>
                        <div className="text-[10px] text-outline">Cell tower &amp; sighting map</div>
                      </div>
                      <span className="material-symbols-outlined text-primary">pin_drop</span>
                    </button>

                    <button
                      onClick={() => navigate('/ai-assistant')}
                      className="p-3 bg-surface-container-low border border-outline-variant hover:border-primary rounded flex items-center justify-between text-xs text-left cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-on-surface">AI Synthesis</div>
                        <div className="text-[10px] text-outline">Query Gemini GraphRAG</div>
                      </div>
                      <span className="material-symbols-outlined text-primary">smart_toy</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'SUSPECTS' ? (
          /* ================= 2. SUSPECTS / POI TAB ================= */
          <div className="space-y-4 max-w-6xl mx-auto font-mono">
            <div className="flex items-center justify-between">
              <div className="text-xs text-outline">
                PRIMARY PERSONS OF INTEREST &amp; OPERATIVES ({suspects.length})
              </div>
              <button
                onClick={() => setIsSuspectModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-surface-container-lowest font-bold text-xs hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 cursor-pointer rounded"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>+ ADD PERSON OF INTEREST</span>
              </button>
            </div>

            {suspects.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant rounded flex flex-col items-center justify-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-outline">person_search</span>
                <div className="text-xs font-bold text-on-surface uppercase">NO PERSONS OF INTEREST RECORDED</div>
                <p className="text-[11px] text-outline max-w-sm">
                  Click "+ ADD PERSON OF INTEREST" to register suspects, affiliates, and tracked actors for this investigation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suspects.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 bg-surface-container-lowest border border-outline-variant hover:border-primary/60 rounded flex flex-col justify-between text-xs space-y-3 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-on-surface">{s.name}</div>
                          <div className="text-[11px] text-outline mt-0.5">{s.role}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                          <button
                            onClick={() => handleDeleteSuspect(s.id)}
                            className="text-outline hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                            title="Remove Person of Interest"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-surface-container-low border border-outline-variant/60 rounded space-y-1 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-outline">STATUS:</span>
                          <span className="text-secondary font-bold">{s.status?.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">PHONE / SIP:</span>
                          <span className="text-on-surface">{s.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">LOCATION:</span>
                          <span className="text-on-surface truncate max-w-[140px]">{s.location || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">LAST RECORD:</span>
                          <span className="text-primary">{s.lastSeen || 'Recently'}</span>
                        </div>
                      </div>

                      {s.notes && (
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          {s.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'TIMELINE' ? (
          /* ================= 3. CHRONOLOGY TIMELINE TAB ================= */
          <div className="space-y-4 max-w-4xl mx-auto font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="text-xs text-outline">
                FORENSIC INCIDENT &amp; INTELLIGENCE MILESTONE CHRONOLOGY ({milestones.length})
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-surface-container-lowest font-bold text-xs hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 cursor-pointer rounded"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>+ ADD EVENT / MILESTONE</span>
              </button>
            </div>

            {milestones.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant rounded flex flex-col items-center justify-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-outline">timeline</span>
                <div className="text-xs font-bold text-on-surface uppercase">NO CHRONOLOGY EVENTS RECORDED</div>
                <p className="text-[11px] text-outline max-w-sm">
                  Click "+ ADD EVENT / MILESTONE" to log electronic warrant filings, wiretap intercepts, and forensic actions.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-outline-variant ml-4 pl-6 space-y-6">
                {milestones.map((m) => (
                  <div key={m.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface-container-lowest shadow-[0_0_8px_rgba(0,229,255,0.4)]" />

                    <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded space-y-1.5 group-hover:border-primary/60 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">{m.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-outline">{m.timestamp}</span>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="text-outline hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                            title="Delete Milestone"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
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
            )}
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
                className="flex-1 bg-surface-container-lowest border border-outline-variant px-3 py-2 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary rounded"
              />
              <select
                value={newTaskPriority}
                onChange={(e: any) => setNewTaskPriority(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant px-2.5 py-2 text-xs text-primary focus:outline-none focus:border-primary rounded"
              >
                <option value="HIGH">HIGH PRIORITY</option>
                <option value="MEDIUM">MEDIUM PRIORITY</option>
                <option value="LOW">LOW PRIORITY</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-surface-container-lowest font-bold text-xs hover:bg-primary-fixed-dim transition-colors cursor-pointer rounded shrink-0"
              >
                + ADD ACTION ITEM
              </button>
            </form>

            {tasks.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant rounded flex flex-col items-center justify-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-secondary">checklist</span>
                <div className="text-xs font-bold text-on-surface uppercase">NO ACTION ITEMS IN QUEUE</div>
                <p className="text-[11px] text-outline max-w-sm">
                  Add operational leads, warrant deadlines, and forensic follow-ups above.
                </p>
              </div>
            ) : (
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
                        task.priority === 'HIGH' ? 'bg-red-500/15 text-red-400' : task.priority === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                      <button
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="text-outline hover:text-red-400 transition-colors p-0.5 cursor-pointer ml-1"
                        title="Delete Action Item"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Add Suspect Modal */}
      {isSuspectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 max-w-md w-full font-mono text-xs space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>REGISTER PERSON OF INTEREST</span>
              </span>
              <button onClick={() => setIsSuspectModalOpen(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSuspect} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">SUSPECT FULL NAME *</label>
                <input
                  type="text"
                  value={newSuspect.name}
                  onChange={(e) => setNewSuspect({ ...newSuspect, name: e.target.value })}
                  placeholder="e.g. Vikram Singhania"
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">OPERATIONAL ROLE</label>
                  <input
                    type="text"
                    value={newSuspect.role}
                    onChange={(e) => setNewSuspect({ ...newSuspect, role: e.target.value })}
                    placeholder="e.g. Courier / Director"
                    className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">THREAT LEVEL</label>
                  <select
                    value={newSuspect.threatLevel}
                    onChange={(e: any) => setNewSuspect({ ...newSuspect, threatLevel: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant px-2.5 py-1.5 rounded text-primary text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">PHONE / MSISDN</label>
                  <input
                    type="text"
                    value={newSuspect.phone}
                    onChange={(e) => setNewSuspect({ ...newSuspect, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">LOCATION FIX</label>
                  <input
                    type="text"
                    value={newSuspect.location}
                    onChange={(e) => setNewSuspect({ ...newSuspect, location: e.target.value })}
                    placeholder="e.g. Mumbai South"
                    className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">INVESTIGATIVE NOTES</label>
                <textarea
                  value={newSuspect.notes}
                  onChange={(e) => setNewSuspect({ ...newSuspect, notes: e.target.value })}
                  rows={3}
                  placeholder="Key observations, vehicles, known associates..."
                  className="w-full bg-surface-container-lowest border border-outline-variant p-2.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsSuspectModalOpen(false)}
                  className="px-3 py-1.5 border border-outline-variant text-outline hover:text-white rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold rounded hover:bg-primary-fixed-dim"
                >
                  SAVE PERSON OF INTEREST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 max-w-md w-full font-mono text-xs space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>RECORD CHRONOLOGY EVENT</span>
              </span>
              <button onClick={() => setIsMilestoneModalOpen(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">EVENT TITLE *</label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="e.g. Warrant Section 65B Executed"
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">CATEGORY</label>
                  <select
                    value={newMilestone.category}
                    onChange={(e: any) => setNewMilestone({ ...newMilestone, category: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant px-2.5 py-1.5 rounded text-primary text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="INTELLIGENCE">INTELLIGENCE</option>
                    <option value="EVIDENCE">EVIDENCE</option>
                    <option value="INTERCEPT">INTERCEPT</option>
                    <option value="WARRANT">WARRANT</option>
                    <option value="ARREST">ARREST</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">TIMESTAMP</label>
                  <input
                    type="text"
                    value={newMilestone.timestamp}
                    onChange={(e) => setNewMilestone({ ...newMilestone, timestamp: e.target.value })}
                    placeholder="YYYY-MM-DD HH:MM"
                    className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">EVENT DESCRIPTION</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  rows={3}
                  placeholder="Details of evidence seized, wiretap packet decrypted..."
                  className="w-full bg-surface-container-lowest border border-outline-variant p-2.5 rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-3 py-1.5 border border-outline-variant text-outline hover:text-white rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold rounded hover:bg-primary-fixed-dim"
                >
                  SAVE EVENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseWorkspace;
