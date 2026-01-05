/**
 * Game - Main R3F Canvas wrapper
 *
 * This is the root 3D component that sets up:
 * - React Three Fiber Canvas with camera configuration
 * - Scene lighting and environment
 * - Conditional rendering of game entities based on phase
 *
 * PATTERN: Canvas container component
 * - Canvas is always rendered (for smooth transitions)
 * - Child entities conditionally render based on game phase
 * - Scene setup is separated into Scene component
 */

import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { GameLoop } from './GameLoop';
import { Player } from '../entities/Player';
import { EnemyManager } from '../entities/EnemyManager';
import { BulletManager } from '../entities/BulletManager';
import { Stars } from '../entities/Stars';
import { useGameStore } from '../stores/gameStore';
import { GAME_CONFIG } from '../constants/gameConfig';

export function Game() {
  // Subscribe to game phase for conditional rendering
  const phase = useGameStore((state) => state.phase);
  const isPlaying = phase === 'playing';

  // Camera configuration from game config
  const { position, fov } = GAME_CONFIG.CAMERA;

  return (
    <Canvas
      camera={{
        position: [position.x, position.y, position.z],
        fov,
        near: 0.1,
        far: 200,
      }}
      // Disable automatic color management for consistent colors
      gl={{ antialias: true }}
    >
      {/* Scene setup - always rendered */}
      <Scene />

      {/* Star field - always rendered for background motion */}
      <Stars />

      {/* Game entities - only during gameplay */}
      {isPlaying && (
        <>
          {/* Central game loop for systems (collision, spawning) */}
          <GameLoop />

          {/* Player ship */}
          <Player />

          {/* Enemy manager handles spawning and rendering enemies */}
          <EnemyManager />

          {/* Bullet manager renders all active bullets */}
          <BulletManager />
        </>
      )}
    </Canvas>
  );
}
