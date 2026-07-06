/**
 * LoadingScreen - Asset loading overlay
 *
 * Gated on drei's useProgress, which tracks every asset the Canvas
 * suspends on (GLB models, textures, HDR environment). Shows a minimum
 * of ~0.5s so cached loads don't flash, then fades out.
 *
 * PATTERN: HTML overlay over Canvas (like the menu screens)
 * - `fading` is derived from loader state; only the final unmount is
 *   scheduled (setState inside timeout callbacks, not effect bodies)
 */

import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

const MIN_DISPLAY_MS = 500;
const FADE_MS = 500;

export function LoadingScreen() {
  const active = useProgress((state) => state.active);
  const progress = useProgress((state) => state.progress);

  const [minElapsed, setMinElapsed] = useState(false);
  const [unmounted, setUnmounted] = useState(false);

  // Derived: start fading once loaders are idle and the min time passed
  const fading = minElapsed && !active;

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Unmount after the fade completes
  useEffect(() => {
    if (!fading) return;
    const timer = setTimeout(() => setUnmounted(true), FADE_MS);
    return () => clearTimeout(timer);
  }, [fading]);

  if (unmounted) return null;

  return (
    <div className={`loading-screen${fading ? ' fade-out' : ''}`}>
      <h1>SPACE ASSAULT</h1>
      <div className="loading-bar">
        <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="loading-percent">{Math.round(progress)}%</p>
    </div>
  );
}
