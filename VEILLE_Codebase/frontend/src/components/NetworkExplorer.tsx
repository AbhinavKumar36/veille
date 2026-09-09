import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DetectivePinNode, DetectiveNodeData } from './DetectivePinNode';
import { DetectiveYarnEdge } from './DetectiveYarnEdge';
import { api } from '../api/client';
import {
  Pin,
  Search,
  Route,
  RefreshCw,
  EyeOff,
  FolderOpen,
  Terminal,
  PlusCircle,
} from 'lucide-react';

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
  detectivePin: DetectivePinNode,
};

const edgeTypes = {
  detectiveYarn: DetectiveYarnEdge,
};

type LayoutType = 'PINBOARD' | 'ORGANIC' | 'RADIAL' | 'HIERARCHY' | 'GRID';

// ================= EXPANSIVE NON-OVERLAPPING DETECTIVE PINBOARD LAYOUT =================
const calculateLayoutPositions = (
  rawNodes: any[],
  rawEdges: any[],
  layout: LayoutType = 'PINBOARD',
  spreadScale: number = 1.0
): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};
  const n = rawNodes.length;
  if (n === 0) return positions;

  // 1. EXPANDED DETECTIVE PINBOARD (Clear Zone Distribution + Collision Avoidance)
  if (layout === 'PINBOARD') {
    const suspects = rawNodes.filter((x) => {
      const t = (x.type || x.label || '').toUpperCase();
      return t.includes('PERSON') || t.includes('SUSPECT');
    });

    const financial = rawNodes.filter((x) => {
      const t = (x.type || x.label || '').toUpperCase();
      return t.includes('ACCOUNT') || t.includes('FINANC');
    });

    const comms = rawNodes.filter((x) => {
      const t = (x.type || x.label || '').toUpperCase();
      return t.includes('PHONE') || t.includes('COMM');
    });

    const locations = rawNodes.filter((x) => {
      const t = (x.type || x.label || '').toUpperCase();
      return t.includes('LOCATION') || t.includes('MAP') || x.isMapNode;
    });

    const others = rawNodes.filter(
      (x) =>
        !suspects.includes(x) &&
        !financial.includes(x) &&
        !comms.includes(x) &&
        !locations.includes(x)
    );

    // ZONE 1: TOP SUSPECTS GALLERY (Horizontal Spacious Row)
    const suspectStartX = 180;
    const suspectSpacingX = Math.max(300, 1200 / Math.max(1, suspects.length));
    suspects.forEach((node, i) => {
      positions[node.id] = {
        x: suspectStartX + i * suspectSpacingX * spreadScale,
        y: 80 + (i % 2 === 0 ? 0 : 40) * spreadScale,
      };
    });

    // ZONE 2: LEFT FLANK - FINANCIAL ACCOUNTS (2 Staggered Columns)
    financial.forEach((node, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      positions[node.id] = {
        x: (60 + col * 260) * spreadScale,
        y: (360 + row * 220 + (col === 1 ? 40 : 0)) * spreadScale,
      };
    });

    // ZONE 3: RIGHT FLANK - COMMS / PHONE INTERCEPTS (2 Staggered Columns)
    const commsBaseX = Math.max(1050, suspectStartX + suspects.length * suspectSpacingX * 0.85);
    comms.forEach((node, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      positions[node.id] = {
        x: (commsBaseX + col * 260) * spreadScale,
        y: (360 + row * 220 + (col === 1 ? 40 : 0)) * spreadScale,
      };
    });

    // ZONE 4: CENTRAL HUB (Tactical Map, Locations, Vehicles, Front Orgs)
    const centerMidX = (suspectStartX + commsBaseX) / 2;
    locations.forEach((node, i) => {
      positions[node.id] = {
        x: (centerMidX - 140 + (i % 2) * 300) * spreadScale,
        y: (400 + Math.floor(i / 2) * 260) * spreadScale,
      };
    });

    // ZONE 5: BOTTOM / OTHERS (Vehicles, Sticky Notes, Exhibits)
    others.forEach((node, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      positions[node.id] = {
        x: (centerMidX - 260 + col * 280) * spreadScale,
        y: (740 + row * 240) * spreadScale,
      };
    });

    // COLLISION RELAXATION PASS (Push apart any overlapping items)
    const nodeIds = Object.keys(positions);
    const minDx = 240 * spreadScale;
    const minDy = 180 * spreadScale;

    for (let iter = 0; iter < 12; iter++) {
      for (let a = 0; a < nodeIds.length; a++) {
        for (let b = a + 1; b < nodeIds.length; b++) {
          const idA = nodeIds[a];
          const idB = nodeIds[b];
          const posA = positions[idA];
          const posB = positions[idB];

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;

          if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
            const overlapX = (minDx - Math.abs(dx)) * (dx >= 0 ? 1 : -1) * 0.55;
            const overlapY = (minDy - Math.abs(dy)) * (dy >= 0 ? 1 : -1) * 0.55;

            posA.x -= overlapX;
            posA.y -= overlapY;
            posB.x += overlapX;
            posB.y += overlapY;
          }
        }
      }
    }

    return positions;
  }

  // 2. RADIAL EXPANDED LAYOUT
  if (layout === 'RADIAL') {
    const degrees: Record<string, number> = {};
    rawNodes.forEach((node) => { degrees[node.id] = 0; });
    rawEdges.forEach((e) => {
      if (degrees[e.source] !== undefined) degrees[e.source]++;
      if (degrees[e.target] !== undefined) degrees[e.target]++;
    });

    const sorted = [...rawNodes].sort((a, b) => (degrees[b.id] || 0) - (degrees[a.id] || 0));
    const centerNode = sorted[0];
    const centerX = 800 * spreadScale;
    const centerY = 600 * spreadScale;
    positions[centerNode.id] = { x: centerX - 90, y: centerY - 60 };

    const remaining = sorted.slice(1);
    const ring1Count = Math.min(6, remaining.length);
    const ring1 = remaining.slice(0, ring1Count);
    const ring2 = remaining.slice(ring1Count);

    ring1.forEach((node, i) => {
      const angle = (i / ring1Count) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * 440 * spreadScale - 90,
        y: centerY + Math.sin(angle) * 360 * spreadScale - 60,
      };
    });

    ring2.forEach((node, i) => {
      const angle = (i / Math.max(1, ring2.length)) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * 820 * spreadScale - 90,
        y: centerY + Math.sin(angle) * 640 * spreadScale - 60,
      };
    });

    return positions;
  }

  // 3. HIERARCHY EXPANDED
  if (layout === 'HIERARCHY') {
    const tiers: { TOP: any[]; MID: any[]; BASE: any[] } = { TOP: [], MID: [], BASE: [] };
    rawNodes.forEach((node) => {
      const type = (node.type || node.label || '').toUpperCase();
      const score = node.risk_score || node.properties?.risk_score || 50;
      if (score >= 75 || type.includes('ORG')) tiers.TOP.push(node);
      else if (type.includes('PERSON') || type.includes('ACCOUNT') || score >= 50) tiers.MID.push(node);
      else tiers.BASE.push(node);
    });

    Object.entries(tiers).forEach(([, nodesInTier], rowIdx) => {
      const count = nodesInTier.length;
      nodesInTier.forEach((node, colIdx) => {
        const spacingX = 360 * spreadScale;
        const startX = 750 * spreadScale - (count * spacingX) / 2 + spacingX / 2;
        positions[node.id] = {
          x: startX + colIdx * spacingX - 90,
          y: (rowIdx * 300 + 80) * spreadScale,
        };
      });
    });

    return positions;
  }

  // 4. ORGANIC SPRING EXPANDED
  if (layout === 'ORGANIC') {
    const centerX = 800 * spreadScale;
    const centerY = 550 * spreadScale;
    const phi = (1 + Math.sqrt(5)) / 2;

    rawNodes.forEach((node, i) => {
      const radius = 180 * Math.sqrt(i + 1) * 2.4 * spreadScale;
      const angle = i * 2 * Math.PI * (1 - 1 / phi);
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle) - 90,
        y: centerY + radius * Math.sin(angle) * 0.85 - 60,
      };
    });

    return positions;
  }

  // 5. GRID COLUMNS EXPANDED
  const cols: Record<string, any[]> = {
    PERSON: [],
    COMMS: [],
    FINANCIAL: [],
    LOCATION: [],
    VEHICLE: [],
    OTHER: [],
  };

  rawNodes.forEach((n) => {
    const props = n.properties || n.data?.properties || {};
    const typeUpper = (n.type || n.label || props.type || 'PERSON').toUpperCase();
    if (typeUpper.includes('PERSON') || typeUpper.includes('SUSPECT')) cols.PERSON.push(n);
    else if (typeUpper.includes('PHONE') || typeUpper.includes('COMM')) cols.COMMS.push(n);
    else if (typeUpper.includes('ACCOUNT') || typeUpper.includes('FINANC')) cols.FINANCIAL.push(n);
    else if (typeUpper.includes('LOCATION')) cols.LOCATION.push(n);
    else if (typeUpper.includes('VEHICLE')) cols.VEHICLE.push(n);
    else cols.OTHER.push(n);
  });

  const colOrder = ['PERSON', 'COMMS', 'FINANCIAL', 'LOCATION', 'VEHICLE', 'OTHER'].filter(
    (k) => cols[k].length > 0
  );

  colOrder.forEach((cat, colIdx) => {
    cols[cat].forEach((node, rowIdx) => {
      positions[node.id] = {
        x: (colIdx * 340 + 80) * spreadScale,
        y: (rowIdx * 240 + 80) * spreadScale,
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
  const [domainEdges, setDomainEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Layout Engine & Spread Spacing State
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('PINBOARD');
  const [spreadScale, setSpreadScale] = useState<number>(1.25);

  // Custom User Clue Notes (starts empty to prevent clutter)
  const [customClues, setCustomClues] = useState<
    Array<{
      id: string;
      name: string;
      noteText: string;
      color: 'yellow' | 'pink' | 'cyan';
    }>
  >([]);

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
  });

  const [activeTab, setActiveTab] = useState<'BOARD' | 'CENTRALITY_MATRIX'>('BOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<any | null>(null);

  // Shortest Path modal states
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [pathSourceId, setPathSourceId] = useState('');
  const [pathTargetId, setPathTargetId] = useState('');
  const [highlightedPathIds, setHighlightedPathIds] = useState<Set<string>>(new Set());

  // Add Clue Note Modal State
  const [isClueModalOpen, setIsClueModalOpen] = useState(false);
  const [newClueTitle, setNewClueTitle] = useState('LEAD');
  const [newClueNote, setNewClueNote] = useState('Verify surveillance timestamp.');
  const [newClueColor, setNewClueColor] = useState<'yellow' | 'pink' | 'cyan'>('yellow');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Load Cases
  useEffect(() => {
    api.get('/cases')
      .then((data: any) => {
        const caseList = Array.isArray(data) ? data : data?.cases || [];
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
        const rawEdges = rawEdgesList.filter(
          (e: any) => uniqueNodesMap.has(e.source) && uniqueNodesMap.has(e.target)
        );

        // Include user-pinned clues
        const allBoardNodes = [
          ...rawNodes,
          ...customClues.map((c) => ({
            id: c.id,
            name: c.name,
            type: 'STICKY',
            isStickyNote: true,
            noteColor: c.color,
            noteText: c.noteText,
            role: c.noteText,
            riskScore: 70,
          })),
        ];

        const positions = calculateLayoutPositions(allBoardNodes, rawEdges, currentLayout, spreadScale);

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
                relation: e.label || e.type || 'LINKED_WITH',
                confidence: `${Math.round((e.confidence || 0.85) * 100)}%`,
                details: e.properties?.interaction || e.properties?.cell_tower_id || '',
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
            color:
              typeUpper === 'PERSON'
                ? '#ef4444'
                : typeUpper === 'ORG'
                ? '#3b82f6'
                : typeUpper === 'LOCATION'
                ? '#10b981'
                : typeUpper === 'VEHICLE'
                ? '#06b6d4'
                : typeUpper === 'ACCOUNT'
                ? '#f59e0b'
                : '#a855f7',
            borderClass: typeUpper === 'PERSON' ? 'border-red-500' : 'border-outline-variant',
            textClass: typeUpper === 'PERSON' ? 'text-red-400' : 'text-primary',
            icon:
              typeUpper === 'PERSON'
                ? 'person'
                : typeUpper === 'ORG'
                ? 'corporate_fare'
                : typeUpper === 'LOCATION'
                ? 'location_on'
                : typeUpper === 'VEHICLE'
                ? 'directions_car'
                : typeUpper === 'ACCOUNT'
                ? 'credit_card'
                : 'cell_tower',
            pagerank: props.pagerank || 0.08,
            betweenness: props.betweenness || 0.42,
            degree: nodeAssociates.length,
            community: props.community || `CLUSTER_${(idx % 3) + 1}`,
            evidenceId: props.source_evidence_id
              ? `EV-${props.source_evidence_id.slice(0, 8)}`
              : `EV-VAULT-0${idx + 1}`,
            details:
              props.details ||
              `Extracted entity with ${nodeAssociates.length} cross-referenced relationships in intelligence graph.`,
            rawProperties: props,
            associates: nodeAssociates,
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

        // Build Flow Nodes
        const flowNodes: Node[] = allBoardNodes.map((n) => {
          const pos = positions[n.id] || { x: 150, y: 150 };

          return {
            id: n.id,
            type: 'detectivePin',
            position: pos,
            data: {
              id: n.id,
              name: n.name,
              label: n.name,
              type: n.type,
              role: n.role,
              riskScore: n.riskScore,
              confidence: n.confidence || 92,
              rawProperties: n.rawProperties || {},
              isMapNode: n.isMapNode,
              isStickyNote: n.isStickyNote,
              noteColor: n.noteColor,
              noteText: n.noteText,
            } as any,
          };
        });

        // Build Red Yarn Edges
        const flowEdges: Edge[] = rawEdges.map((e: any, idx: number) => {
          return {
            id: `e-${e.source}-${e.target}-${idx}`,
            source: e.source,
            target: e.target,
            label: e.label || e.type || 'LINKED TO',
            type: 'detectiveYarn',
            data: {
              label: e.label || e.type || 'LINKED TO',
              confidence: e.confidence || 0.9,
              evidence_id: `EV-RED-STRING-${idx + 1}`,
            },
          };
        });

        setRfNodes(flowNodes);
        setRfEdges(flowEdges);

        setTimeout(() => {
          fitView({ padding: 0.25, duration: 800 });
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
  }, [selectedCaseId, currentLayout, spreadScale, customClues, fitView, setRfNodes, setRfEdges]);

  // Handle Dynamic Board Spread Scaling
  const handleToggleSpread = () => {
    const nextScale = spreadScale >= 1.75 ? 1.0 : spreadScale === 1.0 ? 1.35 : 1.75;
    setSpreadScale(nextScale);
    const positions = calculateLayoutPositions(rfNodes, rfEdges, currentLayout, nextScale);
    setRfNodes((prev) =>
      prev.map((n) => ({
        ...n,
        position: positions[n.id] || n.position,
      }))
    );
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 750 });
    }, 100);
    triggerToast(
      `Pinboard expanded: ${
        nextScale === 1.0 ? 'STANDARD' : nextScale === 1.35 ? 'EXPANDED (1.35x)' : 'MAXIMUM SPREAD (1.75x)'
      }`
    );
  };

  // Handle Switch Layout Engine
  const handleApplyLayout = (layout: LayoutType) => {
    setCurrentLayout(layout);
    const positions = calculateLayoutPositions(rfNodes, rfEdges, layout, spreadScale);
    setRfNodes((prev) =>
      prev.map((n) => ({
        ...n,
        position: positions[n.id] || n.position,
      }))
    );
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 750 });
    }, 100);
    triggerToast(`Applied ${layout} board layout.`);
  };

  // Handle Adding a New Sticky Clue Note
  const handleAddClueNote = () => {
    if (!newClueTitle.trim()) return;

    const newClueId = `clue-${Date.now()}`;
    const newClue = {
      id: newClueId,
      name: newClueTitle.toUpperCase(),
      noteText: newClueNote,
      color: newClueColor,
    };

    setCustomClues((prev) => [...prev, newClue]);
    setIsClueModalOpen(false);
    triggerToast(`Pinned new clue: "${newClue.name}"`);
  };

  // Handle Filter Toggles
  const handleToggleFilter = (key: keyof typeof entityFilters) => {
    setEntityFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isTypeVisible = useCallback(
    (type: string) => {
      const t = type.toUpperCase();
      if (t === 'MAP' || t === 'STICKY') return true;
      if (t.includes('PERSON') && !entityFilters.PERSONS) return false;
      if (t.includes('ORG') && !entityFilters.ORGS) return false;
      if (t.includes('LOCATION') && !entityFilters.LOCATIONS) return false;
      if (t.includes('PHONE') && !entityFilters.COMMS) return false;
      if (t.includes('ACCOUNT') && !entityFilters.FINANCIAL) return false;
      if (t.includes('VEHICLE') && !entityFilters.VEHICLES) return false;
      return true;
    },
    [entityFilters]
  );

  // Remove Entity from Canvas handler
  const handleRemoveEntity = (entityId: string) => {
    setRemovedEntityIds((prev) => {
      const next = new Set(prev);
      next.add(entityId);
      return next;
    });
    if (selectedNodeId === entityId) {
      setSelectedNodeId(null);
    }
    triggerToast('Entity unpinned from active board.');
  };

  // Restore All Removed Entities
  const handleRestoreEntities = () => {
    setRemovedEntityIds(new Set());
    triggerToast('Restored all unpinned items.');
  };

  // Connected Neighbors map for Focus Dimming
  const activeFocusNodeId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusNodeId) return null;
    const set = new Set<string>([activeFocusNodeId]);
    domainEdges.forEach((e) => {
      if (e.source === activeFocusNodeId) set.add(e.target);
      if (e.target === activeFocusNodeId) set.add(e.source);
    });
    return set;
  }, [activeFocusNodeId, domainEdges]);

  // Filtered React Flow Nodes & Edges
  const visibleRfNodes = useMemo(() => {
    return rfNodes.map((n) => {
      const data = n.data as unknown as DetectiveNodeData;
      const isRemoved = removedEntityIds.has(n.id);
      const isVisible = isTypeVisible(data.type) && !isRemoved;
      const isSearchMatch =
        !searchQuery.trim() ||
        (data.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (data.role || '').toLowerCase().includes(searchQuery.toLowerCase());

      const isPathHighlight = highlightedPathIds.has(n.id);
      const isDimmed =
        highlightedPathIds.size > 0
          ? !isPathHighlight
          : connectedNodeIds !== null && !connectedNodeIds.has(n.id);

      return {
        ...n,
        type: 'detectivePin',
        hidden: !isVisible || !isSearchMatch,
        selected: selectedNodeId === n.id,
        data: {
          ...data,
          dimmed: isDimmed,
          highlighted: isPathHighlight || n.id === activeFocusNodeId,
        },
      };
    });
  }, [
    rfNodes,
    isTypeVisible,
    removedEntityIds,
    searchQuery,
    selectedNodeId,
    highlightedPathIds,
    connectedNodeIds,
    activeFocusNodeId,
  ]);

  const visibleRfEdges = useMemo(() => {
    const hiddenNodeIds = new Set(visibleRfNodes.filter((n) => n.hidden).map((n) => n.id));
    return rfEdges.map((e) => {
      const isHidden = hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target);
      const isPathEdge = highlightedPathIds.has(e.source) && highlightedPathIds.has(e.target);
      const isDimmed =
        highlightedPathIds.size > 0
          ? !isPathEdge
          : connectedNodeIds !== null && !(connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target));

      return {
        ...e,
        type: 'detectiveYarn',
        hidden: isHidden,
        data: {
          ...e.data,
          highlighted: isPathEdge,
          dimmed: isDimmed,
        },
      };
    });
  }, [rfEdges, visibleRfNodes, highlightedPathIds, connectedNodeIds]);

  // Selected Node Data
  const currentNode = useMemo(() => {
    if (!selectedNodeId) return domainNodes.find((n) => !removedEntityIds.has(n.id)) || null;
    return domainNodes.find((n) => n.id === selectedNodeId) || null;
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

  // Handle Edge Selection
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      const srcNode = domainNodes.find((n) => n.id === edge.source);
      const tgtNode = domainNodes.find((n) => n.id === edge.target);

      setSelectedNodeId(null);
      setSelectedEdgeData({
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        sourceName: srcNode?.name || edge.source,
        targetName: tgtNode?.name || edge.target,
        sourceType: (srcNode?.type || 'ENTITY').toUpperCase(),
        targetType: (tgtNode?.type || 'ENTITY').toUpperCase(),
        label: (edge as any).label || 'LINKED_WITH',
        confidence: (edge as any).data?.confidence || 0.94,
        evidenceId: (edge as any).data?.evidenceId || srcNode?.evidenceId || 'SEIZED_EVIDENCE_VAULT',
        citation: (edge as any).data?.citation || `${srcNode?.name} ➔ ${tgtNode?.name} wiretap log`,
        observations:
          (edge as any).data?.observations ||
          'Direct investigative correlation with red yarn cross-reference.',
      });
    },
    [domainNodes]
  );

  // Handle Associate Traversal
  const handleSelectAssociate = useCallback(
    (targetId: string) => {
      setSelectedNodeId(targetId);
      setSelectedEdgeData(null);

      const targetNode = rfNodes.find((n) => n.id === targetId);
      if (targetNode && setCenter) {
        setCenter(targetNode.position.x + 90, targetNode.position.y + 60, { zoom: 1.15, duration: 800 });
        triggerToast(`Focused on suspect: ${targetNode.data?.name || targetId}`);
      }
    },
    [rfNodes, setCenter]
  );

  // Shortest Path Finder (BFS)
  const handleFindShortestPath = () => {
    if (!pathSourceId || !pathTargetId || pathSourceId === pathTargetId) {
      triggerToast('Please select two distinct entities to trace link.');
      return;
    }

    const adj: Record<string, string[]> = {};
    domainNodes.forEach((n) => {
      adj[n.id] = [];
    });
    domainEdges.forEach((e) => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (adj[e.target]) adj[e.target].push(e.source);
    });

    const queue: Array<{ id: string; path: string[] }> = [{ id: pathSourceId, path: [pathSourceId] }];
    const visited = new Set<string>([pathSourceId]);
    let foundPath: string[] | null = null;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.id === pathTargetId) {
        foundPath = current.path;
        break;
      }
      for (const neighbor of adj[current.id] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, path: [...current.path, neighbor] });
        }
      }
    }

    if (foundPath && foundPath.length > 0) {
      setHighlightedPathIds(new Set(foundPath));
      setIsPathModalOpen(false);
      triggerToast(`Found pathway with ${foundPath.length - 1} red yarn hops!`);
    } else {
      triggerToast('No connected pathway exists between selected entities.');
    }
  };

  const handleClearPathHighlight = () => {
    setHighlightedPathIds(new Set());
    triggerToast('Cleared yarn path highlights.');
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
        <div className="bg-red-950/80 border-b border-red-500/50 px-4 py-2 text-xs font-mono text-red-200 flex items-center justify-between animate-fade-in z-50 shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-red-400">push_pin</span>
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-white">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* ================= TOP DETECTIVE BAR ================= */}
      <header className="flex flex-wrap justify-between items-center w-full px-4 py-2 border-b border-outline-variant bg-[#111622] z-40 shrink-0 gap-2 font-mono text-xs shadow-md">
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="text-xs font-bold tracking-wider text-red-400 uppercase flex items-center gap-1.5 shrink-0 font-typewriter">
            <span className="material-symbols-outlined text-red-500 text-[18px]">push_pin</span>
            INVESTIGATION PINBOARD
          </span>
          <div className="h-4 w-px bg-outline-variant hidden sm:block" />

          {/* Case Selector Dropdown */}
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-outline">CASE:</span>
            {cases.length > 0 ? (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-[#1b2234] border border-outline-variant text-amber-300 px-2.5 py-1 font-mono text-xs focus:outline-none rounded font-bold"
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

        {/* Search & View Switcher */}
        <div className="flex items-center space-x-2">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search suspects & clues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1b2234] border border-outline-variant text-white text-[11px] font-mono pl-7 pr-2 py-1 w-44 focus:w-56 focus:border-red-500 focus:outline-none transition-all rounded"
            />
            <Search size={12} className="absolute left-2 top-2 text-outline pointer-events-none" />
          </div>

          <div className="flex border border-outline-variant p-0.5 bg-[#1b2234] font-mono text-[10px] rounded">
            <button
              onClick={() => setActiveTab('BOARD')}
              className={`px-2.5 py-0.5 transition-colors cursor-pointer font-bold rounded ${
                activeTab === 'BOARD' ? 'bg-red-700 text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              CORKBOARD
            </button>
            <button
              onClick={() => setActiveTab('CENTRALITY_MATRIX')}
              className={`px-2.5 py-0.5 transition-colors cursor-pointer font-bold rounded ${
                activeTab === 'CENTRALITY_MATRIX' ? 'bg-red-700 text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              METRICS TABLE
            </button>
          </div>
        </div>
      </header>

      {/* ================= DETECTIVE ACTIONS TOOLBAR ================= */}
      <section className="flex flex-wrap items-center justify-between px-4 py-1.5 border-b border-outline-variant bg-[#161c2c] gap-2 text-xs font-mono shrink-0">
        {/* Left: Clue actions, Layouts */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {/* Add Clue Note Button */}
          <button
            onClick={() => setIsClueModalOpen(true)}
            className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm text-[11px]"
          >
            <PlusCircle size={12} className="text-amber-400" />
            <span>+ PIN CLUE NOTE</span>
          </button>

          {/* Expand Board Spacing Button */}
          <button
            onClick={handleToggleSpread}
            className={`px-2.5 py-1 border font-bold rounded flex items-center gap-1 cursor-pointer transition-colors text-[10px] ${
              spreadScale > 1.0
                ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                : 'bg-[#0e121d] border-outline-variant hover:border-amber-400 text-amber-300'
            }`}
            title="Expand spacing between cards to spread them out on the corkboard"
          >
            <span className="material-symbols-outlined text-[14px]">unfold_more</span>
            <span>EXPAND ({spreadScale}x)</span>
          </button>

          {/* Layout Arranger */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-outline uppercase font-bold">LAYOUT:</span>
            <div className="flex border border-outline-variant p-0.5 bg-[#0e121d] rounded">
              {(['PINBOARD', 'RADIAL', 'HIERARCHY', 'GRID'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleApplyLayout(mode)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${
                    currentLayout === mode
                      ? 'bg-amber-700 text-white'
                      : 'text-outline hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Red String Shortest Path Finder */}
          <button
            onClick={() => setIsPathModalOpen(true)}
            className="px-2 py-1 bg-[#0e121d] border border-outline-variant hover:border-red-500 text-red-400 font-bold rounded flex items-center gap-1 cursor-pointer transition-colors text-[10px]"
          >
            <Route size={12} className="text-red-500" />
            <span>TRACE YARN LINK</span>
          </button>

          {highlightedPathIds.size > 0 && (
            <button
              onClick={handleClearPathHighlight}
              className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-300 rounded text-[9px] font-bold cursor-pointer animate-pulse"
            >
              CLEAR YARN PATH ({highlightedPathIds.size})
            </button>
          )}
        </div>

        {/* Right: Category Filters */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {(['PERSONS', 'VEHICLES', 'COMMS', 'FINANCIAL', 'LOCATIONS', 'ORGS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleToggleFilter(cat)}
              className={`px-1.5 py-0.5 border text-[9px] font-bold transition-colors cursor-pointer rounded ${
                entityFilters[cat]
                  ? 'border-red-500/60 text-red-400 bg-red-500/10'
                  : 'border-outline-variant text-outline bg-[#0e121d]'
              }`}
            >
              {cat}
            </button>
          ))}

          {removedEntityIds.size > 0 && (
            <button
              onClick={handleRestoreEntities}
              className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-colors flex items-center gap-1 cursor-pointer font-bold rounded text-[9px]"
            >
              <RefreshCw size={10} />
              <span>RESTORE ({removedEntityIds.size})</span>
            </button>
          )}

          <div className="text-[10px] text-outline font-mono pl-2 border-l border-outline-variant">
            PINNED: <strong className="text-amber-300">{visibleRfNodes.filter((n) => !n.hidden).length}</strong>
          </div>
        </div>
      </section>

      {/* ================= MAIN CORKBOARD CANVAS ================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {activeTab === 'BOARD' ? (
          <>
            {/* Investigation Pinboard Canvas (68%) */}
            <div className="w-full lg:w-[68%] border-r border-outline-variant flex flex-col relative overflow-hidden corkboard-canvas corkboard-wood-frame">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-800 font-mono text-xs">
                  <span className="material-symbols-outlined text-3xl animate-spin mb-2 text-red-700">
                    progress_activity
                  </span>
                  <div className="font-bold">PINNING EVIDENCE TO BOARD...</div>
                </div>
              ) : domainNodes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-800 font-mono">
                  <div className="w-12 h-12 rounded-full border border-neutral-600 bg-white/80 flex items-center justify-center mb-3 shadow">
                    <Pin size={24} className="text-red-700" />
                  </div>
                  <div className="text-sm font-bold uppercase">INVESTIGATION PINBOARD EMPTY</div>
                  <p className="text-xs text-neutral-700 mt-1 max-w-md">
                    No suspect photos or evidence records pinned for this case. Ingest FIR documents or wiretaps to populate the board.
                  </p>
                  <button
                    onClick={() => navigate('/evidence-library')}
                    className="mt-4 px-4 py-2 bg-red-800 text-white text-xs font-mono font-bold hover:bg-red-900 transition-colors cursor-pointer rounded shadow"
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
                    edgeTypes={edgeTypes}
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
                    maxZoom={2.4}
                    fitView
                    className="corkboard-canvas"
                  >
                    <Controls className="!m-4" showInteractive={false} />
                    <MiniMap
                      className="!m-4 !border !border-amber-950/80 !bg-[#1c1208]/90"
                      nodeColor={(n) => {
                        const data = n.data as unknown as DetectiveNodeData;
                        const t = (data.type || '').toUpperCase();
                        if (t.includes('PERSON')) return '#dc2626';
                        if (t.includes('STICKY')) return '#fef08a';
                        if (t.includes('VEHICLE')) return '#06b6d4';
                        if (t.includes('PHONE')) return '#c084fc';
                        if (t.includes('ACCOUNT')) return '#fbbf24';
                        return '#10b981';
                      }}
                      zoomable
                      pannable
                    />
                  </ReactFlow>
                </div>
              )}
            </div>

            {/* Right Side Detective Evidence Folder Dossier (32%) */}
            <div className="w-full lg:w-[32%] flex flex-col bg-[#141926] overflow-y-auto p-4 font-mono text-xs border-l border-outline-variant">
              {selectedEdgeData ? (
                /* ================= RED YARN EXPLAINABILITY PANEL ================= */
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-red-500/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-500 text-lg">
                        linear_scale
                      </span>
                      <div>
                        <div className="text-red-400 font-bold text-xs tracking-wider uppercase">
                          RED YARN INVESTIGATION LINK
                        </div>
                        <div className="text-white font-bold text-sm tracking-wide">
                          {selectedEdgeData.label}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEdgeData(null)}
                      className="text-outline hover:text-white p-1 rounded cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {/* Relationship Card */}
                  <div className="p-3 bg-[#0c101a] border border-red-500/30 rounded-lg space-y-3">
                    <div className="text-[10px] uppercase font-bold text-outline">LINKED EVIDENCE ENTITIES</div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      {/* Source Entity */}
                      <div
                        onClick={() => handleSelectAssociate(selectedEdgeData.sourceId)}
                        className="flex-1 p-2 bg-[#171d2b] border border-outline-variant rounded hover:border-red-500 cursor-pointer transition-colors"
                      >
                        <div className="text-[9px] text-outline uppercase">{selectedEdgeData.sourceType}</div>
                        <div className="font-bold text-white truncate">{selectedEdgeData.sourceName}</div>
                      </div>

                      {/* Direction Arrow & Label */}
                      <div className="flex flex-col items-center px-1 text-center shrink-0">
                        <span className="text-[9px] font-bold text-red-400 font-handwriting bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40">
                          {selectedEdgeData.label}
                        </span>
                        <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">arrow_forward</span>
                      </div>

                      {/* Target Entity */}
                      <div
                        onClick={() => handleSelectAssociate(selectedEdgeData.targetId)}
                        className="flex-1 p-2 bg-[#171d2b] border border-outline-variant rounded hover:border-red-500 cursor-pointer transition-colors"
                      >
                        <div className="text-[9px] text-outline uppercase">{selectedEdgeData.targetType}</div>
                        <div className="font-bold text-white truncate">{selectedEdgeData.targetName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="p-3 bg-[#0c101a] border border-outline-variant rounded-lg space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-outline uppercase text-[10px]">CORRELATION:</span>
                      <span className="font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-500/40">
                        {Math.round(selectedEdgeData.confidence * 100)}% CONFIRMED
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-outline uppercase text-[10px]">EVIDENCE RECORD:</span>
                      <span className="text-amber-300 font-bold truncate max-w-[160px]">
                        {selectedEdgeData.evidenceId}
                      </span>
                    </div>
                  </div>

                  {/* Forensic Observations */}
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-outline tracking-wider">
                      INVESTIGATOR NOTES
                    </div>
                    <div className="p-2.5 bg-[#0c101a] border border-outline-variant rounded-lg text-[11px] leading-relaxed text-neutral-300">
                      <p>{selectedEdgeData.observations}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => navigate('/evidence-library')}
                      className="flex-1 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen size={14} />
                      <span>OPEN EVIDENCE VAULT</span>
                    </button>
                    <button
                      onClick={() => setSelectedEdgeData(null)}
                      className="py-2 px-3 bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-white text-xs rounded transition-colors cursor-pointer"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              ) : currentNode ? (
                /* ================= DETECTIVE CASE FILE DOSSIER ================= */
                <div className="space-y-3.5 font-sans">
                  {/* Header Profile */}
                  <div className="p-3.5 bg-[#1a140f] border border-[#8c5828]/60 rounded-xl shadow-md space-y-2">
                    <div className="flex items-center justify-between border-b border-[#8c5828]/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="pushpin-3d pushpin-red" />
                        <span className="font-mono font-bold text-amber-400 text-xs tracking-wider">
                          EXHIBIT // {currentNode.alias || currentNode.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/80 text-red-400 font-mono text-[9px] font-bold tracking-widest uppercase shadow-sm">
                        CLASSIFIED
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 pt-0.5">
                      <div>
                        <div className="text-white font-sans font-bold text-base tracking-tight leading-snug">
                          {currentNode.name}
                        </div>
                        <div className="text-amber-400/90 font-sans font-medium text-xs mt-0.5">
                          {currentNode.role}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveEntity(currentNode.id)}
                        className="p-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 rounded cursor-pointer transition-colors"
                        title="Unpin entity from board"
                      >
                        <EyeOff size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Threat Assessment */}
                  <div className="p-2.5 bg-[#0c101a] border border-outline-variant rounded-lg space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-outline uppercase text-[10px]">THREAT LEVEL:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              currentNode.riskScore >= 75
                                ? 'bg-red-500'
                                : currentNode.riskScore >= 50
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${currentNode.riskScore}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold ${
                            currentNode.riskScore >= 75 ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          {currentNode.riskScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-outline uppercase text-[10px]">CONFIDENCE:</span>
                      <span className="text-amber-300 font-bold">{currentNode.confidence}% MATCH</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-outline uppercase text-[10px]">STRING TIES:</span>
                      <span className="text-white font-bold">{currentNode.degree} connections</span>
                    </div>
                  </div>

                  {/* Extracted Attributes */}
                  {currentNode.rawProperties && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-outline tracking-wider">
                        EXTRACTED DETAILS
                      </div>
                      <div className="p-2 bg-[#0c101a] border border-outline-variant rounded space-y-1 text-[10px]">
                        {Object.entries(currentNode.rawProperties)
                          .filter(
                            ([key]) =>
                              ![
                                'id',
                                'case_id',
                                'updated_at',
                                'properties',
                                'source_evidence_id',
                                'name',
                                'alias',
                                'community',
                                'degree',
                              ].includes(key)
                          )
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between items-start border-b border-outline-variant/30 pb-0.5 last:border-none last:pb-0"
                            >
                              <span className="text-outline uppercase font-mono">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-white font-medium text-right max-w-[60%] break-words">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Connected Graph Associates */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-outline tracking-wider">
                        TIED ENTITIES ({currentNode.associates.length})
                      </span>
                      <span className="text-[9px] text-red-400 font-mono font-bold">FOLLOW STRING ➔</span>
                    </div>

                    {currentNode.associates.length > 0 ? (
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {currentNode.associates.map((assoc, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectAssociate(assoc.id)}
                            className="p-1.5 bg-[#0c101a] border border-outline-variant hover:border-red-500 hover:bg-[#161d2d] transition-all cursor-pointer rounded flex items-center justify-between text-[10px] group shadow-sm"
                          >
                            <div className="overflow-hidden mr-2">
                              <div className="text-white font-bold truncate group-hover:text-red-400 transition-colors">
                                {assoc.name}
                              </div>
                              <div className="text-[8px] text-outline flex items-center gap-1">
                                <span className="text-red-400 font-semibold">{assoc.relation}</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono px-1 py-0.2 bg-neutral-800 text-amber-300 shrink-0 rounded font-bold">
                              {assoc.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-[#0c101a] border border-outline-variant text-[10px] text-outline italic rounded">
                        Isolated node (no string ties).
                      </div>
                    )}
                  </div>

                  {/* Export Cypher */}
                  <div className="pt-1">
                    <button
                      onClick={handleExportCypher}
                      className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-outline-variant text-neutral-200 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded font-bold"
                    >
                      <Terminal size={13} className="text-amber-400" />
                      <span>EXPORT CYPHER</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
                  <Pin size={28} className="text-red-500/50 mb-2" />
                  <div>Click any pinned card on the board to inspect dossier.</div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Metrics Matrix View */
          <div className="flex-1 overflow-y-auto p-4 bg-surface font-mono">
            <div className="border border-outline-variant bg-surface-container-lowest overflow-hidden rounded">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-outline text-[10px] uppercase tracking-wider h-8">
                    <th className="px-3 py-2 font-semibold">ENTITY / SUSPECT</th>
                    <th className="px-3 py-2 font-semibold">EXHIBIT TYPE</th>
                    <th className="px-3 py-2 font-semibold text-right">PAGERANK</th>
                    <th className="px-3 py-2 font-semibold text-right">BETWEENNESS</th>
                    <th className="px-3 py-2 font-semibold text-right">STRING DEGREE</th>
                    <th className="px-3 py-2 font-semibold text-center">THREAT SCORE</th>
                    <th className="px-3 py-2 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {domainNodes
                    .filter((n) => !removedEntityIds.has(n.id))
                    .map((n, idx) => (
                      <tr
                        key={`${n.id}-${idx}`}
                        onClick={() => {
                          setSelectedNodeId(n.id);
                          setActiveTab('BOARD');
                          handleSelectAssociate(n.id);
                        }}
                        className="hover:bg-surface-container-high/40 cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-2 font-bold text-red-400">{n.name}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 bg-surface-container border border-outline-variant text-[10px] font-bold text-on-surface uppercase rounded">
                            {n.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{n.pagerank.toFixed(4)}</td>
                        <td className="px-3 py-2 text-right font-mono">{n.betweenness.toFixed(4)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-amber-400">{n.degree}</td>
                        <td className="px-3 py-2 text-center">
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
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNodeId(n.id);
                              setActiveTab('BOARD');
                              handleSelectAssociate(n.id);
                            }}
                            className="text-red-400 hover:text-red-300 text-xs font-bold"
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

      {/* ================= MODAL: PIN STICKY CLUE ================= */}
      {isClueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
          <div className="w-full max-w-md bg-[#1c140e] border border-amber-700/80 rounded-lg shadow-2xl p-5 space-y-3.5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-amber-700/50 pb-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span className="pushpin-3d pushpin-red" />
                <span>PIN STICKY CLUE</span>
              </div>
              <button onClick={() => setIsClueModalOpen(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-amber-300/80 block mb-1">CLUE TITLE / KEYWORD</label>
                <input
                  type="text"
                  value={newClueTitle}
                  onChange={(e) => setNewClueTitle(e.target.value)}
                  placeholder="e.g. HOW?!, WITH WHOM?, ALIBI FAKE?"
                  className="w-full bg-[#0c0906] border border-amber-700/50 px-3 py-1.5 text-white rounded font-marker text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-amber-300/80 block mb-1">INVESTIGATIVE NOTE</label>
                <textarea
                  value={newClueNote}
                  onChange={(e) => setNewClueNote(e.target.value)}
                  rows={2}
                  placeholder="Brief lead or theory..."
                  className="w-full bg-[#0c0906] border border-amber-700/50 px-3 py-1.5 text-amber-100 rounded font-handwriting text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-amber-300/80 block mb-1">NOTE COLOR</label>
                <div className="flex gap-2">
                  {(['yellow', 'pink', 'cyan'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewClueColor(color)}
                      className={`flex-1 py-1 rounded font-bold uppercase text-[9px] border transition-all ${
                        newClueColor === color
                          ? 'ring-2 ring-white border-white scale-105'
                          : 'opacity-70 hover:opacity-100'
                      } ${
                        color === 'yellow'
                          ? 'bg-yellow-300 text-neutral-900 border-yellow-500'
                          : color === 'pink'
                          ? 'bg-pink-300 text-neutral-900 border-pink-500'
                          : 'bg-cyan-300 text-neutral-900 border-cyan-500'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsClueModalOpen(false)}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-300 hover:text-white rounded"
              >
                CANCEL
              </button>
              <button
                onClick={handleAddClueNote}
                className="px-4 py-1.5 bg-red-700 text-white font-bold rounded hover:bg-red-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Pin size={12} />
                <span>PIN TO BOARD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortest Path Finder Modal */}
      {isPathModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
          <div className="w-full max-w-md bg-[#161c2c] border border-outline-variant rounded-lg shadow-2xl p-5 space-y-3.5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <Route size={15} />
                <span>TRACE RED YARN PATHWAY</span>
              </div>
              <button onClick={() => setIsPathModalOpen(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">ORIGIN SUSPECT / EXHIBIT</label>
                <select
                  value={pathSourceId}
                  onChange={(e) => setPathSourceId(e.target.value)}
                  className="w-full bg-[#0c101a] border border-outline-variant px-3 py-1.5 text-white rounded focus:border-red-500 focus:outline-none"
                >
                  {domainNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">DESTINATION TARGET</label>
                <select
                  value={pathTargetId}
                  onChange={(e) => setPathTargetId(e.target.value)}
                  className="w-full bg-[#0c101a] border border-outline-variant px-3 py-1.5 text-white rounded focus:border-red-500 focus:outline-none"
                >
                  {domainNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsPathModalOpen(false)}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-outline hover:text-white rounded"
              >
                CANCEL
              </button>
              <button
                onClick={handleFindShortestPath}
                className="px-4 py-1.5 bg-red-700 text-white font-bold rounded hover:bg-red-800 transition-colors cursor-pointer"
              >
                STRETCH RED STRING
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
