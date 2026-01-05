/**
 * Stars - Streaming star field for motion illusion
 *
 * Creates the effect of the ship flying through space by
 * streaming particles (stars) from front to back.
 *
 * PATTERN: Points geometry with useFrame animation
 * - useMemo to create initial positions once
 * - useFrame to update positions every frame
 * - needsUpdate flag to tell Three.js to re-upload positions
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export function Stars() {
  const pointsRef = useRef<THREE.Points>(null);

  const { count, spread, resetZ, despawnZ } = GAME_CONFIG.STARS;

  // Create initial star positions (only once)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random X position across spread width
      pos[i * 3] = (Math.random() - 0.5) * spread.x;

      // Random Y position across spread height
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;

      // Random Z position across depth (distributed evenly)
      pos[i * 3 + 2] = Math.random() * resetZ;
    }

    return pos;
  }, [count, spread.x, spread.y, resetZ]);

  // Animate stars streaming toward camera
  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position;
    const positions = positionAttr.array as Float32Array;

    const { speed } = GAME_CONFIG.STARS;

    for (let i = 0; i < count; i++) {
      const zIndex = i * 3 + 2;

      // Move star toward camera (positive Z direction)
      positions[zIndex] += speed * delta;

      // Reset star to far distance when it passes camera
      if (positions[zIndex] > despawnZ) {
        // Reset Z to far distance
        positions[zIndex] = resetZ;

        // Randomize X and Y for variety
        positions[i * 3] = (Math.random() - 0.5) * spread.x;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      }
    }

    // Tell Three.js to re-upload the position buffer
    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={GAME_CONFIG.COLORS.stars}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
}
