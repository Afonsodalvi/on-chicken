import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Errors are captured by getDerivedStateFromError
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 text-center space-y-6">
            <div className="text-5xl">🐔</div>
            <h2 className="text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h2>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-border hover:bg-secondary"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-hero text-primary-foreground hover:opacity-90"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
