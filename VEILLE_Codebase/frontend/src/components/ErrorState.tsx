import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-surface-container rounded-lg border border-red-500/20 p-8">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <h3 className="text-lg font-bold text-red-400 mb-2">Operation Failed</h3>
        <p className="text-sm text-on-surface-variant font-mono mb-6">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-surface-variant hover:bg-surface-variant/80 border border-outline-variant rounded transition-colors text-sm uppercase tracking-wider font-label-caps"
          >
            Retry Request
          </button>
        )}
      </div>
    </div>
  );
};
