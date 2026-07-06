/**
 * Stars - Streaming star field for motion illusion
 *
 * Creates the effect of the ship flying through space by
 * streaming particles (stars) from front to back, in two parallax
 * layers: a far layer (slow, small, dim) and a near layer (fast,
 * larger, bright). A custom shader renders soft round twinkling
 * sprites instead of PointsMaterial's square quads.
 *
 * PATTERN: Points geometry with useFrame animation
 * - useMemo to create attribute buffers once per layer
 * - useFrame streams Z positions and resets stars past the camera
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config';
import {
  starVertexShader,
  starFragmentShader,
} from '../effects/shaders/starShader';

interface StarLayerConfig {
  count: number;
  speed: number;
  sizeMin: number;
  sizeMax: number;
  brightness: number;
}

function StarLayer({ layer }: { layer: StarLayerConfig }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { spread, resetZ, despawnZ, twinkleSpeed } = GAME_CONFIG.STARS;
  const { count, speed, sizeMin, sizeMax, brightness } = layer;

  // Create attribute buffers once per layer
  /* eslint-disable react-hooks/purity -- random star scatter is intentionally
     generated once at mount; stable across re-renders via useMemo */
  const { positions, sizes, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      positions[i * 3 + 2] = Math.random() * resetZ;
      sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
      seeds[i] = Math.random();
    }

    return { positions, sizes, seeds };
  }, [count, spread.x, spread.y, resetZ, sizeMin, sizeMax]);
  /* eslint-enable react-hooks/purity */

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTwinkleSpeed: { value: twinkleSpeed },
      uBrightness: { value: brightness },
      uColor: { value: new THREE.Color(GAME_CONFIG.COLORS.stars) },
    }),
    [twinkleSpeed, brightness]
  );

  // Stream stars toward the camera; drive the twinkle clock
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (!pointsRef.current) return;
    const positionAttr = pointsRef.current.geometry.attributes.position;
    const positions = positionAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const zIndex = i * 3 + 2;
      positions[zIndex] += speed * delta;

      // Reset star to far distance when it passes the camera
      if (positions[zIndex] > despawnZ) {
        positions[zIndex] = resetZ;
        positions[i * 3] = (Math.random() - 0.5) * spread.x;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      }
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Stars() {
  return (
    <>
      {GAME_CONFIG.STARS.layers.map((layer, index) => (
        <StarLayer key={index} layer={layer} />
      ))}
    </>
  );
}
