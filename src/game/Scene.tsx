/**
 * Scene - 3D scene setup (lighting, environment)
 *
 * Sets up the basic scene elements that persist throughout the game.
 * Space-themed lighting with environment reflections for ship materials.
 *
 * PATTERN: Scene configuration component
 * - Contains camera target, lights, and environment
 * - Separated from Game.tsx for cleaner organization
 */

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config';

// Toggle for debug mode - enables orbit controls for camera inspection
const DEBUG_ORBIT_CONTROLS = true;

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
      {/* Environment for realistic reflections on ship materials */}
      <Environment preset="night" />

      {/* Ambient light - soft overall illumination */}
      <ambientLight intensity={0.3} />

      {/* Main directional light - simulates distant star */}
      <directionalLight
        position={[5, 15, -20]}
        intensity={1.5}
        color="#ffffff"
      />

      {/* Blue rim light from behind - space glow effect */}
      <directionalLight
        position={[-5, 5, 25]}
        intensity={0.6}
        color="#4a9eff"
      />

      {/* Purple accent light from side - adds depth */}
      <directionalLight
        position={[-15, 10, 0]}
        intensity={0.4}
        color="#9966ff"
      />

      {/* Warm accent from opposite side */}
      <pointLight
        position={[20, 5, -10]}
        intensity={15}
        color="#ff9944"
        distance={50}
        decay={2}
      />

      {/* Background color - deep space black */}
      <color attach="background" args={['#000008']} />

      {/* Fog for depth - objects fade into darkness at distance */}
      <fog attach="fog" args={['#000008', 30, 80]} />

      {/* Debug: Orbit controls for camera inspection */}
      {DEBUG_ORBIT_CONTROLS && <OrbitControls makeDefault />}
    </>
  );
}
