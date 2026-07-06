/**
 * Bullet - Individual bullet entity
 *
 * Handles:
 * - Rendering the bullet mesh (small red cube)
 * - Movement based on velocity
 * - Self-removal when out of bounds
 *
 * PATTERN: Self-managing entity
 * - Receives initial position/velocity from props
 * - Updates own position in useFrame
 * - Removes self from store when out of bounds
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Bullet as BulletType } from '../types/game.types';
import { useBulletStore } from '../stores/bulletStore';
import { useGameStore } from '../stores/gameStore';
import { GAME_CONFIG } from '../config';

interface BulletProps {
  bullet: BulletType;
}

export function Bullet({ bullet }: BulletProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const removeBullet = useBulletStore((state) => state.removeBullet);

  // Set initial position from props
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        bullet.position.x,
        bullet.position.y,
        bullet.position.z
      );
    }
  }, [bullet.position.x, bullet.position.y, bullet.position.z]);

  // Get position update action
  const updateBulletPosition = useBulletStore((state) => state.updateBulletPosition);
  const phase = useGameStore((state) => state.phase);

  // Update position every frame
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Don't update when paused
    if (phase !== 'playing') return;

    // Apply velocity
    meshRef.current.position.x += bullet.velocity.x * delta;
    meshRef.current.position.y += bullet.velocity.y * delta;
    meshRef.current.position.z += bullet.velocity.z * delta;

    // Sync position to store for collision detection
    updateBulletPosition(bullet.id, {
      x: meshRef.current.position.x,
      y: meshRef.current.position.y,
      z: meshRef.current.position.z,
    });

    // Check bounds - remove if out of play area
    const z = meshRef.current.position.z;
    if (z < GAME_CONFIG.BULLET_DESPAWN_Z || z > GAME_CONFIG.DESPAWN_Z) {
      removeBullet(bullet.id);
    }
  });

  const { BULLET_SIZE, COLORS } = GAME_CONFIG;

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[BULLET_SIZE.x, BULLET_SIZE.y, BULLET_SIZE.z]} />
      <meshStandardMaterial
        color={COLORS.bullet}
        emissive={COLORS.bulletEmissive}
        emissiveIntensity={2.5}
        toneMapped={false}
      />
    </mesh>
  );
}
