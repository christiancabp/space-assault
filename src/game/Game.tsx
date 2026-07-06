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

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { CameraRig } from './CameraRig';
import { PlayAreaManager } from './PlayAreaManager';
import { PostFX } from './PostFX';
import { GameLoop } from './GameLoop';
import { Player } from '../entities/Player';
import { MenuShip } from '../entities/MenuShip';
import { EnemyManager } from '../entities/EnemyManager';
import { BulletManager } from '../entities/BulletManager';
import { Stars } from '../entities/Stars';
import { useGameStore } from '../stores/gameStore';
import { CONTEXT_LOST_EVENT } from '../ui/CanvasErrorBoundary';
import { GAME_CONFIG } from '../config';

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
      // Cap device pixel ratio: DPR-3 phones would push 3x pixels through bloom
      dpr={[1, 2]}
      // Surface runtime context loss to CanvasErrorBoundary (GPU reset etc.)
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          window.dispatchEvent(new Event(CONTEXT_LOST_EVENT));
        });
      }}
    >
      {/* Scene setup - always rendered */}
      <Scene />

      {/* Screen shake rig - applies trauma-based camera shake */}
      <CameraRig />

      {/* Keeps play bounds matched to the visible frustum (portrait phones) */}
      <PlayAreaManager />

      {/* Star field - always rendered for background motion */}
      <Stars />

      {/* Selected ship idling behind the main menu. Suspense so an uncached
          ship GLB (ships now stream on demand) can't suspend the whole Canvas */}
      {phase === 'menu' && (
        <Suspense fallback={null}>
          <MenuShip />
        </Suspense>
      )}

      {/* Game entities - only during gameplay */}
      {isPlaying && (
        <Suspense fallback={null}>
          {/* Central game loop for systems (collision, spawning) */}
          <GameLoop />

          {/* Player ship */}
          <Player />

          {/* Enemy manager handles spawning and rendering enemies */}
          <EnemyManager />

          {/* Bullet manager renders all active bullets */}
          <BulletManager />
        </Suspense>
      )}

      {/* Post-processing (bloom) - keep last */}
      <PostFX />
    </Canvas>
  );
}
