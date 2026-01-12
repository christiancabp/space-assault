/**
 * Player - Player ship entity
 *
 * Handles:
 * - Rendering the player ship (3D model)
 * - Movement via keyboard input (WASD/Arrows)
 * - Shooting via spacebar
 * - Syncing position to store for collision detection
 *
 * PATTERN: Entity with useFrame for updates
 * - useRef for direct group manipulation (no re-renders)
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
import { GAME_CONFIG } from '../config';
import { Rocketship } from '../ships';

export function Player() {
  // Ref to the group for direct position updates
  const groupRef = useRef<THREE.Group>(null);

  // Keyboard state (Set of pressed key codes)
  const keysPressed = useKeyboard();

  // Track last shot time for fire rate limiting
  const lastShotTime = useRef(0);

  // Track current roll/pitch for smooth animation
  const currentRoll = useRef(0);
  const currentPitch = useRef(0);

  // Store actions
  const setPosition = usePlayerStore((state) => state.setPosition);
  const addBullet = useBulletStore((state) => state.addBullet);
  const phase = useGameStore((state) => state.phase);

  // Game loop - runs every frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Don't update when paused or not playing
    if (phase !== 'playing') return;

    const { PLAYER_SPEED, PLAYER_BOUNDS, PLAYER_TILT } = GAME_CONFIG;
    const keys = keysPressed.current;

    // Calculate input direction (-1, 0, or 1 for each axis)
    let inputX = 0;
    let inputY = 0;

    // Horizontal input (A/D or Left/Right arrows)
    if (keys.has('KeyA') || keys.has('ArrowLeft')) {
      inputX -= 1;
    }
    if (keys.has('KeyD') || keys.has('ArrowRight')) {
      inputX += 1;
    }

    // Vertical input (W/S or Up/Down arrows)
    if (keys.has('KeyW') || keys.has('ArrowUp')) {
      inputY += 1;
    }
    if (keys.has('KeyS') || keys.has('ArrowDown')) {
      inputY -= 1;
    }

    // Calculate movement from input
    const moveX = inputX * PLAYER_SPEED * delta;
    const moveY = inputY * PLAYER_SPEED * delta;

    // Apply movement with bounds clamping
    const newX = THREE.MathUtils.clamp(
      groupRef.current.position.x + moveX,
      PLAYER_BOUNDS.minX,
      PLAYER_BOUNDS.maxX
    );
    const newY = THREE.MathUtils.clamp(
      groupRef.current.position.y + moveY,
      PLAYER_BOUNDS.minY,
      PLAYER_BOUNDS.maxY
    );

    // Update group position directly (no re-render)
    groupRef.current.position.x = newX;
    groupRef.current.position.y = newY;

    // Calculate target roll/pitch based on input direction
    const targetRoll = -inputX * PLAYER_TILT.maxRoll;  // Roll right when moving right
    const targetPitch = inputY * PLAYER_TILT.maxPitch; // Pitch up when moving up

    // Asymmetric easing: fast into roll, slow back to neutral
    const rollSpeed = targetRoll !== 0 ? PLAYER_TILT.easeInSpeed : PLAYER_TILT.easeOutSpeed;
    const pitchSpeed = targetPitch !== 0 ? PLAYER_TILT.easeInSpeed : PLAYER_TILT.easeOutSpeed;

    const rollEase = 1 - Math.exp(-rollSpeed * delta);
    const pitchEase = 1 - Math.exp(-pitchSpeed * delta);

    currentRoll.current = THREE.MathUtils.lerp(currentRoll.current, targetRoll, rollEase);
    currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch, pitchEase);

    // Apply rotation to ship
    groupRef.current.rotation.z = currentRoll.current;
    groupRef.current.rotation.x = currentPitch.current;

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
    <group ref={groupRef} position={[0, 1, GAME_CONFIG.PLAYER_Z]}>
      <Rocketship />
    </group>
  );
}
