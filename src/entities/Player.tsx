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
import {
  Rocketship,
  GuardiansShip,
  PlanetExpress,
  RickNMorty,
  SayanCapsule,
  SpaceShuttle,
  Starship,
  TieFighter,
  TimeMachine,
} from '../ships';
import type { ShipId } from '../types/ship.types';

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

  // Double-tap barrel roll tracking
  const lastLeftPress = useRef(0);
  const lastRightPress = useRef(0);
  const prevKeysRef = useRef<Set<string>>(new Set());
  const barrelRoll = useRef({ active: false, direction: 0, startTime: 0, startX: 0 });

  // Store state and actions
  const setPosition = usePlayerStore((state) => state.setPosition);
  const setBarrelRolling = usePlayerStore((state) => state.setBarrelRolling);
  const selectedShipId = usePlayerStore((state) => state.selectedShipId);
  const addBullet = useBulletStore((state) => state.addBullet);
  const phase = useGameStore((state) => state.phase);

  // Render the selected ship component
  const renderShip = (shipId: ShipId) => {
    switch (shipId) {
      case 'guardians-ship':
        return <GuardiansShip />;
      case 'planet-express':
        return <PlanetExpress />;
      case 'rick-n-morty':
        return <RickNMorty />;
      case 'sayan-capsule':
        return <SayanCapsule />;
      case 'space-shuttle':
        return <SpaceShuttle />;
      case 'starship':
        return <Starship />;
      case 'tie-fighter':
        return <TieFighter />;
      case 'time-machine':
        return <TimeMachine />;
      case 'rocketship':
      default:
        return <Rocketship />;
    }
  };

  // Game loop - runs every frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Don't update when paused or not playing
    if (phase !== 'playing') return;

    const { PLAYER_SPEED, PLAYER_BOUNDS, PLAYER_TILT, BARREL_ROLL } = GAME_CONFIG;
    const keys = keysPressed.current;
    const prevKeys = prevKeysRef.current;
    const now = state.clock.elapsedTime * 1000; // ms

    // Calculate input direction (-1, 0, or 1 for each axis)
    let inputX = 0;
    let inputY = 0;

    // Horizontal input (A/D or Left/Right arrows)
    const leftPressed = keys.has('KeyA') || keys.has('ArrowLeft');
    const rightPressed = keys.has('KeyD') || keys.has('ArrowRight');
    const wasLeftPressed = prevKeys.has('KeyA') || prevKeys.has('ArrowLeft');
    const wasRightPressed = prevKeys.has('KeyD') || prevKeys.has('ArrowRight');

    if (leftPressed) inputX -= 1;
    if (rightPressed) inputX += 1;

    // Vertical input (W/S or Up/Down arrows)
    if (keys.has('KeyW') || keys.has('ArrowUp')) {
      inputY += 1;
    }
    if (keys.has('KeyS') || keys.has('ArrowDown')) {
      inputY -= 1;
    }

    // Double-tap detection for barrel roll
    if (!barrelRoll.current.active) {
      const currentX = groupRef.current.position.x;
      // Detect new left press
      if (leftPressed && !wasLeftPressed) {
        if (now - lastLeftPress.current < BARREL_ROLL.doubleTapThreshold) {
          // Trigger barrel roll left (direction 1 = roll left, shift left = negative X)
          barrelRoll.current = { active: true, direction: 1, startTime: now, startX: currentX };
          setBarrelRolling(true);
        }
        lastLeftPress.current = now;
      }
      // Detect new right press
      if (rightPressed && !wasRightPressed) {
        if (now - lastRightPress.current < BARREL_ROLL.doubleTapThreshold) {
          // Trigger barrel roll right (direction -1 = roll right, shift right = positive X)
          barrelRoll.current = { active: true, direction: -1, startTime: now, startX: currentX };
          setBarrelRolling(true);
        }
        lastRightPress.current = now;
      }
    }

    // Update previous keys for next frame
    prevKeysRef.current = new Set(keys);

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

    // Barrel roll animation (rotation + position shift)
    let barrelRollRotation = 0;
    let finalX = newX;
    if (barrelRoll.current.active) {
      const elapsed = now - barrelRoll.current.startTime;
      const progress = Math.min(elapsed / BARREL_ROLL.duration, 1);
      // Ease-out cubic for snappy start, smooth finish
      const eased = 1 - Math.pow(1 - progress, 3);
      barrelRollRotation = barrelRoll.current.direction * Math.PI * 2 * eased;

      // Position shift (opposite of roll direction: roll left = shift left = -X)
      const shiftOffset = -barrelRoll.current.direction * BARREL_ROLL.shiftDistance * eased;
      finalX = THREE.MathUtils.clamp(
        barrelRoll.current.startX + shiftOffset,
        PLAYER_BOUNDS.minX,
        PLAYER_BOUNDS.maxX
      );
      groupRef.current.position.x = finalX;

      if (progress >= 1) {
        barrelRoll.current.active = false;
        setBarrelRolling(false);
      }
    }

    // Apply rotation to ship (tilt + barrel roll)
    groupRef.current.rotation.z = currentRoll.current + barrelRollRotation;
    groupRef.current.rotation.x = currentPitch.current;

    // Sync position to store for collision detection
    setPosition({ x: finalX, y: newY });

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
      {renderShip(selectedShipId)}
    </group>
  );
}
