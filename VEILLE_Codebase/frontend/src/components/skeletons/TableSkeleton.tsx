import React from 'react';

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-surface-container rounded border border-outline-variant overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-outline-variant bg-surface-variant/30 flex items-center px-4 gap-4">
        <div className="h-4 bg-outline-variant/40 rounded w-1/4 animate-pulse"></div>
        <div className="h-4 bg-outline-variant/40 rounded w-1/4 animate-pulse hidden md:block"></div>
        <div className="h-4 bg-outline-variant/40 rounded w-1/4 animate-pulse hidden lg:block"></div>
        <div className="h-4 bg-outline-variant/40 rounded w-1/4 animate-pulse"></div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-outline-variant/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center px-4 py-3 gap-4">
            <div className="flex items-center gap-3 w-1/4">
              <div className="w-8 h-8 rounded-full bg-surface-variant animate-pulse shrink-0"></div>
              <div className="h-4 bg-surface-variant animate-pulse rounded w-full"></div>
            </div>
            <div className="h-4 bg-surface-variant animate-pulse rounded w-1/4 hidden md:block" style={{ animationDelay: `${i * 100}ms` }}></div>
            <div className="h-4 bg-surface-variant animate-pulse rounded w-1/4 hidden lg:block" style={{ animationDelay: `${i * 100 + 50}ms` }}></div>
            <div className="h-4 bg-surface-variant animate-pulse rounded w-1/4" style={{ animationDelay: `${i * 100 + 100}ms` }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};
