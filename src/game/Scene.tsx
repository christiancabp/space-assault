/**
 * Scene - 3D scene setup (lighting, environment)
 *
 * Sets up the basic scene elements that persist throughout the game.
 * Keeps lighting minimal for the clean sci-fi aesthetic.
 *
 * PATTERN: Scene configuration component
 * - Contains camera target, lights, and environment
 * - Separated from Game.tsx for cleaner organization
 */

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export function Scene() {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());

  // Point camera at the look-at target on mount
  useEffect(() => {
    const { lookAt } = GAME_CONFIG.CAMERA;
    targetRef.current.set(lookAt.x, lookAt.y, lookAt.z);
    camera.lookAt(targetRef.current);
  }, [camera]);

  return (
    <>
      {/* Ambient light - soft overall illumination */}
      <ambientLight intensity={0.4} />

      {/* Directional light - main light source from above/front */}
      <directionalLight
        position={[0, 20, -30]}
        intensity={1}
        color="#ffffff"
      />

      {/* Secondary light from behind for rim lighting effect */}
      <directionalLight
        position={[0, 10, 20]}
        intensity={0.3}
        color="#4a9eff"
      />

      {/* Background color - deep space black */}
      <color attach="background" args={['#000005']} />

      {/* Fog for depth - objects fade into darkness at distance */}
      <fog attach="fog" args={['#000005', 30, 80]} />
    </>
  );
}
