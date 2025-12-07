import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // Report error to monitoring service if available
        if (typeof window !== 'undefined' && (window as any).errorReporting) {
            (window as any).errorReporting.report(error, {
                componentStack: errorInfo.componentStack,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-8 max-w-md w-full text-center">
                        <div className="text-6xl mb-4">🦎</div>
                        <h1 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h1>
                        <p className="text-gray-300 mb-6">
                            The Crime Lizard Slots game encountered an unexpected error. Don't worry, your progress is safe!
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                            >
                                🔄 Reload Game
                            </button>

                            <button
                                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                            >
                                Try Again
                            </button>
                        </div>

                        <details className="mt-6 text-left">
                            <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                                Show technical details
                            </summary>
                            <div className="mt-2 p-3 bg-gray-800 rounded text-xs text-gray-300 font-mono overflow-auto max-h-32">
                                <div className="mb-2">
                                    <strong>Error:</strong> {this.state.error?.message}
                                </div>
                                {this.state.errorInfo?.componentStack && (
                                    <div>
                                        <strong>Component Stack:</strong>
                                        <pre className="whitespace-pre-wrap mt-1">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </details>

                        <p className="text-xs text-gray-500 mt-4">
                            If this error persists, please contact support with the technical details above.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
