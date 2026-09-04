import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, FileText, MapPin, Car, Phone, DollarSign } from 'lucide-react';

const iconMap = {
  PERSON: <User size={16} />,
  FIR: <FileText size={16} />,
  LOCATION: <MapPin size={16} />,
  VEHICLE: <Car size={16} />,
  PHONE: <Phone size={16} />,
  FINANCIAL: <DollarSign size={16} />
};

export const CustomNode = ({ data }) => {
  const icon = iconMap[data.type] || <FileText size={16} />;
  
  return (
    <div className="react-flow__node-custom">
      <Handle type="target" position={Position.Top} style={{ background: 'var(--accent-cyan)' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '6px', borderRadius: '50%' }}>
          {icon}
        </div>
        <div style={{ fontWeight: 600 }}>{data.label}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {data.type}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent-purple)' }} />
    </div>
  );
};
