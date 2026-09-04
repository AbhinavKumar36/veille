import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../api/client';
import { GraphSkeleton } from './skeletons/GraphSkeleton';

interface NetworkExplorerProps {
  caseId?: string;
}

const TYPE_COLORS: Record<string, { color: string, type: 'polaroid' | 'sticky' }> = {
  person: { color: '#ffffff', type: 'polaroid' },
  organization: { color: '#fef08a', type: 'sticky' }, // Yellow
  phone: { color: '#bfdbfe', type: 'sticky' }, // Blue
  account: { color: '#bfdbfe', type: 'sticky' },
  vehicle: { color: '#bbf7d0', type: 'sticky' }, // Green
  location: { color: '#fef08a', type: 'sticky' }, // Yellow
  event: { color: '#fbcfe8', type: 'sticky' }, // Pink
  default: { color: '#fef08a', type: 'sticky' },
};

const DEFAULT_FALLBACK_GRAPH = {
  nodes: [
    { id: 'Person_RajeshKumar', name: 'Rajesh Kumar (Leader)', type: 'person', data: { properties: { role: 'Cartel Boss', threat: 'CRITICAL', status: 'WANTED' } } },
    { id: 'Person_VikramMalhotra', name: 'Vikram Malhotra', type: 'person', data: { properties: { role: 'Hawala Operator', threat: 'HIGH', status: 'MONITORED' } } },
    { id: 'Person_AmitabhSen', name: 'Amitabh Sen', type: 'person', data: { properties: { role: 'Port Logistics Head', threat: 'MEDIUM', status: 'ACTIVE' } } },
    { id: 'Org_ShadowRing', name: 'Shadow Ring Syndicate', type: 'organization', data: { properties: { sector: 'Narcotics & Smuggling', jurisdiction: 'West Zone' } } },
    { id: 'Acc_Swiss9876', name: 'Swiss Acct #9876', type: 'account', data: { properties: { bank: 'Geneva Private', balance: 'USD 4.5M' } } },
    { id: 'Phone_9811099231', name: '+91-9811099231', type: 'phone', data: { properties: { carrier: 'Airtel', status: 'Intercept Active' } } },
    { id: 'Veh_MH02DX9912', name: 'Black Fortuner (MH02DX9912)', type: 'vehicle', data: { properties: { registered_to: 'Amitabh Sen', color: 'Black' } } },
    { id: 'Loc_SafehouseAlpha', name: 'Safehouse Alpha (Andheri)', type: 'location', data: { properties: { coordinates: '19.1136, 72.8697' } } },
    { id: 'Evt_HawalaTransfer', name: 'Hawala Transfer INR 4.5 Cr', type: 'event', data: { properties: { date: '2026-08-15', amount: 'INR 45,000,000' } } },
  ],
  links: [
    { source: 'Person_RajeshKumar', target: 'Org_ShadowRing', label: 'LEADS', confidence: 0.98 },
    { source: 'Person_VikramMalhotra', target: 'Org_ShadowRing', label: 'FINANCES', confidence: 0.94 },
    { source: 'Person_AmitabhSen', target: 'Org_ShadowRing', label: 'LOGISTICS', confidence: 0.89 },
    { source: 'Person_RajeshKumar', target: 'Person_VikramMalhotra', label: 'COMMUNICATES_WITH', confidence: 0.96 },
    { source: 'Person_VikramMalhotra', target: 'Acc_Swiss9876', label: 'OWNS', confidence: 0.95 },
    { source: 'Person_RajeshKumar', target: 'Phone_9811099231', label: 'OWNS', confidence: 0.99 },
    { source: 'Person_AmitabhSen', target: 'Veh_MH02DX9912', label: 'OWNS', confidence: 0.92 },
    { source: 'Org_ShadowRing', target: 'Loc_SafehouseAlpha', label: 'LOCATED_AT', confidence: 0.88 },
    { source: 'Person_VikramMalhotra', target: 'Evt_HawalaTransfer', label: 'PARTICIPATED_IN', confidence: 0.97 },
  ]
};

const NetworkExplorer: React.FC<NetworkExplorerProps> = ({ caseId: propCaseId }) => {
  const location = useLocation();
  const routeCaseId = (location.state as any)?.caseId;
  const initialCaseId = propCaseId || routeCaseId || '11111111-1111-1111-1111-111111111111';

  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [caseTitle, setCaseTitle] = useState<string>((location.state as any)?.caseTitle || '');
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Load available cases
  useEffect(() => {
    api.get('/cases')
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          setCasesList(data);
          if (!propCaseId && !routeCaseId) {
            // Only auto-select first case if none was passed in
            // (don't override the one we got from router state)
          }
        }
      })
      .catch(() => {
        setCasesList([
          { id: '11111111-1111-1111-1111-111111111111', title: 'Operation Nightfall Syndicate' },
          { id: '22222222-2222-2222-2222-222222222222', title: 'Port Authority Smuggling' },
          { id: '33333333-3333-3333-3333-333333333333', title: 'Unidentified Network Intrusion - Sector 7' }
        ]);
      });
  }, [propCaseId, routeCaseId]);

  // Handle resizing for full-viewport canvas using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchGraphData = (cId: string) => {
    setLoading(true);
    api.get(`/graph/${cId}`)
      .then((data: any) => {
        if (data && data.nodes && data.nodes.length > 0) {
          const formattedData = {
            nodes: data.nodes.map((n: any) => ({
              id: n.id,
              name: n.data?.label || n.name || n.label || n.id,
              type: (n.data?.type || n.type || 'default').toLowerCase(),
              properties: n.data?.properties || n.properties || {},
            })),
            links: (data.edges || []).map((e: any) => ({
              id: e.id,
              source: e.source_id || e.source,
              target: e.target_id || e.target,
              label: e.label || e.type || '',
              confidence: e.data?.confidence || e.confidence || 0.9,
            }))
          };
          setGraphData(formattedData);
        } else {
          setGraphData({ nodes: [], links: [] });
        }
      })
      .catch((err) => {
        console.warn('Backend graph API fallback:', err);
        setGraphData({ nodes: [], links: [] });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedCaseId) {
      fetchGraphData(selectedCaseId);
    }
  }, [selectedCaseId]);

  const handleNodeHover = (node: any) => {
    setHoverNode(node || null);
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();
    
    if (node) {
      newHighlightNodes.add(node.id);
      if (filteredGraph?.links) {
        filteredGraph.links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          if (sourceId === node.id || targetId === node.id) {
            newHighlightLinks.add(link.id || `${sourceId}-${targetId}`);
            newHighlightNodes.add(sourceId);
            newHighlightNodes.add(targetId);
          }
        });
      }
    }
    
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  };

  const handleLinkHover = (link: any) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (link) {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      newHighlightLinks.add(link.id || `${sourceId}-${targetId}`);
      newHighlightNodes.add(sourceId);
      newHighlightNodes.add(targetId);
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  };

  // Node rendering
  const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const nodeType = (node.type || 'default').toLowerCase();
    const style = TYPE_COLORS[nodeType] || TYPE_COLORS.default;
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoverNode && hoverNode.id === node.id;

    // We can add a slight random rotation to each node to make it look like haphazardly pinned paper
    // Use node.id to generate a deterministic pseudo-random angle
    const seed = node.id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
    const angle = ((seed % 20) - 10) * (Math.PI / 180);

    const baseSize = (isSelected || isHovered) ? 55 : 45; // Restored massive sizes
    const label = node.name || node.id;
    
    // Dim unconnected nodes on hover
    let opacity = 1;
    if (hoverNode && !highlightNodes.has(node.id)) {
      opacity = 0.4;
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Translate and rotate for the pinned paper effect
    ctx.translate(node.x, node.y);
    ctx.rotate(angle);

    // Draw Drop Shadow for the paper
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    if (style.type === 'polaroid') {
      // Draw Polaroid Frame
      ctx.fillStyle = '#f8fafc'; // slightly off-white photo paper
      ctx.fillRect(-baseSize, -baseSize, baseSize * 2, baseSize * 2.5);
      
      // Draw Inner Photo area (dark grey placeholder)
      ctx.shadowColor = 'transparent'; // reset shadow for inner drawing
      ctx.fillStyle = '#334155';
      ctx.fillRect(-baseSize + 2, -baseSize + 2, baseSize * 2 - 4, baseSize * 1.6);
      
      // Silhouette placeholder (simple circle + arc)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, -baseSize + 6, baseSize * 0.4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -baseSize + 16, baseSize * 0.7, Math.PI, 0);
      ctx.fill();
      
      // Draw text on polaroid bottom margin
      const fontSize = Math.max(16 / globalScale, 5);
      ctx.font = `bold ${fontSize}px Kalam, "Permanent Marker", cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1e293b'; // dark ink
      ctx.fillText(label, 0, baseSize * 1.2 + 2);
    } else {
      // Draw Sticky Note
      ctx.fillStyle = style.color;
      ctx.fillRect(-baseSize * 1.2, -baseSize * 0.8, baseSize * 2.4, baseSize * 1.6);
      
      // Write text on sticky note
      ctx.shadowColor = 'transparent';
      const fontSize = Math.max(16 / globalScale, 6);
      ctx.font = `${fontSize}px Kalam, "Permanent Marker", cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1e293b'; // dark ink

      // Simple text wrapping hack (split in middle if too long)
      const words = label.split(' ');
      if (words.length > 2) {
        ctx.fillText(words.slice(0, 2).join(' '), 0, -2);
        ctx.fillText(words.slice(2).join(' '), 0, fontSize);
      } else {
        ctx.fillText(label, 0, 0);
      }
    }

    // Draw the Pin at the top center
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.beginPath();
    ctx.arc(0, -baseSize * 0.9 + 1, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#dc2626'; // red pin head
    ctx.fill();
    // pin shine
    ctx.beginPath();
    ctx.arc(-0.5, -baseSize * 0.9 + 0.5, 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
    
    ctx.restore();
  };

  // Draw edge relationship labels on the canvas
  const paintLink = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const sourceNode = typeof link.source === 'object' ? link.source : null;
    const targetNode = typeof link.target === 'object' ? link.target : null;
    if (!sourceNode || !targetNode || !link.label) return;

    const linkId = link.id || `${sourceNode.id}-${targetNode.id}`;
    const isHovered = highlightLinks.has(linkId);

    if (!isHovered && globalScale < 1.0) return;

    let opacity = 1;
    if (hoverNode) {
      opacity = isHovered ? 1 : 0.2;
    }

    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;
    const fontSize = Math.max(12 / globalScale, 4);

    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Draw string label like a tiny scrap of paper stuck to the string
    ctx.font = `${fontSize}px Kalam, "Permanent Marker", cursive`;
    const textWidth = ctx.measureText(link.label).width;
    ctx.fillStyle = '#fef08a'; // yellow sticky paper
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillRect(midX - textWidth / 2 - 2, midY - fontSize / 2 - 1, textWidth + 4, fontSize + 2);

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(link.label, midX, midY);
    ctx.restore();
  };

  const filteredGraph = React.useMemo(() => {
    if (!graphData) return null;
    if (filterType === 'ALL') return graphData;
    const matchedNodes = graphData.nodes.filter((n: any) => n.type === filterType.toLowerCase());
    const matchedNodeIds = new Set(matchedNodes.map((n: any) => n.id));
    const matchedLinks = graphData.links.filter((l: any) => 
      matchedNodeIds.has(typeof l.source === 'object' ? l.source.id : l.source) &&
      matchedNodeIds.has(typeof l.target === 'object' ? l.target.id : l.target)
    );
    return { nodes: matchedNodes, links: matchedLinks };
  }, [graphData, filterType]);

  // Adjust physics simulation to prevent overlap on the corkboard
  useEffect(() => {
    if (fgRef.current && filteredGraph) {
      fgRef.current.d3Force('charge').strength(-3500); // Much stronger repulsion for massive nodes
      fgRef.current.d3Force('link').distance(400);     // Much longer links
    }
  }, [filteredGraph]);


  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-4 bg-surface-container-lowest">
      {/* Top Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container/60 p-4 rounded-lg border border-outline-variant/50 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[28px]">hub</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Network Explorer</h2>
          </div>
          <p className="text-on-surface-variant font-body-sm mt-1">Multi-entity relationship & intelligence link analysis</p>
        </div>

        {/* Case Selector and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {casesList.length > 0 && (
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded px-3 py-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">folder</span>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-transparent text-on-surface font-body-sm focus:outline-none cursor-pointer pr-2"
              >
                {casesList.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-surface-container text-on-surface">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Filter */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
            <input
              type="text"
              placeholder="Search entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded pl-8 pr-3 py-1.5 font-body-sm text-on-surface focus:border-primary focus:outline-none w-44"
            />
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded p-1">
            {['ALL', 'PERSON', 'ORGANIZATION', 'PHONE', 'ACCOUNT'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 text-[11px] rounded font-label-caps transition-colors ${
                  filterType === t 
                    ? 'bg-primary text-on-primary font-bold shadow-[0_0_8px_rgba(0,229,255,0.4)]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => fgRef.current?.zoomToFit(400, 40)}
            className="bg-surface-variant text-on-surface px-3 py-2 rounded font-label-caps text-label-caps hover:bg-surface-variant/80 transition-colors flex items-center gap-1.5"
            title="Recenter Camera"
          >
            <span className="material-symbols-outlined text-[16px]">center_focus_strong</span>
            CENTER
          </button>

          <button
            onClick={toggleFullscreen}
            className="bg-surface-variant text-on-surface px-3 py-2 rounded font-label-caps text-label-caps hover:bg-surface-variant/80 transition-colors flex items-center gap-1.5"
            title="Toggle Fullscreen"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
            {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
          </button>

          <button
            onClick={() => fetchGraphData(selectedCaseId)}
            className="bg-primary text-on-primary px-3.5 py-2 rounded font-label-caps text-label-caps hover:bg-primary-fixed transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            SYNC
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="flex-1 flex gap-4 min-h-0 relative">
        <div 
          ref={containerRef}
          className="flex-1 border border-outline-variant rounded-lg relative overflow-hidden shadow-inner"
          style={{
            backgroundColor: '#d6d3d1',
            backgroundImage: 'url(/corkboard.jpg)',
            backgroundSize: '300px', 
            backgroundRepeat: 'repeat',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.6)'
          }}
        >
          {loading ? (
            <GraphSkeleton />
          ) : filteredGraph ? (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={filteredGraph}
              nodeCanvasObject={paintNode}
              nodeRelSize={55}
              nodeLabel={() => ''} // Tooltips are not strictly needed with labels, but disable native tooltip to avoid clutter
              linkColor={(link: any) => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;
                const linkId = link.id || `${sId}-${tId}`;
                const isHigh = hoverNode ? highlightLinks.has(linkId) : false;
                const isDimmed = hoverNode && !isHigh;
                const baseColor = 'rgba(220, 38, 38, 0.85)'; // Dark red string
                
                if (isDimmed) return 'rgba(220, 38, 38, 0.15)';
                if (isHigh) return 'rgba(239, 68, 68, 1)'; // Brighter red when highlighted
                return baseColor;
              }}
              linkWidth={(link: any) => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;
                const linkId = link.id || `${sId}-${tId}`;
                return (hoverNode && highlightLinks.has(linkId)) ? 2.5 : 1.5;
              }}
              linkLineDash={(link: any) => []} // Real strings are solid
              linkDirectionalParticles={0} // No particles on corkboard
              linkCanvasObjectMode={() => 'after'}
              linkCanvasObject={paintLink}
              backgroundColor="transparent"
              cooldownTicks={120}
              onNodeClick={(node: any) => setSelectedNode(node)}
              onNodeHover={handleNodeHover}
              onLinkHover={handleLinkHover}
              onBackgroundClick={() => {
                setSelectedNode(null);
                setHoverNode(null);
                setHighlightNodes(new Set());
                setHighlightLinks(new Set());
              }}
              onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
            />
          ) : null}

          {/* Graph Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-[#fdfbf7]/90 backdrop-blur-md border-2 border-stone-300 rounded p-3 flex flex-col gap-2 shadow-[2px_3px_5px_rgba(0,0,0,0.2)] font-['Kalam'] text-sm text-stone-800 rotate-1">
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-white border border-stone-300 shadow-sm"></span> People</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#fef08a] shadow-sm"></span> Organizations & Locations</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#bfdbfe] shadow-sm"></span> Devices & Accounts</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#fbcfe8] shadow-sm"></span> Events</span>
            <span className="flex items-center gap-2 mt-1 border-t border-stone-300 pt-2"><span className="w-4 h-0.5 bg-red-600"></span> Connection</span>
            <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-red-600 shadow-[1px_1px_2px_rgba(0,0,0,0.4)]"></div>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <aside className="w-80 bg-surface-container border border-outline-variant rounded-lg p-4 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">fingerprint</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Entity Dossier</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div>
              <div className="text-[10px] font-label-caps uppercase text-primary tracking-wider">Entity Name</div>
              <div className="text-body-md font-bold text-on-surface mt-0.5">{selectedNode.name}</div>
            </div>

            <div>
              <div className="text-[10px] font-label-caps uppercase text-on-surface-variant tracking-wider">Classification</div>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-data-code uppercase font-bold bg-primary/20 text-primary border border-primary/30">
                {selectedNode.type}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-label-caps uppercase text-on-surface-variant tracking-wider">Unique Node ID</div>
              <div className="text-data-code font-data-code text-on-surface-variant mt-0.5 break-all">{selectedNode.id}</div>
            </div>

            {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
              <div className="border-t border-outline-variant/60 pt-3">
                <div className="text-[10px] font-label-caps uppercase text-on-surface-variant tracking-wider mb-2">Properties & Intelligence</div>
                <div className="space-y-1.5">
                  {Object.entries(selectedNode.properties).map(([key, val]: any) => (
                    <div key={key} className="bg-surface-container-low p-2 rounded border border-outline-variant/40 flex flex-col gap-0.5 text-xs">
                      <span className="text-on-surface-variant font-label-caps text-[10px] uppercase">{key.replace(/_/g, ' ')}</span>
                      <span className="text-on-surface font-data-code break-words">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default NetworkExplorer;
