import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

// Top-level error boundary so React render crashes show a friendly
// recover screen instead of a blank page. Logs to console for now;
// when we wire analytics this is the place to send to Sentry/etc.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // eslint-disable-next-line no-console
    console.error('Pastio error boundary:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: 'var(--bg-page)' }}
      >
        <div
          className="w-full max-w-[480px] rounded-card p-6 text-center"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            Something broke
          </p>
          <h1 className="mt-2 text-lg" style={{ color: 'var(--text-primary)' }}>
            Pastio hit an unexpected error
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            We couldn't render the screen. Reloading usually fixes it.
          </p>
          <details className="mt-4 text-left">
            <summary
              className="cursor-pointer text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Error details
            </summary>
            <pre
              className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-btn p-2 text-[11px]"
              style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {error.message}
            </pre>
          </details>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-btn px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ background: '#3B6D11' }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.reset}
              className="rounded-btn px-4 py-2 text-sm transition-colors"
              style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              Try to recover
            </button>
          </div>
        </div>
      </div>
    );
  }
}
