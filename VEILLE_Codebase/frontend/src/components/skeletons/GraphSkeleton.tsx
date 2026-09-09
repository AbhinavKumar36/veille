import React from 'react';

export const GraphSkeleton = () => {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center relative bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Central node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary/20 animate-pulse border border-primary/50 shadow-[0_0_20px_rgba(0,229,255,0.2)] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary/50 text-2xl">hub</span>
      </div>

      {/* Orbiting nodes (simulated with absolute positioning) */}
      <div className="absolute top-[30%] left-[35%] w-12 h-12 rounded-full bg-surface-variant animate-pulse border border-outline-variant flex items-center justify-center"></div>
      <div className="absolute top-[25%] right-[30%] w-10 h-10 rounded-full bg-surface-variant animate-pulse border border-outline-variant flex items-center justify-center" style={{ animationDelay: '200ms' }}></div>
      <div className="absolute bottom-[35%] right-[25%] w-14 h-14 rounded-full bg-surface-variant animate-pulse border border-outline-variant flex items-center justify-center" style={{ animationDelay: '400ms' }}></div>
      <div className="absolute bottom-[20%] left-[25%] w-10 h-10 rounded-full bg-surface-variant animate-pulse border border-outline-variant flex items-center justify-center" style={{ animationDelay: '600ms' }}></div>
      
      {/* Connections (simulated lines) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <line x1="50%" y1="50%" x2="35%" y2="30%" stroke="currentColor" strokeWidth="1" className="text-primary animate-pulse" />
        <line x1="50%" y1="50%" x2="70%" y2="25%" stroke="currentColor" strokeWidth="1" className="text-primary animate-pulse" style={{ animationDelay: '200ms' }} />
        <line x1="50%" y1="50%" x2="75%" y2="65%" stroke="currentColor" strokeWidth="1" className="text-primary animate-pulse" style={{ animationDelay: '400ms' }} />
        <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="currentColor" strokeWidth="1" className="text-primary animate-pulse" style={{ animationDelay: '600ms' }} />
      </svg>
      
      {/* Overlay text */}
      <div className="absolute bottom-6 bg-surface-container-high/80 px-4 py-2 rounded text-primary font-data-code text-sm animate-pulse border border-primary/30 backdrop-blur-sm">
        ESTABLISHING GRAPH TOPOLOGY...
      </div>
    </div>
  );
};
