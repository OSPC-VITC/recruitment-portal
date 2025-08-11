"use client";

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class ChunkErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a chunk loading error
    const isChunkError = error.name === 'ChunkLoadError' || 
                        error.message.includes('Loading chunk') ||
                        error.message.includes('Loading CSS chunk') ||
                        error.message.includes('ChunkLoadError');

    return {
      hasError: isChunkError,
      error: isChunkError ? error : undefined,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log chunk loading errors for debugging
    if (this.isChunkLoadError(error)) {
      console.error('ChunkLoadError caught by boundary:', error);
      console.error('Error info:', errorInfo);
      
      // Attempt automatic retry for chunk errors
      this.attemptRetry();
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private isChunkLoadError(error: Error): boolean {
    return error.name === 'ChunkLoadError' || 
           error.message.includes('Loading chunk') ||
           error.message.includes('Loading CSS chunk') ||
           error.message.includes('ChunkLoadError') ||
           error.stack?.includes('webpack') === true;
  }

  private attemptRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      const retryDelay = Math.pow(2, this.state.retryCount) * 1000; // Exponential backoff
      
      const timeout = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          retryCount: prevState.retryCount + 1
        }));
      }, retryDelay);

      this.retryTimeouts.push(timeout);
    }
  };

  private handleManualRetry = () => {
    // Clear browser cache and reload
    if (typeof window !== 'undefined') {
      // Clear any cached chunks
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('webpack') || name.includes('chunk')) {
              caches.delete(name);
            }
          });
        });
      }
      
      // Force reload the page
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Show custom fallback UI for chunk loading errors
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Loading Error
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We're having trouble loading some resources. This usually happens due to network issues or cached files.
              </p>
              {this.state.retryCount < this.maxRetries && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  Retrying automatically... (Attempt {this.state.retryCount + 1} of {this.maxRetries})
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleManualRetry}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Go to Homepage
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
