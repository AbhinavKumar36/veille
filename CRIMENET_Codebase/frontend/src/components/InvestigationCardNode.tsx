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
  HelpCircle
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
  [key: string]: unknown;
}

const getCategoryConfig = (type: string) => {
  const t = (type || 'PERSON').toUpperCase();
  switch (t) {
    case 'PERSON':
    case 'SUSPECT':
      return {
        badge: 'SUSPECT',
        borderClass: 'border-red-500/50 hover:border-red-400',
        activeGlow: 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]',
        bgGradient: 'from-red-950/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-red-500/15 text-red-400 border-red-500/40',
        iconClass: 'bg-red-500/20 text-red-400',
        icon: <User size={14} className="text-red-400" />
      };
    case 'VEHICLE':
      return {
        badge: 'VEHICLE',
        borderClass: 'border-cyan-500/50 hover:border-cyan-400',
        activeGlow: 'ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.35)]',
        bgGradient: 'from-cyan-950/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
        iconClass: 'bg-cyan-500/20 text-cyan-400',
        icon: <Car size={14} className="text-cyan-400" />
      };
    case 'PHONE':
    case 'COMMS':
      return {
        badge: 'PHONE',
        borderClass: 'border-purple-500/50 hover:border-purple-400',
        activeGlow: 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.35)]',
        bgGradient: 'from-purple-950/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
        iconClass: 'bg-purple-500/20 text-purple-400',
        icon: <Phone size={14} className="text-purple-400" />
      };
    case 'FINANCIAL':
    case 'ACCOUNT':
      return {
        badge: 'ACCOUNT',
        borderClass: 'border-amber-500/50 hover:border-amber-400',
        activeGlow: 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)]',
        bgGradient: 'from-amber-950/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
        iconClass: 'bg-amber-500/20 text-amber-400',
        icon: <CreditCard size={14} className="text-amber-400" />
      };
    case 'LOCATION':
      return {
        badge: 'LOCATION',
        borderClass: 'border-emerald-500/50 hover:border-emerald-400',
        activeGlow: 'ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)]',
        bgGradient: 'from-emerald-950/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
        iconClass: 'bg-emerald-500/20 text-emerald-400',
        icon: <MapPin size={14} className="text-emerald-400" />
      };
    case 'ORG':
    case 'ORGANIZATION':
      return {
        badge: 'ORGANIZATION',
        borderClass: 'border-blue-500/50 hover:border-blue-400',
        activeGlow: 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]',
        bgGradient: 'from-blue-950/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
        iconClass: 'bg-blue-500/20 text-blue-400',
        icon: <Building2 size={14} className="text-blue-400" />
      };
    case 'EVENT':
      return {
        badge: 'EVENT',
        borderClass: 'border-rose-500/50 hover:border-rose-400',
        activeGlow: 'ring-2 ring-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
        bgGradient: 'from-rose-950/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
        iconClass: 'bg-rose-500/20 text-rose-400',
        icon: <Calendar size={14} className="text-rose-400" />
      };
    default:
      return {
        badge: 'ENTITY',
        borderClass: 'border-slate-600 hover:border-slate-400',
        activeGlow: 'ring-2 ring-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.35)]',
        bgGradient: 'from-slate-900/40 via-surface-container-lowest to-surface-container-lowest',
        badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
        iconClass: 'bg-slate-500/20 text-slate-300',
        icon: <HelpCircle size={14} className="text-slate-300" />
      };
  }
};

export const InvestigationCardNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as InvestigationNodeData;
  const config = getCategoryConfig(nodeData.type);
  const score = nodeData.riskScore ?? 50;

  // Extract key snippet
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
      className={`relative w-64 rounded-lg border bg-gradient-to-b ${config.bgGradient} backdrop-blur-md p-3 font-sans transition-all duration-200 select-none shadow-xl ${
        selected ? config.activeGlow : config.borderClass
      }`}
      style={{ backgroundColor: 'rgba(10, 15, 26, 0.95)' }}
    >
      {/* Target Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-primary border-2 border-surface-container-lowest transition-transform hover:scale-125"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2.5 h-2.5 !bg-primary border-2 border-surface-container-lowest transition-transform hover:scale-125"
      />

      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/50">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${config.iconClass}`}>
            {config.icon}
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border tracking-wider ${config.badgeClass}`}>
            {config.badge}
          </span>
        </div>

        {/* Risk Score Pill */}
        {score > 0 && (
          <div
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${
              score >= 75
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : score >= 50
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {score >= 75 && <AlertTriangle size={10} />}
            <span>RISK {score}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="pt-2">
        <div className="text-xs font-bold text-on-surface truncate tracking-wide" title={nodeData.name}>
          {nodeData.name}
        </div>
        <div className="text-[10px] text-outline truncate font-mono mt-0.5" title={roleText}>
          {roleText}
        </div>

        {snippet && (
          <div className="mt-2 pt-1.5 border-t border-outline-variant/30 flex items-center justify-between text-[10px] font-mono text-outline-variant">
            <span className="truncate text-on-surface/80">{snippet}</span>
            {props.lat && props.lng && (
              <span className="text-[9px] text-primary/80 font-bold shrink-0 ml-1">GPS FIX</span>
            )}
          </div>
        )}
      </div>

      {/* Source Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-secondary border-2 border-surface-container-lowest transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2.5 h-2.5 !bg-secondary border-2 border-surface-container-lowest transition-transform hover:scale-125"
      />
    </div>
  );
};
