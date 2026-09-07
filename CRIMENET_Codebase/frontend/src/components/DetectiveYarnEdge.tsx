import React from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';

export const DetectiveYarnEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  label,
  selected,
}) => {
  // Compute smooth bezier curve
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const isHighlighted = (data as any)?.highlighted || selected;
  const isDimmed = (data as any)?.dimmed;
  const strokeColor = isHighlighted ? '#ff2222' : '#dc2626';
  const strokeWidth = isHighlighted ? 3.5 : 2.2;
  const edgeLabel = label || (data as any)?.label;

  return (
    <>
      {/* 1. Underlying Yarn Shadow on Corkboard */}
      <path
        id={`${id}-shadow`}
        d={edgePath}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={strokeWidth + 2}
        transform="translate(2, 5)"
        style={{ filter: 'blur(1.5px)', opacity: isDimmed ? 0.15 : 0.8 }}
      />

      {/* 2. Main Red Yarn Strand */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          ...style,
          filter: isHighlighted
            ? 'drop-shadow(0 0 6px rgba(255,34,34,0.9))'
            : 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
          opacity: isDimmed ? 0.2 : 1,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {/* 3. Secondary subtle twisted fiber strand for yarn texture */}
      <path
        d={edgePath}
        fill="none"
        stroke="#ff6b6b"
        strokeWidth={1}
        strokeDasharray="4 6"
        strokeLinecap="round"
        style={{
          opacity: isDimmed ? 0.1 : 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* 4. Pinned Paper Tag on String (Shown cleanly on highlight, selection, or hover) */}
      {edgeLabel && isHighlighted && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <foreignObject
            x={-60}
            y={-14}
            width={120}
            height={28}
            className="overflow-visible pointer-events-auto cursor-pointer"
          >
            <div className="flex items-center justify-center select-none animate-scale-in">
              <div
                className="relative px-2.5 py-0.5 rounded shadow-lg border text-center bg-[#fffde7] border-red-500 ring-2 ring-red-500"
                style={{
                  transform: 'rotate(-2deg)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                }}
              >
                {/* Tiny Brass Pin holding label to string */}
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow border border-amber-900/60" />

                <span
                  className="font-handwriting font-bold text-[11px] leading-tight block text-neutral-900 tracking-wide truncate max-w-[100px]"
                  title={String(edgeLabel)}
                >
                  {String(edgeLabel)}
                </span>
              </div>
            </div>
          </foreignObject>
        </g>
      )}
    </>
  );
};

export default DetectiveYarnEdge;
