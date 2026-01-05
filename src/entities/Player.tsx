/**
 * Player - Player ship entity
 *
 * Handles:
 * - Rendering the player mesh (white cube)
 * - Movement via keyboard input (WASD/Arrows)
 * - Shooting via spacebar
 * - Syncing position to store for collision detection
 *
 * PATTERN: Entity with useFrame for updates
 * - useRef for direct mesh manipulation (no re-renders)
 * - useFrame for per-frame updates with delta time
 * - Keyboard state read from useKeyboard hook
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboard } from '../hooks/useKeyboard';
import { usePlayerStore } from '../stores/playerStore';
import { useGameStore } from '../stores/gameStore';
import { useBulletStore, createPlayerBullet } from '../stores/bulletStore';
import { GAME_CONFIG } from '../constants/gameConfig';

export function Player() {
  // Ref to the mesh for direct position updates
  const meshRef = useRef<THREE.Mesh>(null);

  // Keyboard state (Set of pressed key codes)
  const keysPressed = useKeyboard();

  // Track last shot time for fire rate limiting
  const lastShotTime = useRef(0);

  // Store actions
  const setPosition = usePlayerStore((state) => state.setPosition);
  const addBullet = useBulletStore((state) => state.addBullet);
  const phase = useGameStore((state) => state.phase);

  // Game loop - runs every frame
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Don't update when paused or not playing
    if (phase !== 'playing') return;

    const { PLAYER_SPEED, PLAYER_BOUNDS } = GAME_CONFIG;
    const keys = keysPressed.current;

    // Calculate movement based on input
    let moveX = 0;
    let moveY = 0;

    // Horizontal movement (A/D or Left/Right arrows)
    if (keys.has('KeyA') || keys.has('ArrowLeft')) {
      moveX -= PLAYER_SPEED * delta;
    }
    if (keys.has('KeyD') || keys.has('ArrowRight')) {
      moveX += PLAYER_SPEED * delta;
    }

    // Vertical movement (W/S or Up/Down arrows)
    if (keys.has('KeyW') || keys.has('ArrowUp')) {
      moveY += PLAYER_SPEED * delta;
    }
    if (keys.has('KeyS') || keys.has('ArrowDown')) {
      moveY -= PLAYER_SPEED * delta;
    }

    // Apply movement with bounds clamping
    const newX = THREE.MathUtils.clamp(
      meshRef.current.position.x + moveX,
      PLAYER_BOUNDS.minX,
      PLAYER_BOUNDS.maxX
    );
    const newY = THREE.MathUtils.clamp(
      meshRef.current.position.y + moveY,
      PLAYER_BOUNDS.minY,
      PLAYER_BOUNDS.maxY
    );

    // Update mesh position directly (no re-render)
    meshRef.current.position.x = newX;
    meshRef.current.position.y = newY;

    // Sync position to store for collision detection
    setPosition({ x: newX, y: newY });

    // Shooting (Space key)
    if (keys.has('Space')) {
      const now = state.clock.elapsedTime * 1000; // Convert to ms
      if (now - lastShotTime.current > GAME_CONFIG.PLAYER_FIRE_RATE) {
        // Create and add new bullet
        const bullet = createPlayerBullet({
          x: newX,
          y: newY,
          z: GAME_CONFIG.PLAYER_Z,
        });
        addBullet(bullet);
        lastShotTime.current = now;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 1, GAME_CONFIG.PLAYER_Z]}
    >
      {/* Player ship geometry - white cube for now */}
      <boxGeometry args={[1, 0.5, 1.5]} />
      <meshStandardMaterial
        color={GAME_CONFIG.COLORS.player}
        emissive={GAME_CONFIG.COLORS.player}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}
