/**
 * GameLoop - Central game loop coordinator
 *
 * Runs game systems (collision detection, etc.) every frame.
 * This is a "logic-only" component - renders nothing.
 *
 * PATTERN: Invisible coordinator component
 * - useFrame for per-frame execution
 * - Calls system functions in correct order
 * - Renders null (no visual output)
 */

import { useFrame } from '@react-three/fiber';
import { checkCollisions } from '../systems/collisionSystem';
import { useGameStore } from '../stores/gameStore';

export function GameLoop() {
  const phase = useGameStore((state) => state.phase);

  useFrame(() => {
    // Only run systems during active gameplay
    if (phase !== 'playing') return;

    // Run collision detection
    checkCollisions();

    // Future systems can be added here:
    // - updateAI()
    // - checkWaveCompletion()
    // - etc.
  });

  // This component renders nothing
  return null;
}
