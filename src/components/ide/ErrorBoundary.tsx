import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("IDE error boundary caught:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#1e1e1e",
            color: "#f48771",
            fontFamily: "monospace",
            padding: 24,
            zIndex: 9999,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div style={{ color: "#ffffff", fontSize: 18, marginBottom: 8 }}>
              The IDE crashed.
            </div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 12,
                color: "#cccccc",
              }}
            >
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
