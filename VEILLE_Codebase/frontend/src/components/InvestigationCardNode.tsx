import React from 'react';
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
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export interface InvestigationNodeData {
  id: string;
  name: string;
  label: string;
  type: 'PERSON' | 'ORG' | 'COMMS' | 'FINANCIAL' | 'LOCATION' | 'VEHICLE' | 'EVENT' | string;
  role?: string;
  riskScore?: number;
  confidence?: number;
  rawProperties?: Record<string, any>;
  selected?: boolean;
  lod?: 'compact' | 'medium' | 'full';
  dimmed?: boolean;
  highlighted?: boolean;
  [key: string]: unknown;
}

const getCategoryConfig = (type: string) => {
  const t = (type || 'PERSON').toUpperCase();
  switch (t) {
    case 'PERSON':
    case 'SUSPECT':
      return {
        badge: 'SUSPECT',
        colorHex: '#ef4444',
        borderClass: 'border-red-500/60 hover:border-red-400',
        activeGlow: 'ring-2 ring-red-500 shadow-[0_0_22px_rgba(239,68,68,0.5)]',
        bgGradient: 'from-red-950/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
        iconClass: 'bg-red-500/20 text-red-400',
        icon: <User size={14} className="text-red-400" />
      };
    case 'VEHICLE':
      return {
        badge: 'VEHICLE',
        colorHex: '#06b6d4',
        borderClass: 'border-cyan-500/60 hover:border-cyan-400',
        activeGlow: 'ring-2 ring-cyan-500 shadow-[0_0_22px_rgba(6,182,212,0.5)]',
        bgGradient: 'from-cyan-950/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        iconClass: 'bg-cyan-500/20 text-cyan-400',
        icon: <Car size={14} className="text-cyan-400" />
      };
    case 'PHONE':
    case 'COMMS':
      return {
        badge: 'PHONE',
        colorHex: '#c084fc',
        borderClass: 'border-purple-500/60 hover:border-purple-400',
        activeGlow: 'ring-2 ring-purple-500 shadow-[0_0_22px_rgba(192,132,252,0.5)]',
        bgGradient: 'from-purple-950/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        iconClass: 'bg-purple-500/20 text-purple-400',
        icon: <Phone size={14} className="text-purple-400" />
      };
    case 'FINANCIAL':
    case 'ACCOUNT':
      return {
        badge: 'ACCOUNT',
        colorHex: '#fbbf24',
        borderClass: 'border-amber-500/60 hover:border-amber-400',
        activeGlow: 'ring-2 ring-amber-500 shadow-[0_0_22px_rgba(251,191,36,0.5)]',
        bgGradient: 'from-amber-950/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        iconClass: 'bg-amber-500/20 text-amber-400',
        icon: <CreditCard size={14} className="text-amber-400" />
      };
    case 'LOCATION':
      return {
        badge: 'LOCATION',
        colorHex: '#10b981',
        borderClass: 'border-emerald-500/60 hover:border-emerald-400',
        activeGlow: 'ring-2 ring-emerald-500 shadow-[0_0_22px_rgba(16,185,129,0.5)]',
        bgGradient: 'from-emerald-950/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        iconClass: 'bg-emerald-500/20 text-emerald-400',
        icon: <MapPin size={14} className="text-emerald-400" />
      };
    case 'ORG':
    case 'ORGANIZATION':
      return {
        badge: 'ORGANIZATION',
        colorHex: '#3b82f6',
        borderClass: 'border-blue-500/60 hover:border-blue-400',
        activeGlow: 'ring-2 ring-blue-500 shadow-[0_0_22px_rgba(59,130,246,0.5)]',
        bgGradient: 'from-blue-950/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        iconClass: 'bg-blue-500/20 text-blue-400',
        icon: <Building2 size={14} className="text-blue-400" />
      };
    case 'EVENT':
      return {
        badge: 'EVENT',
        colorHex: '#f43f5e',
        borderClass: 'border-rose-500/60 hover:border-rose-400',
        activeGlow: 'ring-2 ring-rose-500 shadow-[0_0_22px_rgba(244,63,94,0.5)]',
        bgGradient: 'from-rose-950/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        iconClass: 'bg-rose-500/20 text-rose-400',
        icon: <Calendar size={14} className="text-rose-400" />
      };
    default:
      return {
        badge: 'ENTITY',
        colorHex: '#94a3b8',
        borderClass: 'border-slate-500/60 hover:border-slate-400',
        activeGlow: 'ring-2 ring-slate-400 shadow-[0_0_22px_rgba(148,163,184,0.5)]',
        bgGradient: 'from-slate-900/60 via-[#0d121f] to-[#0a0f1a]',
        badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        iconClass: 'bg-slate-500/20 text-slate-300',
        icon: <HelpCircle size={14} className="text-slate-300" />
      };
  }
};

export const InvestigationCardNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as InvestigationNodeData;
  const config = getCategoryConfig(nodeData.type);
  const score = nodeData.riskScore ?? 50;
  const lod = nodeData.lod || 'full';
  const isDimmed = nodeData.dimmed;
  const isHighlighted = nodeData.highlighted;

  // Handles standard handles
  const handleElements = (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-primary border-2 border-[#080d1a] transition-transform hover:scale-150"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2.5 h-2.5 !bg-primary border-2 border-[#080d1a] transition-transform hover:scale-150"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-secondary border-2 border-[#080d1a] transition-transform hover:scale-150"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2.5 h-2.5 !bg-secondary border-2 border-[#080d1a] transition-transform hover:scale-150"
      />
    </>
  );

  // ================= 1. COMPACT LEVEL OF DETAIL (LOD: COMPACT) =================
  if (lod === 'compact') {
    return (
      <div
        className={`relative flex flex-col items-center group transition-all duration-200 select-none ${
          isDimmed ? 'opacity-25 grayscale' : 'opacity-100'
        }`}
      >
        {handleElements}

        {/* Circular Avatar Badge */}
        <div
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-md transition-transform duration-200 ${
            selected || isHighlighted
              ? `${config.activeGlow} scale-110`
              : `${config.borderClass} hover:scale-105`
          }`}
          style={{
            backgroundColor: 'rgba(10, 15, 26, 0.92)',
            boxShadow: `0 0 14px ${config.colorHex}33`
          }}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${config.iconClass}`}>
            {config.icon}
          </div>

          {/* Critical Threat Indicator Dot */}
          {score >= 75 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#080d1a] flex items-center justify-center animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          )}
        </div>

        {/* Clean Entity Label */}
        <div className="mt-1 px-1.5 py-0.5 rounded bg-[#080d1a]/90 border border-outline-variant/60 max-w-[120px] text-center shadow-lg">
          <div className="text-[10px] font-mono font-bold text-white truncate">{nodeData.name}</div>
        </div>
      </div>
    );
  }

  // ================= 2. MEDIUM LEVEL OF DETAIL (LOD: MEDIUM PILL) =================
  if (lod === 'medium') {
    return (
      <div
        className={`relative w-48 rounded-xl border bg-gradient-to-r ${config.bgGradient} backdrop-blur-md p-2 font-sans transition-all duration-200 select-none shadow-xl ${
          isDimmed ? 'opacity-25 grayscale' : 'opacity-100'
        } ${selected || isHighlighted ? config.activeGlow : config.borderClass}`}
        style={{ backgroundColor: 'rgba(10, 15, 26, 0.95)' }}
      >
        {handleElements}

        <div className="flex items-center gap-2">
          {/* Avatar Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.iconClass} border border-outline-variant/40`}>
            {config.icon}
          </div>

          {/* Body */}
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-bold text-white truncate tracking-wide" title={nodeData.name}>
              {nodeData.name}
            </div>
            <div className="text-[9px] text-outline truncate font-mono mt-0.5">
              {nodeData.role || config.badge}
            </div>
          </div>

          {/* Risk Pill */}
          {score > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded shrink-0 border ${
                score >= 75 ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-secondary/15 text-secondary border-secondary/30'
              }`}
            >
              {score}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ================= 3. FULL LEVEL OF DETAIL (LOD: FULL DOSSIER CARD) =================
  const props = nodeData.rawProperties || {};
  let snippet = '';
  if (props.license_plate || props.plate) {
    snippet = `Plate: ${props.license_plate || props.plate}`;
  } else if (props.phone_number || props.phone) {
    snippet = `Number: ${props.phone_number || props.phone}`;
  } else if (props.city || props.area) {
    snippet = `${props.area || ''}${props.area && props.city ? ', ' : ''}${props.city || ''}`;
  } else if (props.account_number || props.account) {
    snippet = `Acc: ${props.account_number || props.account}`;
  } else if (props.crime_reference) {
    snippet = `Ref: ${props.crime_reference}`;
  } else if (props.age) {
    snippet = `Age: ${props.age} yrs`;
  }

  const roleText = nodeData.role || props.role || props.description || 'Verified Entity';

  return (
    <div
      className={`relative w-64 rounded-xl border bg-gradient-to-b ${config.bgGradient} backdrop-blur-md p-3.5 font-sans transition-all duration-200 select-none shadow-2xl ${
        isDimmed ? 'opacity-25 grayscale' : 'opacity-100'
      } ${selected || isHighlighted ? config.activeGlow : config.borderClass}`}
      style={{ backgroundColor: 'rgba(10, 15, 26, 0.95)' }}
    >
      {handleElements}

      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-outline-variant/60">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${config.iconClass} border border-outline-variant/40`}>
            {config.icon}
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border tracking-wider ${config.badgeClass}`}>
            {config.badge}
          </span>
        </div>

        {/* Risk Score Pill */}
        {score > 0 && (
          <div
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1.5 ${
              score >= 75
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : score >= 50
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {score >= 75 ? <ShieldAlert size={11} className="animate-pulse" /> : <AlertTriangle size={10} />}
            <span>RISK {score}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="pt-2.5">
        <div className="text-xs font-bold text-white truncate tracking-wide" title={nodeData.name}>
          {nodeData.name}
        </div>
        <div className="text-[10px] text-outline truncate font-mono mt-0.5" title={roleText}>
          {roleText}
        </div>

        {snippet && (
          <div className="mt-2.5 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[10px] font-mono text-outline-variant">
            <span className="truncate text-on-surface/90 font-medium">{snippet}</span>
            {props.lat && props.lng && (
              <span className="text-[9px] text-primary font-bold shrink-0 ml-1 bg-primary/10 px-1 py-0.2 rounded border border-primary/30">
                GPS FIX
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationCardNode;
