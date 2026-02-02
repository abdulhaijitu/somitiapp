import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console (in production, send to error tracking service)
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Card className="w-full max-w-md border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-lg bg-muted p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
