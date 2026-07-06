/**
 * Touch Input - Shared mutable state for on-screen controls
 *
 * PATTERN: Module-level mutable object read in useFrame (same
 * zero-re-render approach as useKeyboard's ref). TouchControls writes,
 * Player reads and merges with keyboard input every frame.
 *
 * moveX/moveY are normalized -1..1 (world convention: +y is up).
 */

export const touchInput = {
  moveX: 0,
  moveY: 0,
  firing: false,
};

/** Coarse-pointer detection, shared by touch UI and fullscreen behavior */
export const isTouchDevice =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);

/**
 * Best-effort fullscreen for mobile play (hides browser URL bar/controls).
 * - Android Chrome / iPad Safari: works via the Fullscreen API
 * - iPhone Safari: API unsupported for non-video elements; silently no-ops.
 *   True fullscreen there comes from "Add to Home Screen" (standalone meta
 *   tags in index.html).
 * Must be called from a user gesture (button tap).
 */
export function enterFullscreen(): void {
  if (!isTouchDevice) return;
  const el = document.documentElement;
  try {
    void el.requestFullscreen?.({ navigationUI: 'hide' })?.catch(() => {});
  } catch {
    // Unsupported (e.g. iPhone Safari) - game plays fine in-browser
  }
}

export function resetTouchInput(): void {
  touchInput.moveX = 0;
  touchInput.moveY = 0;
  touchInput.firing = false;
}
