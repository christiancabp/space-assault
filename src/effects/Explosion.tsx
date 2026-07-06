/**
 * Explosion - A single particle burst at a destruction point
 *
 * PATTERN: Entity component (like Enemy) - handles its own lifecycle.
 * All particle buffers are allocated once on mount via useMemo; per-frame
 * work is a single uniform update (uProgress), and particle motion is
 * computed in the vertex shader.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Explosion as ExplosionData } from '../types/game.types';
import { useEffectsStore } from '../stores/effectsStore';
import { GAME_CONFIG } from '../config';
import {
  explosionVertexShader,
  explosionFragmentShader,
} from './shaders/explosionShader';

interface ExplosionProps {
  explosion: ExplosionData;
}

export function Explosion({ explosion }: ExplosionProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const ageRef = useRef(0);

  const { particleCount, lifetime, speedMin, speedMax, sizeMin, sizeMax, coreColor, drag } =
    GAME_CONFIG.EXPLOSIONS;

  // Allocate particle attributes once per burst
  /* eslint-disable react-hooks/purity -- random burst directions are
     intentionally generated once at mount; stable via useMemo */
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3); // All start at origin
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const seeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Random direction on a sphere, random speed within range
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      const speed = speedMin + Math.random() * (speedMax - speedMin);

      velocities[i * 3] = dir.x * speed;
      velocities[i * 3 + 1] = dir.y * speed;
      velocities[i * 3 + 2] = dir.z * speed;
      sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
      seeds[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [particleCount, speedMin, speedMax, sizeMin, sizeMax]);
  /* eslint-enable react-hooks/purity */

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uLifetime: { value: lifetime },
      uDrag: { value: drag },
      uColor: { value: new THREE.Color(explosion.color) },
      uCoreColor: { value: new THREE.Color(coreColor) },
    }),
    [explosion.color, lifetime, drag, coreColor]
  );

  useFrame((_, delta) => {
    ageRef.current += delta;

    if (ageRef.current >= lifetime) {
      useEffectsStore.getState().removeExplosion(explosion.id);
      return;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = ageRef.current / lifetime;
    }
  });

  return (
    <points
      position={[explosion.position.x, explosion.position.y, explosion.position.z]}
      geometry={geometry}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={explosionVertexShader}
        fragmentShader={explosionFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
