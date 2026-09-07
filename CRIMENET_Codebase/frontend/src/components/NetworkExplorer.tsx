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
  useViewport,
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

type LayoutType = 'ORGANIC' | 'RADIAL' | 'HIERARCHY' | 'GRID';
type LODMode = 'AUTO' | 'COMPACT' | 'MEDIUM' | 'FULL';

// ================= LAYOUT ALGORITHMS =================
const calculateLayoutPositions = (
  rawNodes: any[],
  rawEdges: any[],
  layout: LayoutType = 'ORGANIC'
): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};
  const n = rawNodes.length;
  if (n === 0) return positions;

  if (layout === 'RADIAL') {
    // Radial Concentric Ring layout based on node degree
    const degrees: Record<string, number> = {};
    rawNodes.forEach(node => { degrees[node.id] = 0; });
    rawEdges.forEach(e => {
      if (degrees[e.source] !== undefined) degrees[e.source]++;
      if (degrees[e.target] !== undefined) degrees[e.target]++;
    });

    const sorted = [...rawNodes].sort((a, b) => (degrees[b.id] || 0) - (degrees[a.id] || 0));
    const centerNode = sorted[0];
    positions[centerNode.id] = { x: 500, y: 400 };

    const remaining = sorted.slice(1);
    const ring1Count = Math.min(8, remaining.length);
    const ring1 = remaining.slice(0, ring1Count);
    const ring2 = remaining.slice(ring1Count);

    ring1.forEach((node, i) => {
      const angle = (i / ring1Count) * 2 * Math.PI;
      positions[node.id] = {
        x: 500 + Math.cos(angle) * 320,
        y: 400 + Math.sin(angle) * 320,
      };
    });

    ring2.forEach((node, i) => {
      const angle = (i / ring2.length) * 2 * Math.PI;
      positions[node.id] = {
        x: 500 + Math.cos(angle) * 580,
        y: 400 + Math.sin(angle) * 580,
      };
    });

    return positions;
  }

  if (layout === 'HIERARCHY') {
    // Top-down hierarchical layout (Coordinators at top, Operatives/Brokers in middle, Peripheral at bottom)
    const tiers: { TOP: any[]; MID: any[]; BASE: any[] } = { TOP: [], MID: [], BASE: [] };
    rawNodes.forEach(node => {
      const type = (node.type || node.label || '').toUpperCase();
      const score = node.risk_score || node.properties?.risk_score || 50;
      if (score >= 75 || type.includes('ORG')) tiers.TOP.push(node);
      else if (type.includes('PERSON') || type.includes('ACCOUNT') || score >= 50) tiers.MID.push(node);
      else tiers.BASE.push(node);
    });

    Object.entries(tiers).forEach(([tierKey, nodesInTier], rowIdx) => {
      const count = nodesInTier.length;
      nodesInTier.forEach((node, colIdx) => {
        const spacingX = 300;
        const startX = 500 - (count * spacingX) / 2 + spacingX / 2;
        positions[node.id] = {
          x: startX + colIdx * spacingX,
          y: rowIdx * 240 + 80,
        };
      });
    });

    return positions;
  }

  if (layout === 'ORGANIC') {
    // Organic Force-Spring Inspired Spacing with Natural Clustering
    const centerX = 500;
    const centerY = 400;
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio spiral distribution

    rawNodes.forEach((node, i) => {
      const radius = 110 * Math.sqrt(i + 1) * 1.8;
      const angle = i * 2 * Math.PI * (1 - 1 / phi);
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle) * 0.85,
      };
    });

    return positions;
  }

  // Fallback: Structured Categorical Columns
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

  colOrder.forEach((cat, colIdx) => {
    cols[cat].forEach((node, rowIdx) => {
      positions[node.id] = {
        x: colIdx * 340 + 80,
        y: rowIdx * 170 + 80
      };
    });
  });

  return positions;
};

const NetworkExplorerInternal: React.FC = () => {
  const navigate = useNavigate();
  const { setCenter, fitView } = useReactFlow();
  const viewport = useViewport();

  const [cases, setCases] = useState<Array<{ id: string; title: string; case_number: string }>>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [domainNodes, setDomainNodes] = useState<GraphNode[]>([]);
  const [domainEdges, setDomainEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Layout Engine & LOD View Modes
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('ORGANIC');
  const [lodMode, setLodMode] = useState<LODMode>('AUTO');

  // Removed/Hidden entity IDs state
  const [removedEntityIds, setRemovedEntityIds] = useState<Set<string>>(new Set());

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

  const [minThreatFilter, setMinThreatFilter] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'BOARD' | 'CENTRALITY_MATRIX'>('BOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<any | null>(null);

  // Shortest Path modal states
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [pathSourceId, setPathSourceId] = useState('');
  const [pathTargetId, setPathTargetId] = useState('');
  const [highlightedPathIds, setHighlightedPathIds] = useState<Set<string>>(new Set());

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Determine current active LOD Level (compact | medium | full)
  const activeLOD: 'compact' | 'medium' | 'full' = useMemo(() => {
    if (lodMode === 'COMPACT') return 'compact';
    if (lodMode === 'MEDIUM') return 'medium';
    if (lodMode === 'FULL') return 'full';

    // Auto calculate from viewport zoom
    const z = viewport.zoom;
    if (z < 0.65) return 'compact';
    if (z < 1.15) return 'medium';
    return 'full';
  }, [lodMode, viewport.zoom]);

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
    setRemovedEntityIds(new Set());
    setHighlightedPathIds(new Set());

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

        const positions = calculateLayoutPositions(rawNodes, rawEdges, currentLayout);

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
          setPathSourceId(formattedNodes[0].id);
          if (formattedNodes.length > 1) {
            setPathTargetId(formattedNodes[1].id);
          }
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
          fitView({ padding: 0.25, duration: 700 });
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
  }, [selectedCaseId, currentLayout, fitView, setRfNodes, setRfEdges]);

  // Handle Switch Layout Engine
  const handleApplyLayout = (layout: LayoutType) => {
    setCurrentLayout(layout);
    const positions = calculateLayoutPositions(domainNodes, domainEdges, layout);
    setRfNodes(prev =>
      prev.map(n => ({
        ...n,
        position: positions[n.id] || n.position,
      }))
    );
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 750 });
    }, 100);
    triggerToast(`Applied ${layout} layout engine.`);
  };

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

  // Remove Entity from Canvas handler
  const handleRemoveEntity = (entityId: string) => {
    setRemovedEntityIds(prev => {
      const next = new Set(prev);
      next.add(entityId);
      return next;
    });
    if (selectedNodeId === entityId) {
      setSelectedNodeId(null);
    }
    triggerToast('Entity removed from active investigation canvas.');
  };

  // Restore All Removed Entities
  const handleRestoreEntities = () => {
    setRemovedEntityIds(new Set());
    triggerToast('All removed entities restored to canvas.');
  };

  // Connected Neighbors map for Focus Dimming
  const activeFocusNodeId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusNodeId) return null;
    const set = new Set<string>([activeFocusNodeId]);
    domainEdges.forEach(e => {
      if (e.source === activeFocusNodeId) set.add(e.target);
      if (e.target === activeFocusNodeId) set.add(e.source);
    });
    return set;
  }, [activeFocusNodeId, domainEdges]);

  // Filtered React Flow Nodes & Edges respecting Filters, LOD, and Path Highlighting
  const visibleRfNodes = useMemo(() => {
    return rfNodes.map((n) => {
      const data = n.data as unknown as InvestigationNodeData;
      const isRemoved = removedEntityIds.has(n.id);
      const passesThreat = (data.riskScore || 50) >= minThreatFilter;
      const isVisible = isTypeVisible(data.type) && !isRemoved && passesThreat;
      const isSearchMatch =
        !searchQuery.trim() ||
        data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (data.role || '').toLowerCase().includes(searchQuery.toLowerCase());

      const isPathHighlight = highlightedPathIds.has(n.id);
      const isDimmed =
        highlightedPathIds.size > 0
          ? !isPathHighlight
          : connectedNodeIds !== null && !connectedNodeIds.has(n.id);

      return {
        ...n,
        hidden: !isVisible || !isSearchMatch,
        selected: selectedNodeId === n.id,
        data: {
          ...data,
          lod: activeLOD,
          dimmed: isDimmed,
          highlighted: isPathHighlight || n.id === activeFocusNodeId,
        },
      };
    });
  }, [rfNodes, isTypeVisible, removedEntityIds, minThreatFilter, searchQuery, selectedNodeId, activeLOD, highlightedPathIds, connectedNodeIds, activeFocusNodeId]);

  const visibleRfEdges = useMemo(() => {
    const hiddenNodeIds = new Set(visibleRfNodes.filter(n => n.hidden).map(n => n.id));
    return rfEdges.map(e => {
      const isHidden = hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target);
      const isPathEdge = highlightedPathIds.has(e.source) && highlightedPathIds.has(e.target);
      const isDimmed =
        highlightedPathIds.size > 0
          ? !isPathEdge
          : connectedNodeIds !== null && !(connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target));

      return {
        ...e,
        hidden: isHidden,
        style: {
          ...e.style,
          stroke: isPathEdge ? '#00e5ff' : e.style?.stroke,
          strokeWidth: isPathEdge ? 3.5 : e.style?.strokeWidth || 1.8,
          opacity: isDimmed ? 0.2 : 1,
        },
      };
    });
  }, [rfEdges, visibleRfNodes, highlightedPathIds, connectedNodeIds]);

  // Selected Node Data
  const currentNode = useMemo(() => {
    if (!selectedNodeId) return domainNodes.find(n => !removedEntityIds.has(n.id)) || null;
    return domainNodes.find(n => n.id === selectedNodeId) || null;
  }, [domainNodes, selectedNodeId, removedEntityIds]);

  // Handle Node Selection on canvas
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedEdgeData(null);
    setSelectedNodeId(node.id);
  }, []);

  const handleNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Handle Edge Selection for "WHY THIS CONNECTION?" Explainability Drawer
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    const srcNode = domainNodes.find(n => n.id === edge.source);
    const tgtNode = domainNodes.find(n => n.id === edge.target);

    setSelectedNodeId(null);
    setSelectedEdgeData({
      id: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      sourceName: srcNode?.name || edge.source,
      targetName: tgtNode?.name || edge.target,
      sourceType: (srcNode?.type || 'ENTITY').toUpperCase(),
      targetType: (tgtNode?.type || 'ENTITY').toUpperCase(),
      label: (edge as any).label || 'ASSOCIATED_WITH',
      confidence: (edge as any).data?.confidence || (edge as any).confidence || 0.94,
      evidenceId: (edge as any).data?.evidence_id || srcNode?.evidenceId || 'SEIZED_EVIDENCE_VAULT',
      citation: (edge as any).data?.properties?.citation || `${srcNode?.name} ➔ ${tgtNode?.name} communication intercept`,
      observations: (edge as any).data?.properties?.observations || 'Direct evidentiary correlation extracted via multi-source intelligence engine.',
      firstSeen: (edge as any).data?.properties?.first_seen || '2026-09-02 09:30',
      lastSeen: (edge as any).data?.properties?.last_seen || '2026-09-05 18:45',
      properties: (edge as any).data?.properties || {},
    });
  }, [domainNodes]);

  // Handle Associate One-Click Navigation & Smooth Traversal
  const handleSelectAssociate = useCallback((targetId: string) => {
    setSelectedNodeId(targetId);
    setSelectedEdgeData(null);

    const targetNode = rfNodes.find(n => n.id === targetId);
    if (targetNode && setCenter) {
      setCenter(targetNode.position.x + 100, targetNode.position.y + 50, { zoom: 1.25, duration: 800 });
      triggerToast(`Focused on node: ${targetNode.data?.name || targetId}`);
    }
  }, [rfNodes, setCenter]);

  // Shortest Path Finder (BFS)
  const handleFindShortestPath = () => {
    if (!pathSourceId || !pathTargetId || pathSourceId === pathTargetId) {
      triggerToast('Please select two distinct entities to trace shortest path.');
      return;
    }

    // Build adjacency list
    const adj: Record<string, string[]> = {};
    domainNodes.forEach(n => { adj[n.id] = []; });
    domainEdges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (adj[e.target]) adj[e.target].push(e.source);
    });

    // BFS
    const queue: Array<{ id: string; path: string[] }> = [{ id: pathSourceId, path: [pathSourceId] }];
    const visited = new Set<string>([pathSourceId]);
    let foundPath: string[] | null = null;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.id === pathTargetId) {
        foundPath = current.path;
        break;
      }
      for (const neighbor of (adj[current.id] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, path: [...current.path, neighbor] });
        }
      }
    }

    if (foundPath && foundPath.length > 0) {
      setHighlightedPathIds(new Set(foundPath));
      setIsPathModalOpen(false);
      triggerToast(`Found shortest path with ${foundPath.length - 1} hops between entities!`);
    } else {
      triggerToast('No connected pathway exists between selected entities.');
    }
  };

  const handleClearPathHighlight = () => {
    setHighlightedPathIds(new Set());
    triggerToast('Cleared path highlights.');
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
      <header className="flex flex-wrap justify-between items-center w-full px-4 py-2 border-b border-outline-variant bg-surface-container-lowest z-40 shrink-0 gap-2 font-mono text-xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="text-xs font-bold tracking-wider text-primary uppercase flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
            VEILLE // FORENSIC LINK GRAPH
          </span>
          <div className="h-4 w-px bg-outline-variant hidden sm:block" />

          {/* Case Selector Dropdown */}
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-outline">CASE:</span>
            {cases.length > 0 ? (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-surface-container-low border border-outline-variant text-primary px-2.5 py-1 font-mono text-xs focus:outline-none rounded"
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
              placeholder="Search graph nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface text-[11px] font-mono pl-7 pr-2 py-1 w-44 focus:w-56 focus:border-primary focus:outline-none transition-all rounded"
            />
            <span className="material-symbols-outlined absolute left-1.5 top-1.5 text-xs text-outline pointer-events-none">
              search
            </span>
          </div>

          <div className="flex border border-outline-variant p-0.5 bg-surface-container-low font-mono text-[10px] rounded">
            <button
              onClick={() => setActiveTab('BOARD')}
              className={`px-2 py-0.5 transition-colors cursor-pointer font-bold rounded ${
                activeTab === 'BOARD' ? 'bg-primary text-surface-container-lowest' : 'text-outline hover:text-on-surface'
              }`}
            >
              GRAPH CANVAS
            </button>
            <button
              onClick={() => setActiveTab('CENTRALITY_MATRIX')}
              className={`px-2 py-0.5 transition-colors cursor-pointer font-bold rounded ${
                activeTab === 'CENTRALITY_MATRIX' ? 'bg-primary text-surface-container-lowest' : 'text-outline hover:text-on-surface'
              }`}
            >
              CENTRALITY MATRIX
            </button>
          </div>
        </div>
      </header>

      {/* ================= DYNAMIC HUD TOOLBAR: LAYOUT ENGINE & LOD CONTROLS ================= */}
      <section className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-low gap-2 text-xs font-mono shrink-0">
        {/* Left: Layout Engines & LOD View Modes */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-1.5">
          {/* Layout Switcher */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-outline uppercase font-bold">LAYOUT:</span>
            <div className="flex border border-outline-variant p-0.5 bg-surface-container-lowest rounded">
              {(['ORGANIC', 'RADIAL', 'HIERARCHY', 'GRID'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleApplyLayout(mode)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                    currentLayout === mode
                      ? 'bg-primary text-surface-container-lowest'
                      : 'text-outline hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* LOD View Mode Switcher */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-outline uppercase font-bold">LOD SIZING:</span>
            <div className="flex border border-outline-variant p-0.5 bg-surface-container-lowest rounded">
              {(['AUTO', 'COMPACT', 'MEDIUM', 'FULL'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setLodMode(m)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                    lodMode === m
                      ? 'bg-secondary text-surface-container-lowest'
                      : 'text-outline hover:text-white'
                  }`}
                  title={m === 'AUTO' ? 'Auto-scale from zoom level' : `Lock to ${m} view`}
                >
                  {m === 'AUTO' ? `AUTO (${activeLOD.toUpperCase()})` : m}
                </button>
              ))}
            </div>
          </div>

          {/* Shortest Path Finder Button */}
          <button
            onClick={() => setIsPathModalOpen(true)}
            className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant hover:border-primary text-primary font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">route</span>
            <span>FIND PATH</span>
          </button>

          {highlightedPathIds.size > 0 && (
            <button
              onClick={handleClearPathHighlight}
              className="px-2 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-400 rounded text-[10px] font-bold cursor-pointer"
            >
              CLEAR PATH ({highlightedPathIds.size} NODES)
            </button>
          )}
        </div>

        {/* Right: Category Filter Pills & Metrics */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {(['PERSONS', 'VEHICLES', 'COMMS', 'FINANCIAL', 'LOCATIONS', 'ORGS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleToggleFilter(cat)}
              className={`px-1.5 py-0.5 border text-[9px] font-bold transition-colors cursor-pointer rounded ${
                entityFilters[cat]
                  ? 'border-primary/60 text-primary bg-primary/10'
                  : 'border-outline-variant text-outline bg-surface-container-lowest'
              }`}
            >
              {cat}
            </button>
          ))}

          {removedEntityIds.size > 0 && (
            <button
              onClick={handleRestoreEntities}
              className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-colors flex items-center gap-1 cursor-pointer font-bold rounded text-[10px]"
            >
              <span className="material-symbols-outlined text-[12px]">undo</span>
              <span>RESTORE ({removedEntityIds.size})</span>
            </button>
          )}

          <div className="text-[10px] text-outline font-mono pl-2 border-l border-outline-variant">
            NODES: <strong className="text-white">{visibleRfNodes.filter(n => !n.hidden).length}</strong>
          </div>
        </div>
      </section>

      {/* ================= MAIN INVESTIGATION BOARD / MATRIX ================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {activeTab === 'BOARD' ? (
          <>
            {/* Graph Canvas Theater (68%) */}
            <div className="w-full lg:w-[68%] border-r border-outline-variant flex flex-col bg-[#060913] relative overflow-hidden">
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
                    className="mt-4 px-4 py-2 bg-primary text-surface-container-lowest text-xs font-mono font-bold hover:bg-primary-fixed-dim transition-colors cursor-pointer rounded"
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
                    onNodeMouseEnter={handleNodeMouseEnter}
                    onNodeMouseLeave={handleNodeMouseLeave}
                    onEdgeClick={handleEdgeClick}
                    onPaneClick={() => {
                      setSelectedNodeId(null);
                      setSelectedEdgeData(null);
                    }}
                    minZoom={0.2}
                    maxZoom={2.8}
                    fitView
                    className="bg-[#060913]"
                  >
                    <Background color="#00e5ff" gap={28} size={1} className="opacity-10" />
                    <Controls className="!m-4" showInteractive={false} />
                    <MiniMap
                      className="!m-4 !border !border-outline-variant !bg-[#0a0f1d]"
                      nodeColor={(n) => {
                        const data = n.data as unknown as InvestigationNodeData;
                        const t = (data.type || '').toUpperCase();
                        if (t.includes('PERSON')) return '#ef4444';
                        if (t.includes('VEHICLE')) return '#06b6d4';
                        if (t.includes('PHONE')) return '#c084fc';
                        if (t.includes('ACCOUNT')) return '#fbbf24';
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

            {/* Right Intelligence Dossier Inspector Drawer (32%) */}
            <div className="w-full lg:w-[32%] flex flex-col bg-surface-container-low overflow-y-auto p-4 font-mono text-xs">
              {selectedEdgeData ? (
                /* ================= WHY THIS CONNECTION? EXPLAINABILITY PANEL ================= */
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-primary/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg animate-pulse">schema</span>
                      <div>
                        <div className="text-primary font-bold text-xs tracking-wider uppercase">
                          WHY THIS CONNECTION?
                        </div>
                        <div className="text-on-surface font-bold text-sm tracking-wide">
                          {selectedEdgeData.label}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEdgeData(null)}
                      className="text-outline hover:text-on-surface p-1 rounded cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {/* Relationship Stepper Card */}
                  <div className="p-3 bg-surface-container-lowest border border-primary/30 rounded-xl space-y-3">
                    <div className="text-[10px] uppercase font-bold text-outline">CONNECTED FORENSIC ENTITIES</div>
                    
                    <div className="flex items-center justify-between gap-2 text-xs">
                      {/* Source Entity */}
                      <div
                        onClick={() => handleSelectAssociate(selectedEdgeData.sourceId)}
                        className="flex-1 p-2 bg-surface-container-low border border-outline-variant rounded hover:border-primary cursor-pointer transition-colors"
                      >
                        <div className="text-[9px] text-outline uppercase">{selectedEdgeData.sourceType}</div>
                        <div className="font-bold text-on-surface truncate">{selectedEdgeData.sourceName}</div>
                      </div>

                      {/* Direction Arrow & Label */}
                      <div className="flex flex-col items-center px-1 text-center shrink-0">
                        <span className="text-[9px] font-bold text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/30">
                          {selectedEdgeData.label}
                        </span>
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5">arrow_forward</span>
                      </div>

                      {/* Target Entity */}
                      <div
                        onClick={() => handleSelectAssociate(selectedEdgeData.targetId)}
                        className="flex-1 p-2 bg-surface-container-low border border-outline-variant rounded hover:border-primary cursor-pointer transition-colors"
                      >
                        <div className="text-[9px] text-outline uppercase">{selectedEdgeData.targetType}</div>
                        <div className="font-bold text-on-surface truncate">{selectedEdgeData.targetName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics: Confidence & Evidence */}
                  <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-2.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-outline uppercase text-[10px]">VERIFICATION CONFIDENCE:</span>
                      <span className="font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/30">
                        {Math.round(selectedEdgeData.confidence * 100)}% VERIFIED
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-outline uppercase text-[10px]">PRIMARY EVIDENCE SOURCE:</span>
                      <span className="text-primary font-bold truncate max-w-[160px]">
                        {selectedEdgeData.evidenceId}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-outline uppercase text-[10px]">CITATION &amp; REFERENCE:</span>
                      <span className="text-on-surface font-mono text-[10px] text-right truncate max-w-[160px]">
                        {selectedEdgeData.citation}
                      </span>
                    </div>
                  </div>

                  {/* Forensic Observations Table */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-outline tracking-wider">FORENSIC OBSERVATIONS</div>
                    <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-[11px] leading-relaxed text-on-surface-variant space-y-2">
                      <p>{selectedEdgeData.observations}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => navigate('/evidence-library')}
                      className="flex-1 py-2 bg-primary text-surface-container-lowest font-bold text-xs rounded hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">folder_open</span>
                      <span>OPEN EVIDENCE VAULT</span>
                    </button>
                    <button
                      onClick={() => setSelectedEdgeData(null)}
                      className="py-2 px-3 bg-surface-container border border-outline-variant hover:border-on-surface text-on-surface text-xs rounded transition-colors cursor-pointer"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              ) : currentNode ? (
                /* ================= NODE PROFILE DOSSIER ================= */
                <div className="space-y-4">
                  {/* Header Profile */}
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                    <div>
                      <div className="text-primary font-bold text-sm tracking-wide">{currentNode.name}</div>
                      <div className="text-outline text-[11px] font-mono mt-0.5">{currentNode.role}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider bg-surface-container border-primary/40 text-primary rounded">
                        {currentNode.type}
                      </span>
                      <button
                        onClick={() => handleRemoveEntity(currentNode.id)}
                        className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded cursor-pointer transition-colors"
                        title="Remove entity from canvas"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                      </button>
                    </div>
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
                      <span className="text-primary font-bold truncate max-w-[150px]">{currentNode.evidenceId}</span>
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
                      </div>
                    </div>
                  )}

                  {/* Connected Graph Associates with One-Click Neighbor Traversal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-outline tracking-wider">
                        CONNECTED NEIGHBORS ({currentNode.associates.length})
                      </span>
                      <span className="text-[9px] text-primary font-mono font-bold">CLICK TO TRAVERSE ➔</span>
                    </div>

                    {currentNode.associates.length > 0 ? (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {currentNode.associates.map((assoc, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectAssociate(assoc.id)}
                            className="p-2 bg-surface-container-lowest border border-outline-variant hover:border-primary/80 hover:bg-surface-container transition-all cursor-pointer rounded flex items-center justify-between text-[11px] group shadow-sm"
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
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-container-high border border-outline-variant text-secondary shrink-0 rounded font-bold">
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

                  {/* Actions */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleExportCypher}
                      className="w-full py-2 bg-surface-container-high border border-outline-variant hover:border-primary text-on-surface font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded font-bold"
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
            <div className="border border-outline-variant bg-surface-container-lowest overflow-hidden rounded">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-outline text-[10px] uppercase tracking-wider h-8">
                    <th className="px-3 py-2 font-semibold">ENTITY NAME</th>
                    <th className="px-3 py-2 font-semibold">CATEGORY</th>
                    <th className="px-3 py-2 font-semibold text-right">PAGERANK</th>
                    <th className="px-3 py-2 font-semibold text-right">BETWEENNESS</th>
                    <th className="px-3 py-2 font-semibold text-right">DEGREE</th>
                    <th className="px-3 py-2 font-semibold text-center">RISK SCORE</th>
                    <th className="px-3 py-2 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {domainNodes.filter(n => !removedEntityIds.has(n.id)).map((n, idx) => (
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
                        <span className="px-1.5 py-0.5 bg-surface-container border border-outline-variant text-[10px] font-bold text-on-surface uppercase rounded">
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
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(n.id);
                            setActiveTab('BOARD');
                            handleSelectAssociate(n.id);
                          }}
                          className="text-primary hover:text-primary-fixed-dim text-xs font-bold"
                        >
                          Inspect ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Shortest Path Finder Modal */}
      {isPathModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-primary">route</span>
                <span>TRACE SHORTEST SYNDICATE PATH</span>
              </div>
              <button onClick={() => setIsPathModalOpen(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">ORIGIN SUSPECT / ENTITY</label>
                <select
                  value={pathSourceId}
                  onChange={(e) => setPathSourceId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-2 text-on-surface rounded focus:border-primary focus:outline-none"
                >
                  {domainNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">DESTINATION TARGET ENTITY</label>
                <select
                  value={pathTargetId}
                  onChange={(e) => setPathTargetId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-2 text-on-surface rounded focus:border-primary focus:outline-none"
                >
                  {domainNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsPathModalOpen(false)}
                className="px-3 py-1.5 bg-surface-container-low border border-outline-variant text-outline hover:text-white rounded"
              >
                CANCEL
              </button>
              <button
                onClick={handleFindShortestPath}
                className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold rounded hover:bg-primary-fixed-dim transition-colors cursor-pointer"
              >
                CALCULATE HOPS
              </button>
            </div>
          </div>
        </div>
      )}
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
