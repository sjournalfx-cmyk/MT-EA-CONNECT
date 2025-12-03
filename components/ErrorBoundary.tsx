import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
                    <p className="text-gray-400 mb-4">The application encountered an unexpected error.</p>
                    <pre className="text-xs text-left bg-black/30 p-4 rounded overflow-auto max-h-40 text-red-300 mb-4">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
