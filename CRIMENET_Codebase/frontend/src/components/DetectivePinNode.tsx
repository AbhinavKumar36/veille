import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  User,
  Car,
  Phone,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  Fingerprint,
  FileText,
  HelpCircle,
  Flame,
} from 'lucide-react';

export interface DetectiveNodeData {
  id: string;
  name: string;
  label?: string;
  type: string;
  role?: string;
  riskScore?: number;
  confidence?: number;
  rawProperties?: Record<string, any>;
  selected?: boolean;
  lod?: 'compact' | 'medium' | 'full';
  dimmed?: boolean;
  highlighted?: boolean;
  pinType?: 'red' | 'black' | 'gold';
  stampText?: string;
  rotation?: number;
  isMapNode?: boolean;
  isStickyNote?: boolean;
  noteColor?: 'yellow' | 'pink' | 'cyan';
  noteText?: string;
  [key: string]: unknown;
}

// Generate consistent pseudo-random tilt for natural detective pinboard realism
const getPseudoRandomRotation = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const angles = [-3.5, -2, -1, 0.5, 1.5, 2.8, -2.2, 3.2];
  return angles[Math.abs(hash) % angles.length];
};

export const DetectivePinNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as DetectiveNodeData;
  const score = nodeData.riskScore ?? 50;
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted || selected;
  const typeUpper = (nodeData.type || 'PERSON').toUpperCase();

  // Deterministic tilt angle for realistic detective crazy-wall feel
  const rotation = useMemo(() => {
    return nodeData.rotation ?? getPseudoRandomRotation(id);
  }, [id, nodeData.rotation]);

  // Determine Stamp Text (e.g. "MISSING", "SUSPECT", "DEAD", "LEAD", "EVIDENCE")
  const stamp = useMemo(() => {
    if (nodeData.stampText) return nodeData.stampText;
    if (score >= 85) return 'TARGET // TOP PRIORITY';
    if (score >= 70) return 'SUSPECT';
    if (typeUpper.includes('LOCATION')) return 'CRIME SCENE';
    if (typeUpper.includes('PHONE') || typeUpper.includes('COMM')) return 'WIRETAP INTERCEPT';
    if (typeUpper.includes('ACCOUNT') || typeUpper.includes('FINANC')) return 'HAWALA TRAIL';
    if (typeUpper.includes('VEHICLE')) return 'GETAWAY VEHICLE';
    if (typeUpper.includes('ORG')) return 'FRONT ORGANIZATION';
    return 'EVIDENCE RECORD';
  }, [nodeData.stampText, score, typeUpper]);

  // Pushpin Color
  const pinColorClass = score >= 75 ? 'pushpin-red' : score >= 50 ? 'pushpin-black' : 'pushpin-gold';

  // Universal Handles originating right under the top pushpin for natural string connection
  const handles = (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-red-600 !border-2 !border-white !top-1 !left-1/2 !-translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity z-50 cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-red-600 !border-2 !border-white !bottom-1 !left-1/2 !-translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity z-50 cursor-crosshair"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-red-600 !border-2 !border-white !top-1/2 !-translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity z-50 cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-red-600 !border-2 !border-white !top-1/2 !-translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity z-50 cursor-crosshair"
      />
    </>
  );

  // ================= 1. CENTRAL TACTICAL FOLDED MAP NODE =================
  if (nodeData.isMapNode || typeUpper === 'MAP' || typeUpper === 'CENTRAL_MAP') {
    return (
      <div
        className={`relative w-[280px] rounded bg-[#e8e4d9] p-2.5 border border-[#9e9580] shadow-xl transition-transform duration-200 select-none font-sans ${
          isDimmed ? 'opacity-30 grayscale' : 'opacity-100'
        } ${isHighlighted ? 'ring-2 ring-red-500 scale-105' : 'hover:scale-[1.02]'}`}
        style={{
          transform: `rotate(${rotation * 0.3}deg)`,
          boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
        }}
      >
        {handles}

        {/* 2 Pushpins at Top Corners */}
        <div className="absolute -top-2 -left-2 pushpin-3d pushpin-red pin-shadow z-20" />
        <div className="absolute -top-2 -right-2 pushpin-3d pushpin-black pin-shadow z-20" />

        {/* Map Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#c2b9a3] text-[10px] font-bold text-neutral-800">
          <div className="flex items-center gap-1 font-mono">
            <span className="text-red-700 font-bold">● TACTICAL MAP</span>
            <span className="text-neutral-500 text-[9px]">[SECTOR 4]</span>
          </div>
          <span className="font-mono text-[8px] bg-red-100 text-red-800 px-1 py-0.2 border border-red-300 font-bold rounded">
            SCENE
          </span>
        </div>

        {/* Map Visual Graphic */}
        <div className="relative mt-1.5 h-32 rounded bg-[#d6decb] border border-[#a8b89d] overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(#97a989 1px, transparent 1px), linear-gradient(90deg, #97a989 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 280 130">
            <path
              d="M 80,0 C 110,40 70,80 130,110 C 160,130 170,140 190,160"
              fill="none"
              stroke="#5b8bb5"
              strokeWidth="18"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 0,65 Q 140,60 280,75"
              fill="none"
              stroke="#e2d4a8"
              strokeWidth="8"
              strokeDasharray="3 2"
            />
          </svg>

          {/* Incident Spot 1 */}
          <div className="absolute top-5 left-8 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full border-2 border-red-600 flex items-center justify-center bg-red-600/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            </div>
            <span className="mt-0.5 text-[8px] font-mono font-bold text-red-700 bg-white/90 px-1 rounded shadow-xs">
              ORIGIN
            </span>
          </div>

          {/* Incident Spot 2 (Target X) */}
          <div className="absolute top-10 right-10 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full border-2 border-red-600 flex items-center justify-center bg-red-600/20">
              <span className="text-red-700 font-mono text-[10px] font-black">✕</span>
            </div>
            <span className="mt-0.5 text-[8px] font-mono font-bold text-red-800 bg-yellow-200 px-1 rounded border border-red-400 shadow-xs">
              TARGET
            </span>
          </div>
        </div>

        {/* Map Footer Note */}
        <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-neutral-700 font-medium">
          <span>COORDINATES: 28.6139° N, 77.2090° E</span>
          <span className="text-red-700 font-mono font-bold text-[9px]">ACTIVE SCENE</span>
        </div>
      </div>
    );
  }

  // ================= 2. DETECTIVE STICKY CLUE NOTE =================
  if (nodeData.isStickyNote || typeUpper === 'STICKY' || typeUpper === 'NOTE') {
    const noteClass =
      nodeData.noteColor === 'pink' ? 'sticky-pink' : nodeData.noteColor === 'cyan' ? 'sticky-cyan' : 'sticky-yellow';

    return (
      <div
        className={`relative w-44 p-2.5 rounded-sm ${noteClass} transition-transform duration-200 select-none cursor-pointer font-sans ${
          isDimmed ? 'opacity-30' : 'opacity-100'
        } ${isHighlighted ? 'ring-2 ring-red-600 scale-105 z-30' : 'hover:scale-105'}`}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {handles}

        {/* Top Center Pushpin */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 pushpin-3d pushpin-red pin-shadow z-20" />

        <div className="pt-1.5 text-center">
          <div className="font-sans font-bold text-sm text-neutral-900 tracking-tight leading-tight">
            {nodeData.name || 'NOTE'}
          </div>
          <div className="mt-1 font-sans font-medium text-xs text-red-800 leading-snug">
            {nodeData.noteText || nodeData.role || 'Investigative lead'}
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. POLAROID SUSPECT PHOTO (PERSON / SUSPECT / LEAD) =================
  if (typeUpper.includes('PERSON') || typeUpper.includes('SUSPECT') || typeUpper.includes('LEAD')) {
    const avatarSeed = nodeData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}&backgroundColor=transparent`;

    return (
      <div
        className={`relative w-48 p-2.5 polaroid-paper rounded-sm transition-all duration-200 select-none cursor-pointer font-sans ${
          isDimmed ? 'opacity-25 grayscale' : 'opacity-100'
        } ${isHighlighted ? 'ring-2 ring-red-600 scale-105 z-30 shadow-xl' : 'hover:scale-105'}`}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {handles}

        {/* 3D Pushpin at Top Center */}
        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 pushpin-3d ${pinColorClass} pin-shadow z-20`} />

        {/* Polaroid Photo Box */}
        <div className="relative w-full h-28 bg-[#18202c] rounded-sm overflow-hidden border border-neutral-300 flex items-center justify-center group">
          <img
            src={avatarUrl}
            alt={nodeData.name}
            className="w-20 h-20 object-contain filter contrast-125 group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <User size={36} className="text-neutral-500 absolute -z-10" />

          {/* Red Stamp Badge */}
          <div className="absolute bottom-1 right-1 z-10">
            <span
              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                score >= 80
                  ? 'bg-red-700 text-white shadow'
                  : score >= 60
                  ? 'bg-amber-700 text-white shadow'
                  : 'bg-neutral-800 text-neutral-200'
              }`}
            >
              {stamp}
            </span>
          </div>

          {/* Threat Score */}
          {score > 0 && (
            <div className="absolute top-1 right-1 bg-black/75 text-red-400 font-mono text-[8px] font-bold px-1 rounded border border-red-500/30 flex items-center gap-0.5">
              <span>{score}% THREAT</span>
            </div>
          )}
        </div>

        {/* Polaroid Bottom Label Area */}
        <div className="pt-2 pb-0.5">
          <div className="font-sans font-bold text-xs text-neutral-900 tracking-tight truncate" title={nodeData.name}>
            {nodeData.name}
          </div>
          <div className="font-sans font-medium text-[11px] text-neutral-600 truncate mt-0.5" title={nodeData.role || stamp}>
            {nodeData.role || stamp}
          </div>
        </div>
      </div>
    );
  }

  // ================= 4. FORENSIC EVIDENCE / POLICE REPORT / TORN PAPER =================
  const isComms = typeUpper.includes('PHONE') || typeUpper.includes('COMM');
  const isFinancial = typeUpper.includes('ACCOUNT') || typeUpper.includes('FINANC');
  const isVehicle = typeUpper.includes('VEHICLE');
  const isLocation = typeUpper.includes('LOCATION');

  return (
    <div
      className={`relative w-48 p-2.5 newspaper-paper rounded-sm transition-all duration-200 select-none cursor-pointer font-sans ${
        isDimmed ? 'opacity-25 grayscale' : 'opacity-100'
      } ${isHighlighted ? 'ring-2 ring-red-600 scale-105 z-30 shadow-xl' : 'hover:scale-105'}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {handles}

      {/* Top Pushpin */}
      <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 pushpin-3d ${pinColorClass} pin-shadow z-20`} />

      {/* Header Document Strip */}
      <div className="flex items-center justify-between pb-1 border-b border-neutral-400 font-mono text-[9px]">
        <div className="flex items-center gap-1 font-bold text-neutral-800 uppercase">
          {isComms ? (
            <Phone size={10} className="text-purple-700" />
          ) : isFinancial ? (
            <CreditCard size={10} className="text-amber-700" />
          ) : isVehicle ? (
            <Car size={10} className="text-cyan-700" />
          ) : isLocation ? (
            <MapPin size={10} className="text-emerald-700" />
          ) : (
            <FileText size={10} className="text-neutral-700" />
          )}
          <span className="truncate max-w-[90px]">{typeUpper}</span>
        </div>

        <span className="bg-[#fff176] text-neutral-900 px-1 rounded-xs font-mono font-bold text-[8px]">
          #{nodeData.id.slice(0, 4).toUpperCase()}
        </span>
      </div>

      {/* Main Body */}
      <div className="pt-1.5">
        <div className="font-sans font-bold text-xs text-neutral-900 leading-snug truncate" title={nodeData.name}>
          {nodeData.name}
        </div>

        <div className="font-sans font-medium text-[11px] text-red-700 truncate mt-0.5" title={nodeData.role}>
          {nodeData.role || 'Evidence Record'}
        </div>

        {/* Forensic Detail snippet */}
        <div className="mt-1.5 p-1 bg-[#e8e0ce] border border-[#cfc4af] rounded-xs font-mono text-[8px] text-neutral-700 space-y-0.5">
          {nodeData.rawProperties?.phone_number && (
            <div>TEL: {nodeData.rawProperties.phone_number}</div>
          )}
          {nodeData.rawProperties?.license_plate && (
            <div>PLATE: {nodeData.rawProperties.license_plate}</div>
          )}
          {nodeData.rawProperties?.account_number && (
            <div>ACC: {nodeData.rawProperties.account_number}</div>
          )}
          {nodeData.rawProperties?.area && (
            <div>LOC: {nodeData.rawProperties.area}</div>
          )}
          {!nodeData.rawProperties?.phone_number &&
            !nodeData.rawProperties?.license_plate &&
            !nodeData.rawProperties?.account_number &&
            !nodeData.rawProperties?.area && (
              <div className="truncate">CONFIDENCE: {nodeData.confidence || 90}%</div>
            )}
        </div>

        {/* Bottom Red Stamp */}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="red-stamp text-[7px] font-bold">{stamp}</span>
        </div>
      </div>
    </div>
  );
};

export default DetectivePinNode;
