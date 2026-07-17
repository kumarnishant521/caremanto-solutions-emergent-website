import React from "react";

/**
 * Global error boundary — catches every React render / lifecycle exception
 * so the site never white-screens or shows the raw runtime overlay.
 * When something explodes we render a friendly editorial fallback and give
 * the visitor a "Reload" button.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    // In production we'd forward this to Sentry / LogRocket. For now, keep it
    // out of the console overlay so preview mode also stays quiet.
    if (typeof window !== "undefined" && window.console) {
      // eslint-disable-next-line no-console
      console.warn("[ErrorBoundary]", error, info?.componentStack);
    }
  }

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        data-testid="global-error-boundary"
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[var(--bg-0,#F5EEE0)]"
      >
        <div className="max-w-lg">
          <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--muted,#78675a)] mb-4">
            Caremanto Studio · Momentary Pause
          </div>
          <h1 className="font-serif text-[36px] md:text-[48px] leading-[0.95] tracking-[-0.02em] mb-4">
            Something needed a<br/>
            <span className="italic text-[var(--gold,#a37a4a)]">quiet reset.</span>
          </h1>
          <p className="text-[14px] md:text-[15px] text-[var(--ink,#1e1a17)]/75 leading-relaxed mb-8">
            Please refresh this page. Nothing was lost — the studio archive is safe.
          </p>
          <button
            onClick={this.handleReload}
            data-testid="global-error-reload"
            className="btn-gold"
          >
            Reload
          </button>
        </div>
      </main>
    );
  }
}
