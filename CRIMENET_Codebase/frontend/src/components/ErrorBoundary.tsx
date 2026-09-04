import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[VEILLE ERROR BOUNDARY]', error, errorInfo);
    // TODO: Send to OpenTelemetry error stream in future
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-8">
          <div className="max-w-md text-center border border-red-500/30 bg-slate-800 p-8 rounded-lg">
            <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6 font-mono">
              {this.state.error?.message || 'An unexpected application error occurred.'}
            </p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-sm uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
