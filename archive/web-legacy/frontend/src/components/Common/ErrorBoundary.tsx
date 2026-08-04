import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { errorLogger } from '../../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Global Error Boundary
 * Catches unhandled errors in React component tree
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('❌ Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service
    errorLogger.logError('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bir Hata Oluştu
              </h1>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
              </p>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Hata Detayları (Geliştirici Modu)
                  </summary>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words bg-white p-2 rounded border">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-words bg-white p-2 rounded border text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Dene
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 btn-outline flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ana Sayfa
                </button>
              </div>

              {/* Support Link */}
              <p className="text-sm text-gray-500 mt-6">
                Sorun devam ederse{' '}
                <a href="mailto:info@davetim.app" className="text-primary-600 hover:text-primary-700 font-medium">
                  info@davetim.app
                </a>{' '}
                adresinden bize ulaşabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

