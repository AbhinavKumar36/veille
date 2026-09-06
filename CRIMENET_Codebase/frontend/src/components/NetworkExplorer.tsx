import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export interface GraphNode {
  id: string;
  name: string;
  alias: string;
  type: 'PERSON' | 'ORG' | 'COMMS' | 'FINANCIAL' | 'LOCATION';
  role: string;
  riskScore: number;
  confidence: number;
  color: string;
  borderClass: string;
  textClass: string;
  icon: string;
  coords: { x: string; y: string };
  pagerank: number;
  betweenness: number;
  degree: number;
  community: string;
  evidenceId: string;
  details: string;
  associates: Array<{
    id: string;
    name: string;
    type: string;
    strength: string;
    meta: string;
    color: string;
  }>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
}

export const NetworkExplorer: React.FC = () => {
  const navigate = useNavigate();

  const [cases, setCases] = useState<Array<{ id: string; title: string; case_number: string }>>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter toolbar states
  const [entityFilters, setEntityFilters] = useState({
    PERSONS: true,
    ORGS: true,
    LOCATIONS: true,
    COMMS: true,
    FINANCIAL: true
  });

  const [minConfidence, setMinConfidence] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<'CANVAS' | 'CENTRALITY_MATRIX'>('CANVAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Cases
  useEffect(() => {
    api.get('/cases')
      .then((data: any) => {
        const caseList = Array.isArray(data) ? data : (data?.cases || []);
        setCases(caseList);
        if (caseList.length > 0) {
          setSelectedCaseId(caseList[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load cases:', err);
        setLoading(false);
      });
  }, []);

  // Fetch Graph for selected case
  useEffect(() => {
    if (!selectedCaseId) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get(`/graph/${selectedCaseId}`)
      .then((data: any) => {
        const rawNodes = data.nodes || [];
        const rawEdges = data.edges || [];

        const formattedNodes: GraphNode[] = rawNodes.map((n: any, idx: number) => {
          const typeUpper = (n.type || n.label || 'PERSON').toUpperCase();
          const angle = (idx / (rawNodes.length || 1)) * 2 * Math.PI;
          const radiusX = 35;
          const radiusY = 32;
          const posX = 50 + radiusX * Math.cos(angle);
          const posY = 50 + radiusY * Math.sin(angle);

          return {
            id: n.id || `node-${idx}`,
            name: n.name || n.properties?.name || `Entity #${idx + 1}`,
            alias: n.properties?.alias || typeUpper,
            type: (['PERSON', 'ORG', 'COMMS', 'FINANCIAL', 'LOCATION'].includes(typeUpper)
              ? typeUpper
              : 'PERSON') as any,
            role: n.properties?.role || 'Identified Node in Network',
            riskScore: n.properties?.risk_score || 75,
            confidence: Math.round((n.properties?.confidence || 0.9) * 100),
            color: typeUpper === 'PERSON' ? '#F43F5E' : typeUpper === 'ORG' ? '#38BDF8' : typeUpper === 'LOCATION' ? '#4EDEA3' : '#F59E0B',
            borderClass: typeUpper === 'PERSON' ? 'border-error' : typeUpper === 'ORG' ? 'border-primary' : typeUpper === 'LOCATION' ? 'border-secondary' : 'border-amber-400',
            textClass: typeUpper === 'PERSON' ? 'text-error' : typeUpper === 'ORG' ? 'text-primary' : typeUpper === 'LOCATION' ? 'text-secondary' : 'text-amber-400',
            icon: typeUpper === 'PERSON' ? 'person' : typeUpper === 'ORG' ? 'corporate_fare' : typeUpper === 'LOCATION' ? 'location_on' : 'cell_tower',
            coords: { x: `${posX.toFixed(1)}%`, y: `${posY.toFixed(1)}%` },
            pagerank: n.properties?.pagerank || 0.05,
            betweenness: n.properties?.betweenness || 0.35,
            degree: n.properties?.degree || 4,
            community: n.properties?.community || 'CLUSTER_01',
            evidenceId: n.properties?.source_evidence_id || `ENT-${1000 + idx}`,
            details: n.properties?.details || 'Extracted via NLP pipeline from seized evidence.',
            associates: []
          };
        });

        setNodes(formattedNodes);
        setEdges(rawEdges);
        if (formattedNodes.length > 0) {
          setSelectedNodeId(formattedNodes[0].id);
        } else {
          setSelectedNodeId(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load case graph:', err);
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCaseId]);

  const currentNode = nodes.find(n => n.id === selectedNodeId) || nodes[0] || null;

  const handleToggleFilter = (key: keyof typeof entityFilters) => {
    setEntityFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportCypher = () => {
    if (!currentNode) return;
    const cypher = `MATCH (t {id: '${currentNode.id}'})-[r]-(n) RETURN t, r, n LIMIT 50;`;
    navigator.clipboard?.writeText(cypher);
    triggerToast(`NEO4J CYPHER COPIED: "${cypher}"`);
  };

  const isNodeVisible = (node: GraphNode) => {
    if (node.type === 'PERSON' && !entityFilters.PERSONS) return false;
    if (node.type === 'ORG' && !entityFilters.ORGS) return false;
    if (node.type === 'LOCATION' && !entityFilters.LOCATIONS) return false;
    if (node.type === 'COMMS' && !entityFilters.COMMS) return false;
    if (node.type === 'FINANCIAL' && !entityFilters.FINANCIAL) return false;
    if (node.confidence < minConfidence) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        node.name.toLowerCase().includes(q) ||
        node.alias.toLowerCase().includes(q) ||
        node.evidenceId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  };

  const visibleNodes = nodes.filter(isNodeVisible);

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] -m-4 lg:-m-8 bg-surface text-on-surface antialiased select-none overflow-hidden border-t border-outline-variant font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-primary/10 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">hub</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* ================= TOP OPERATIONAL SUB-BAR ================= */}
      <header className="flex justify-between items-center w-full px-4 h-10 border-b border-outline-variant bg-surface-container-lowest z-40 shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="text-xs font-mono font-semibold tracking-wider text-primary uppercase flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
            VEILLE // KNOWLEDGE GRAPH EXPLORER
          </span>
          <div className="h-4 w-px bg-outline-variant hidden sm:block" />
          
          {/* Case Selector Dropdown */}
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="text-outline">CASE FILE:</span>
            {cases.length > 0 ? (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-surface-container-low border border-outline-variant text-primary px-2 py-0.5 font-mono text-xs focus:outline-none"
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
        </div>

        {/* Central Search & Query */}
        <div className="flex items-center w-64 lg:w-80 h-7 bg-surface-container-lowest border border-outline-variant px-2 focus-within:border-primary">
          <span className="text-outline text-[10px] font-mono mr-1.5 shrink-0">QUERY://</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER ENTITY BY NAME OR UID..."
            className="bg-transparent border-none p-0 text-[11px] font-mono text-on-surface focus:ring-0 w-full placeholder:text-outline-variant outline-none"
          />
        </div>
      </header>

      {/* ================= FILTER TOOLBAR STRIP ================= */}
      <section className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-low gap-2 text-xs font-mono shrink-0">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="text-[10px] text-outline font-bold uppercase">ENTITY FILTERS:</span>
          {(['PERSONS', 'ORGS', 'LOCATIONS', 'COMMS', 'FINANCIAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleToggleFilter(cat)}
              className={`px-2 py-0.5 border text-[10px] font-bold transition-colors cursor-pointer ${
                entityFilters[cat]
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-outline-variant text-outline bg-surface-container-lowest'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-outline">NODES: <strong className="text-on-surface">{visibleNodes.length}</strong></span>
          <span className="text-outline">EDGES: <strong className="text-on-surface">{edges.length}</strong></span>
        </div>
      </section>

      {/* ================= MAIN SPLIT CANVAS / MATRIX ================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {/* Graph Canvas Theater (65%) */}
        <div className="w-full lg:w-[65%] border-r border-outline-variant flex flex-col bg-surface-container-lowest relative overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-outline font-mono text-xs">
              <span className="material-symbols-outlined text-3xl animate-spin mb-2 text-primary">progress_activity</span>
              <div>LOADING CASE KNOWLEDGE GRAPH FROM NEO4J...</div>
            </div>
          ) : visibleNodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline font-mono">
              <div className="w-14 h-14 rounded-full border border-outline-variant bg-surface-container-low flex items-center justify-center text-outline mb-3">
                <span className="material-symbols-outlined text-3xl">hub</span>
              </div>
              <div className="text-sm font-bold text-on-surface uppercase">KNOWLEDGE GRAPH IS EMPTY</div>
              <p className="text-xs text-outline mt-1.5 max-w-md">
                No entities or relationship edges have been extracted for this case file yet. Ingest raw FIR documents, wiretap audio, or CDR files to populate the graph.
              </p>
              <button
                onClick={() => navigate('/evidence-library')}
                className="mt-4 px-4 py-2 bg-primary text-surface-container-lowest text-xs font-mono font-bold hover:bg-primary-fixed-dim transition-colors cursor-pointer"
              >
                OPEN EVIDENCE VAULT
              </button>
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden bg-[#0a0e17]">
              {/* Tactical Grid Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #38BDF8 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Dynamic SVG Nodes and Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {edges.map((e, idx) => {
                  const srcNode = nodes.find(n => n.id === e.source);
                  const tgtNode = nodes.find(n => n.id === e.target);
                  if (!srcNode || !tgtNode) return null;
                  return (
                    <line
                      key={idx}
                      x1={srcNode.coords.x}
                      y1={srcNode.coords.y}
                      x2={tgtNode.coords.x}
                      y2={tgtNode.coords.y}
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="opacity-40"
                    />
                  );
                })}
              </svg>

              {/* Node Badges */}
              {visibleNodes.map((n) => {
                const isSelected = selectedNodeId === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    style={{ left: n.coords.x, top: n.coords.y }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-sm border cursor-pointer transition-all duration-200 shadow-lg ${
                      isSelected
                        ? 'border-primary bg-primary/20 scale-110 ring-2 ring-primary/50'
                        : 'border-outline-variant bg-surface-container hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: n.color }}>
                        {n.icon}
                      </span>
                      <span className="font-bold text-on-surface">{n.name}</span>
                    </div>
                    <div className="text-[9px] font-mono text-outline">{n.alias}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Inspector Drawer (35%) */}
        <div className="w-full lg:w-[35%] flex flex-col bg-surface-container-low overflow-y-auto p-4 font-mono text-xs">
          {currentNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                <div>
                  <div className="text-primary font-bold text-sm">{currentNode.name}</div>
                  <div className="text-outline text-[11px]">{currentNode.alias}</div>
                </div>
                <span className={`px-2 py-0.5 border text-[10px] font-bold ${currentNode.borderClass} ${currentNode.textClass}`}>
                  {currentNode.type}
                </span>
              </div>

              <div className="p-3 bg-surface-container-lowest border border-outline-variant space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">RISK SCORE:</span>
                  <span className="text-error font-bold">{currentNode.riskScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">CONFIDENCE:</span>
                  <span className="text-secondary font-bold">{currentNode.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">EVIDENCE SOURCE:</span>
                  <span className="text-primary font-bold">{currentNode.evidenceId}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-outline">INVESTIGATIVE NOTES</div>
                <div className="p-3 bg-surface-container-lowest border border-outline-variant text-[11px] leading-relaxed text-on-surface-variant">
                  {currentNode.details}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportCypher}
                  className="w-full py-2 bg-surface-container-high border border-outline-variant hover:border-primary text-on-surface font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">terminal</span>
                  <span>EXPORT CYPHER QUERY</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl mb-2">find_in_page</span>
              <div>Select a graph node to inspect intelligence telemetry.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkExplorer;
