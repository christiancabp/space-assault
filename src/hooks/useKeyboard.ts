/**
 * useKeyboard - Keyboard input tracking hook
 *
 * Tracks which keys are currently pressed using a Set for O(1) lookups.
 * Returns a ref to the Set so it can be read in useFrame without re-renders.
 *
 * PATTERN: Input state via ref
 * - Event listeners update a Set (not React state)
 * - useFrame reads the Set directly (no re-renders)
 * - Multiple keys can be pressed simultaneously
 *
 * Usage in components:
 * ```
 * const keys = useKeyboard();
 *
 * useFrame(() => {
 *   if (keys.current.has('KeyW')) {
 *     // Move up
 *   }
 * });
 * ```
 */

import { useEffect, useRef } from 'react';

// Common key codes for reference:
// KeyW, KeyA, KeyS, KeyD - WASD keys
// ArrowUp, ArrowDown, ArrowLeft, ArrowRight - Arrow keys
// Space - Spacebar
// Escape - Escape key

export function useKeyboard() {
  // Set of currently pressed key codes
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Add key to set on keydown
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.code);

      // Prevent default for game keys (avoid page scrolling with arrows)
      if (
        event.code === 'Space' ||
        event.code === 'ArrowUp' ||
        event.code === 'ArrowDown' ||
        event.code === 'ArrowLeft' ||
        event.code === 'ArrowRight'
      ) {
        event.preventDefault();
      }
    };

    // Remove key from set on keyup
    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code);
    };

    // Clear all keys when window loses focus (prevents stuck keys)
    const handleBlur = () => {
      keysPressed.current.clear();
    };

    // Register event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return keysPressed;
}

/**
 * Helper to check if any movement key is pressed
 */
export function isMovementKey(code: string): boolean {
  return (
    code === 'KeyW' ||
    code === 'KeyA' ||
    code === 'KeyS' ||
    code === 'KeyD' ||
    code === 'ArrowUp' ||
    code === 'ArrowDown' ||
    code === 'ArrowLeft' ||
    code === 'ArrowRight'
  );
}
