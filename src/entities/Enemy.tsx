/**
 * Enemy - Individual enemy entity
 *
 * Implements Galaga-style behavior:
 * - Phase 1 (approaching): Slow, predictable movement toward player
 * - Phase 2 (attacking): Fast dive toward player when close enough
 *
 * PATTERN: Self-managing entity with state machine
 * - Updates own position and phase in useFrame
 * - Removes self when past player
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Enemy as EnemyType } from '../types/game.types';
import { useEnemyStore } from '../stores/enemyStore';
import { useGameStore } from '../stores/gameStore';
import { InvaderModel } from '../invaders/InvaderModel';
import { GAME_CONFIG } from '../config';

interface EnemyProps {
  enemy: EnemyType;
}

export function Enemy({ enemy }: EnemyProps) {
  const meshRef = useRef<THREE.Group>(null);

  // Store actions
  const removeEnemy = useEnemyStore((state) => state.removeEnemy);
  const updateEnemy = useEnemyStore((state) => state.updateEnemy);

  // Track current phase locally for smooth transitions
  const phaseRef = useRef(enemy.phase);

  // Set initial position from props
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        enemy.position.x,
        enemy.position.y,
        enemy.position.z
      );
    }
    phaseRef.current = enemy.phase;
  }, [enemy.position.x, enemy.position.y, enemy.position.z, enemy.phase]);

  // Get position update action
  const updateEnemyPosition = useEnemyStore((state) => state.updateEnemyPosition);
  const phase = useGameStore((state) => state.phase);

  // Update position every frame
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Don't update when paused
    if (phase !== 'playing') return;

    const {
      ENEMY_APPROACH_SPEED,
      ENEMY_ATTACK_SPEED,
      ENEMY_ATTACK_TRIGGER_Z,
      DESPAWN_Z,
    } = GAME_CONFIG;

    // Determine speed based on phase
    const speed =
      phaseRef.current === 'approaching'
        ? ENEMY_APPROACH_SPEED
        : ENEMY_ATTACK_SPEED;

    // Move toward player (positive Z direction)
    meshRef.current.position.z += speed * delta;

    // Sync position to store for collision detection
    updateEnemyPosition(enemy.id, {
      x: meshRef.current.position.x,
      y: meshRef.current.position.y,
      z: meshRef.current.position.z,
    });

    // Phase transition: switch to attack mode when close enough
    if (
      phaseRef.current === 'approaching' &&
      meshRef.current.position.z > ENEMY_ATTACK_TRIGGER_Z
    ) {
      phaseRef.current = 'attacking';
      updateEnemy(enemy.id, { phase: 'attacking' });
    }

    // Remove when past player
    if (meshRef.current.position.z > DESPAWN_Z) {
      removeEnemy(enemy.id);
    }
  });

  return (
    <group ref={meshRef}>
      <InvaderModel type={enemy.invaderType} />
    </group>
  );
}
