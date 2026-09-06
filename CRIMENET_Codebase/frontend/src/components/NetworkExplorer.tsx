import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { InvestigationCardNode, InvestigationNodeData } from './InvestigationCardNode';
import { api } from '../api/client';

export interface GraphNode {
  id: string;
  name: string;
  alias: string;
  type: string;
  role: string;
  riskScore: number;
  confidence: number;
  color: string;
  borderClass: string;
  textClass: string;
  icon: string;
  pagerank: number;
  betweenness: number;
  degree: number;
  community: string;
  evidenceId: string;
  details: string;
  rawProperties: Record<string, any>;
  associates: Array<{
    id: string;
    name: string;
    type: string;
    relation: string;
    confidence: string;
    details?: string;
  }>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
}

const nodeTypes = {
  investigationCard: InvestigationCardNode,
};

const calculateNodePositions = (rawNodes: any[]) => {
  const cols: Record<string, any[]> = {
    ORG: [],
    PERSON: [],
    VEHICLE: [],
    COMMS: [],
    FINANCIAL: [],
    LOCATION: [],
    EVENT: [],
    OTHER: []
  };

  rawNodes.forEach(n => {
    const props = n.properties || n.data?.properties || {};
    const typeUpper = (n.type || n.label || props.type || 'PERSON').toUpperCase();
    if (typeUpper.includes('PERSON') || typeUpper.includes('SUSPECT')) cols.PERSON.push(n);
    else if (typeUpper.includes('VEHICLE')) cols.VEHICLE.push(n);
    else if (typeUpper.includes('PHONE') || typeUpper.includes('COMM')) cols.COMMS.push(n);
    else if (typeUpper.includes('ACCOUNT') || typeUpper.includes('FINANC')) cols.FINANCIAL.push(n);
    else if (typeUpper.includes('LOCATION')) cols.LOCATION.push(n);
    else if (typeUpper.includes('ORG')) cols.ORG.push(n);
    else if (typeUpper.includes('EVENT')) cols.EVENT.push(n);
    else cols.OTHER.push(n);
  });

  const colOrder = ['ORG', 'PERSON', 'VEHICLE', 'COMMS', 'FINANCIAL', 'LOCATION', 'EVENT', 'OTHER'].filter(
    k => cols[k].length > 0
  );

  const positions: Record<string, { x: number; y: number }> = {};
  colOrder.forEach((cat, colIdx) => {
    cols[cat].forEach((node, rowIdx) => {
      positions[node.id] = {
        x: colIdx * 350 + 60,
        y: rowIdx * 165 + 60
      };
    });
  });

  return positions;
};

const NetworkExplorerInternal: React.FC = () => {
  const navigate = useNavigate();
  const { setCenter, fitView } = useReactFlow();

  const [cases, setCases] = useState<Array<{ id: string; title: string; case_number: string }>>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [domainNodes, setDomainNodes] = useState<GraphNode[]>([]);
  const [, setDomainEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // React Flow state
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Filter toolbar states
  const [entityFilters, setEntityFilters] = useState({
    PERSONS: true,
    ORGS: true,
    LOCATIONS: true,
    COMMS: true,
    FINANCIAL: true,
    VEHICLES: true,
    EVENTS: true,
  });

  const [activeTab, setActiveTab] = useState<'BOARD' | 'CENTRALITY_MATRIX'>('BOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Load Cases
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

  // 2. Fetch Graph for selected case
  useEffect(() => {
    if (!selectedCaseId) {
      setDomainNodes([]);
      setDomainEdges([]);
      setRfNodes([]);
      setRfEdges([]);
      setSelectedNodeId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get(`/graph/${selectedCaseId}`)
      .then((data: any) => {
        const rawNodesList = data.nodes || [];
        const rawEdgesList = data.edges || [];

        const uniqueNodesMap = new Map();
        rawNodesList.forEach((n: any) => {
          if (n && n.id && !uniqueNodesMap.has(n.id)) {
            uniqueNodesMap.set(n.id, n);
          }
        });
        const rawNodes = Array.from(uniqueNodesMap.values());
        const rawEdges = rawEdgesList.filter((e: any) => uniqueNodesMap.has(e.source) && uniqueNodesMap.has(e.target));

        const positions = calculateNodePositions(rawNodes);

        const formattedNodes: GraphNode[] = rawNodes.map((n: any, idx: number) => {
          const props = n.properties || n.data?.properties || {};
          const typeUpper = (n.type || n.label || props.type || 'PERSON').toUpperCase();

          const nodeAssociates = rawEdges
            .filter((e: any) => e.source === n.id || e.target === n.id)
            .map((e: any) => {
              const isSrc = e.source === n.id;
              const otherId = isSrc ? e.target : e.source;
              const otherNode = rawNodes.find((x: any) => x.id === otherId);
              return {
                id: otherId,
                name: otherNode?.name || otherId,
                type: otherNode?.type || otherNode?.label || 'Entity',
                relation: e.label || e.type || 'ASSOCIATED_WITH',
                confidence: `${Math.round((e.confidence || 0.85) * 100)}%`,
                details: e.properties?.interaction || e.properties?.cell_tower_id || ''
              };
            });

          return {
            id: n.id,
            name: n.name || props.name || n.id,
            alias: props.alias || props.crime_reference || `REF-${n.id.slice(0, 8)}`,
            type: typeUpper,
            role: props.role || props.description || typeUpper,
            riskScore: props.risk_score || n.risk_score || 65,
            confidence: Math.round((props.confidence || n.confidence || 0.9) * 100),
            color: typeUpper === 'PERSON' ? '#ef4444' : typeUpper === 'ORG' ? '#3b82f6' : typeUpper === 'LOCATION' ? '#10b981' : typeUpper === 'VEHICLE' ? '#06b6d4' : typeUpper === 'ACCOUNT' ? '#f59e0b' : '#a855f7',
            borderClass: typeUpper === 'PERSON' ? 'border-red-500' : 'border-outline-variant',
            textClass: typeUpper === 'PERSON' ? 'text-red-400' : 'text-primary',
            icon: typeUpper === 'PERSON' ? 'person' : typeUpper === 'ORG' ? 'corporate_fare' : typeUpper === 'LOCATION' ? 'location_on' : typeUpper === 'VEHICLE' ? 'directions_car' : typeUpper === 'ACCOUNT' ? 'credit_card' : 'cell_tower',
            pagerank: props.pagerank || 0.08,
            betweenness: props.betweenness || 0.42,
            degree: nodeAssociates.length,
            community: props.community || `CLUSTER_${(idx % 3) + 1}`,
            evidenceId: props.source_evidence_id ? `EV-${props.source_evidence_id.slice(0, 8)}` : `EV-VAULT-0${idx + 1}`,
            details: props.details || `Extracted entity with ${nodeAssociates.length} cross-referenced relationships in intelligence graph.`,
            rawProperties: props,
            associates: nodeAssociates
          };
        });

        setDomainNodes(formattedNodes);
        setDomainEdges(rawEdges);

        if (formattedNodes.length > 0) {
          setSelectedNodeId(formattedNodes[0].id);
        } else {
          setSelectedNodeId(null);
        }

        // Build React Flow Nodes
        const flowNodes: Node[] = formattedNodes.map((n) => {
          const pos = positions[n.id] || { x: 100, y: 100 };
          return {
            id: n.id,
            type: 'investigationCard',
            position: pos,
            data: {
              id: n.id,
              name: n.name,
              label: n.name,
              type: n.type,
              role: n.role,
              riskScore: n.riskScore,
              confidence: n.confidence,
              rawProperties: n.rawProperties,
            } as InvestigationNodeData,
          };
        });

        // Build React Flow Edges
        const flowEdges: Edge[] = rawEdges.map((e: any, idx: number) => {
          const labelUpper = (e.label || e.type || '').toUpperCase();
          const isComm = labelUpper.includes('COMM');
          const isFin = labelUpper.includes('TRANS') || labelUpper.includes('ACCOUNT');
          const color = isComm ? '#c084fc' : isFin ? '#fbbf24' : '#38bdf8';

          return {
            id: `e-${e.source}-${e.target}-${idx}`,
            source: e.source,
            target: e.target,
            label: e.label || e.type || 'ASSOCIATED_WITH',
            type: 'smoothstep',
            animated: isComm || isFin,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: color,
            },
            style: {
              stroke: color,
              strokeWidth: 1.8,
            },
          };
        });

        setRfNodes(flowNodes);
        setRfEdges(flowEdges);

        setTimeout(() => {
          fitView({ padding: 0.2, duration: 600 });
        }, 150);
      })
      .catch((err) => {
        console.error('Failed to load case graph:', err);
        setDomainNodes([]);
        setDomainEdges([]);
        setRfNodes([]);
        setRfEdges([]);
        setSelectedNodeId(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCaseId, fitView, setRfNodes, setRfEdges]);

  // Handle Filter Toggles
  const handleToggleFilter = (key: keyof typeof entityFilters) => {
    setEntityFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isTypeVisible = useCallback((type: string) => {
    const t = type.toUpperCase();
    if (t.includes('PERSON') && !entityFilters.PERSONS) return false;
    if (t.includes('ORG') && !entityFilters.ORGS) return false;
    if (t.includes('LOCATION') && !entityFilters.LOCATIONS) return false;
    if (t.includes('PHONE') && !entityFilters.COMMS) return false;
    if (t.includes('ACCOUNT') && !entityFilters.FINANCIAL) return false;
    if (t.includes('VEHICLE') && !entityFilters.VEHICLES) return false;
    if (t.includes('EVENT') && !entityFilters.EVENTS) return false;
    return true;
  }, [entityFilters]);

  // Filtered React Flow Nodes & Edges
  const visibleRfNodes = useMemo(() => {
    return rfNodes.map((n) => {
      const data = n.data as unknown as InvestigationNodeData;
      const isVisible = isTypeVisible(data.type);
      const isSearchMatch =
        !searchQuery.trim() ||
        data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (data.role || '').toLowerCase().includes(searchQuery.toLowerCase());

      return {
        ...n,
        hidden: !isVisible || !isSearchMatch,
        selected: selectedNodeId === n.id,
      };
    });
  }, [rfNodes, isTypeVisible, searchQuery, selectedNodeId]);

  const visibleRfEdges = useMemo(() => {
    const hiddenNodeIds = new Set(visibleRfNodes.filter(n => n.hidden).map(n => n.id));
    return rfEdges.map(e => ({
      ...e,
      hidden: hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target),
    }));
  }, [rfEdges, visibleRfNodes]);

  // Selected Node Data
  const currentNode = useMemo(() => {
    return domainNodes.find(n => n.id === selectedNodeId) || domainNodes[0] || null;
  }, [domainNodes, selectedNodeId]);

  // Handle Node Selection on canvas
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Handle Associate One-Click Navigation
  const handleSelectAssociate = useCallback((targetId: string) => {
    setSelectedNodeId(targetId);
    const targetNode = rfNodes.find(n => n.id === targetId);
    if (targetNode) {
      setCenter(targetNode.position.x + 128, targetNode.position.y + 50, { zoom: 1.15, duration: 750 });
    }
  }, [rfNodes, setCenter]);

  // Reset Board Layout
  const handleRearrangeBoard = () => {
    const positions = calculateNodePositions(domainNodes);
    setRfNodes(prev =>
      prev.map(n => ({
        ...n,
        position: positions[n.id] || n.position,
      }))
    );
    fitView({ padding: 0.2, duration: 600 });
    triggerToast('Investigation board layout re-aligned.');
  };

  const handleExportCypher = () => {
    if (!currentNode) return;
    const cypher = `MATCH (t {id: '${currentNode.id}'})-[r]-(n) RETURN t, r, n LIMIT 50;`;
    navigator.clipboard?.writeText(cypher);
    triggerToast(`NEO4J CYPHER COPIED: "${cypher}"`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] -m-4 lg:-m-8 bg-surface text-on-surface antialiased select-none overflow-hidden border-t border-outline-variant font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50 shrink-0">
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
            <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
            VEILLE // INVESTIGATION BOARD
          </span>
          <div className="h-4 w-px bg-outline-variant hidden sm:block" />

          {/* Case Selector Dropdown */}
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="text-outline">CASE:</span>
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

        {/* View Switcher Tabs & Live Suspect Search */}
        <div className="flex items-center space-x-2">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search board nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface text-[11px] font-mono pl-7 pr-2 py-1 w-48 focus:w-60 focus:border-primary focus:outline-none transition-all"
            />
            <span className="material-symbols-outlined absolute left-1.5 top-1.5 text-xs text-outline pointer-events-none">
              search
            </span>
          </div>

          <div className="flex border border-outline-variant p-0.5 bg-surface-container-low font-mono text-[10px]">
            <button
              onClick={() => setActiveTab('BOARD')}
              className={`px-2 py-0.5 transition-colors cursor-pointer font-bold ${
                activeTab === 'BOARD' ? 'bg-primary text-surface-container-lowest' : 'text-outline hover:text-on-surface'
              }`}
            >
              BOARD CANVAS
            </button>
            <button
              onClick={() => setActiveTab('CENTRALITY_MATRIX')}
              className={`px-2 py-0.5 transition-colors cursor-pointer font-bold ${
                activeTab === 'CENTRALITY_MATRIX' ? 'bg-primary text-surface-container-lowest' : 'text-outline hover:text-on-surface'
              }`}
            >
              CENTRALITY MATRIX
            </button>
          </div>
        </div>
      </header>

      {/* ================= FILTER TOOLBAR STRIP ================= */}
      <section className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-low gap-2 text-xs font-mono shrink-0">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="text-[10px] text-outline font-bold uppercase">ENTITY FILTERS:</span>
          {(['PERSONS', 'VEHICLES', 'COMMS', 'FINANCIAL', 'LOCATIONS', 'ORGS', 'EVENTS'] as const).map((cat) => (
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
          <button
            onClick={handleRearrangeBoard}
            className="px-2 py-0.5 bg-surface-container border border-outline-variant hover:border-primary text-on-surface hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-bold"
            title="Auto-organize card columns"
          >
            <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
            <span>AUTO-ALIGN</span>
          </button>
          <span className="text-outline">NODES: <strong className="text-on-surface">{visibleRfNodes.filter(n => !n.hidden).length}</strong></span>
          <span className="text-outline">EDGES: <strong className="text-on-surface">{visibleRfEdges.filter(e => !e.hidden).length}</strong></span>
        </div>
      </section>

      {/* ================= MAIN INVESTIGATION BOARD / MATRIX ================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {activeTab === 'BOARD' ? (
          <>
            {/* Graph Canvas Theater (65%) */}
            <div className="w-full lg:w-[65%] border-r border-outline-variant flex flex-col bg-[#080d1a] relative overflow-hidden">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-outline font-mono text-xs">
                  <span className="material-symbols-outlined text-3xl animate-spin mb-2 text-primary">progress_activity</span>
                  <div>LOADING CASE KNOWLEDGE GRAPH FROM NEO4J...</div>
                </div>
              ) : domainNodes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline font-mono">
                  <div className="w-14 h-14 rounded-full border border-outline-variant bg-surface-container-low flex items-center justify-center text-outline mb-3">
                    <span className="material-symbols-outlined text-3xl">hub</span>
                  </div>
                  <div className="text-sm font-bold text-on-surface uppercase">INVESTIGATION BOARD IS EMPTY</div>
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
                <div className="flex-1 relative w-full h-full">
                  <ReactFlow
                    nodes={visibleRfNodes}
                    edges={visibleRfEdges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleNodeClick}
                    onPaneClick={() => setSelectedNodeId(null)}
                    minZoom={0.2}
                    maxZoom={2.5}
                    fitView
                    className="bg-[#080d1a]"
                  >
                    <Background color="#38bdf8" gap={24} size={1} className="opacity-15" />
                    <Controls className="!m-4" showInteractive={false} />
                    <MiniMap
                      className="!m-4"
                      nodeColor={(n) => {
                        const data = n.data as unknown as InvestigationNodeData;
                        const t = (data.type || '').toUpperCase();
                        if (t.includes('PERSON')) return '#ef4444';
                        if (t.includes('VEHICLE')) return '#06b6d4';
                        if (t.includes('PHONE')) return '#a855f7';
                        if (t.includes('ACCOUNT')) return '#f59e0b';
                        if (t.includes('LOCATION')) return '#10b981';
                        return '#3b82f6';
                      }}
                      zoomable
                      pannable
                    />
                  </ReactFlow>
                </div>
              )}
            </div>

            {/* Right Intelligence Dossier Inspector Drawer (35%) */}
            <div className="w-full lg:w-[35%] flex flex-col bg-surface-container-low overflow-y-auto p-4 font-mono text-xs">
              {currentNode ? (
                <div className="space-y-4">
                  {/* Header Profile */}
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                    <div>
                      <div className="text-primary font-bold text-sm tracking-wide">{currentNode.name}</div>
                      <div className="text-outline text-[11px] font-mono mt-0.5">{currentNode.role}</div>
                    </div>
                    <span className="px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider bg-surface-container border-primary/40 text-primary">
                      {currentNode.type}
                    </span>
                  </div>

                  {/* Threat Gauge & Key Metrics */}
                  <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded space-y-2.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-outline uppercase text-[10px]">THREAT SCORE:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              currentNode.riskScore >= 75 ? 'bg-error' : currentNode.riskScore >= 50 ? 'bg-amber-400' : 'bg-secondary'
                            }`}
                            style={{ width: `${currentNode.riskScore}%` }}
                          />
                        </div>
                        <span className={`font-bold ${currentNode.riskScore >= 75 ? 'text-error' : 'text-amber-400'}`}>
                          {currentNode.riskScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-outline uppercase text-[10px]">CONFIDENCE:</span>
                      <span className="text-secondary font-bold">{currentNode.confidence}% MATCH</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-outline uppercase text-[10px]">EVIDENCE SOURCE:</span>
                      <span className="text-primary font-bold">{currentNode.evidenceId}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-outline uppercase text-[10px]">NETWORK DEGREE:</span>
                      <span className="text-on-surface font-bold">{currentNode.degree} direct connections</span>
                    </div>
                  </div>

                  {/* Dynamic Extracted Attributes Table */}
                  {currentNode.rawProperties && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-outline tracking-wider">
                        EXTRACTED METADATA ATTRIBUTES
                      </div>
                      <div className="p-2.5 bg-surface-container-lowest border border-outline-variant rounded space-y-1.5 text-[11px]">
                        {Object.entries(currentNode.rawProperties)
                          .filter(([key]) => !['id', 'case_id', 'updated_at', 'properties', 'source_evidence_id', 'name', 'alias', 'community', 'degree'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start border-b border-outline-variant/30 pb-1 last:border-none last:pb-0">
                              <span className="text-outline uppercase text-[10px] font-mono">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-on-surface font-medium text-right max-w-[60%] break-words">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        {Object.entries(currentNode.rawProperties).filter(([key]) => !['id', 'case_id', 'updated_at', 'properties', 'source_evidence_id', 'name', 'alias', 'community', 'degree'].includes(key)).length === 0 && (
                          <div className="text-outline text-[10px] italic">No secondary attributes extracted.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Connected Graph Associates with One-Click Neighbor Traversal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-outline tracking-wider">
                        CONNECTED NEIGHBORS ({currentNode.associates.length})
                      </span>
                      <span className="text-[9px] text-primary font-mono">CLICK TO TRAVERSE ➔</span>
                    </div>

                    {currentNode.associates.length > 0 ? (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {currentNode.associates.map((assoc, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectAssociate(assoc.id)}
                            className="p-2 bg-surface-container-lowest border border-outline-variant hover:border-primary/80 hover:bg-surface-container transition-all cursor-pointer rounded flex items-center justify-between text-[11px] group"
                          >
                            <div className="overflow-hidden mr-2">
                              <div className="text-on-surface font-bold truncate group-hover:text-primary transition-colors">
                                {assoc.name}
                              </div>
                              <div className="text-[9px] text-outline flex items-center gap-1.5">
                                <span className="text-primary font-semibold">{assoc.relation}</span>
                                {assoc.details && <span>• {assoc.details}</span>}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-container-high border border-outline-variant text-secondary shrink-0 rounded">
                              {assoc.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-surface-container-lowest border border-outline-variant text-[10px] text-outline italic rounded">
                        Isolated node (no direct edge relationships detected in this case file).
                      </div>
                    )}
                  </div>

                  {/* Forensic Investigative Notes */}
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-outline tracking-wider">INTELLIGENCE BRIEFING</div>
                    <div className="p-3 bg-surface-container-lowest border border-outline-variant text-[11px] leading-relaxed text-on-surface-variant rounded">
                      {currentNode.details}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleExportCypher}
                      className="w-full py-2 bg-surface-container-high border border-outline-variant hover:border-primary text-on-surface font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded"
                    >
                      <span className="material-symbols-outlined text-xs">terminal</span>
                      <span>EXPORT CYPHER QUERY</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
                  <span className="material-symbols-outlined text-3xl mb-2">find_in_page</span>
                  <div>Select an entity card on the board to inspect full intelligence dossier.</div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Centrality Matrix Analytical View */
          <div className="flex-1 overflow-y-auto p-4 bg-surface font-mono">
            <div className="border border-outline-variant bg-surface-container-lowest overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-outline text-[10px] uppercase tracking-wider h-8">
                    <th className="px-3 py-2 font-semibold">ENTITY NAME</th>
                    <th className="px-3 py-2 font-semibold">CATEGORY</th>
                    <th className="px-3 py-2 font-semibold text-right">PAGERANK</th>
                    <th className="px-3 py-2 font-semibold text-right">BETWEENNESS</th>
                    <th className="px-3 py-2 font-semibold text-right">DEGREE</th>
                    <th className="px-3 py-2 font-semibold text-center">RISK SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {domainNodes.map((n, idx) => (
                    <tr
                      key={`${n.id}-${idx}`}
                      onClick={() => {
                        setSelectedNodeId(n.id);
                        setActiveTab('BOARD');
                        handleSelectAssociate(n.id);
                      }}
                      className="hover:bg-surface-container-high/40 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 font-bold text-primary">{n.name}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 bg-surface-container border border-outline-variant text-[10px] font-bold text-on-surface uppercase">
                          {n.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{n.pagerank.toFixed(4)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{n.betweenness.toFixed(4)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-secondary">{n.degree}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            n.riskScore >= 75
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {n.riskScore}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const NetworkExplorer: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NetworkExplorerInternal />
    </ReactFlowProvider>
  );
};

export default NetworkExplorer;
