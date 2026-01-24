import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging with context
    console.error('=== Error Boundary Caught Error ===');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.error('=====================================');

    // Store error info for display
    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // In production, you could send this to an error tracking service
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl max-w-2xl w-full">
            <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>

            {isDev && this.state.errorInfo && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400 mb-2">
                  Show Error Details (Dev Only)
                </summary>
                <pre className="text-xs bg-slate-900/50 p-3 rounded overflow-auto max-h-48 text-left text-red-400">
                  {this.state.error?.stack}
                </pre>
                <pre className="text-xs bg-slate-900/50 p-3 rounded overflow-auto max-h-32 text-left text-slate-400 mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Reload Application
              </button>
            </div>

            {this.state.errorCount > 1 && (
              <p className="text-xs text-slate-500 mt-4">
                Error occurred {this.state.errorCount} times this session
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
