/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.APP.ENTRY
TAG: UI.APP.ENTRY.ROOT

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=play

5WH:
WHAT = Application entry point — mounts the React root with AuthProvider, AuthGate, AgentTeamPanel, and App
WHY = Bootstrap point for the entire Agent Lee Agentic Operating System
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = index.tsx (project root)
WHEN = 2026
HOW = ReactDOM.createRoot wrapping all providers and the root App component

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './core/AuthProvider';
import { AuthGate } from './components/AuthGate';
import './index.css';

class ErrorBoundary extends React.Component<{children: any}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', background: 'black', padding: '20px', whiteSpace: 'pre-wrap' }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.toString()}</p>
          <p>{this.state.error?.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
