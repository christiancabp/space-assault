/**
 * CanvasErrorBoundary - Last-resort fallback around the 3D canvas
 *
 * Catches two failure modes that would otherwise leave a white/black screen:
 * 1. Render errors thrown inside the R3F reconciler (WebGL context creation
 *    failure on unsupported browsers/GPUs, unexpected asset-load errors) —
 *    React forwards these to the nearest class boundary.
 * 2. WebGL context loss at runtime (GPU reset/driver crash). Game.tsx
 *    dispatches CONTEXT_LOST_EVENT when the canvas loses its context.
 *
 * Follows the ModelErrorBoundary precedent in src/invaders/InvaderModel.tsx;
 * reuses the .menu-overlay styling so the fallback matches the game's menus.
 */

import { Component, type ReactNode } from 'react';

// Dispatched on window by Game.tsx when the WebGL context is lost
export const CONTEXT_LOST_EVENT = 'space-assault:webgl-context-lost';

interface CanvasErrorBoundaryProps {
  children: ReactNode;
}

interface CanvasErrorBoundaryState {
  failed: boolean;
}

export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { failed: true };
  }

  private handleContextLost = () => {
    // TODO(chris): recovery strategy decision — see session notes.
    // Options: (a) show the fallback and let the player reload (current),
    // (b) listen for 'webglcontextrestored' and auto-recover by remounting
    // the canvas, (c) auto-reload after a short delay. (a) is the safe
    // default; (b) is nicest on mobile where context loss is more common.
    this.setState({ failed: true });
  };

  componentDidMount() {
    window.addEventListener(CONTEXT_LOST_EVENT, this.handleContextLost);
  }

  componentWillUnmount() {
    window.removeEventListener(CONTEXT_LOST_EVENT, this.handleContextLost);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="menu-overlay canvas-error-overlay">
          <h1>SIGNAL LOST</h1>
          <p>3D rendering is unavailable.</p>
          <p>Your browser or GPU may not support WebGL, or the graphics context was lost.</p>
          <button onClick={() => window.location.reload()}>RELOAD</button>
        </div>
      );
    }
    return this.props.children;
  }
}
