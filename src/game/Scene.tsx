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

import { useRef, useEffect, Suspense } from 'react';
import { useThree } from '@react-three/fiber';
import {
  Environment,
  useTexture,
  // OrbitControls
} from '@react-three/drei';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config';
import { ExplosionManager } from '../effects/ExplosionManager';
import { ScoreFloaterManager } from '../effects/ScoreFloaterManager';

/**
 * Nebula - Distant space backdrop
 *
 * A large plane past the fog distance (fog disabled on its material so it
 * stays visible), tinted dark so gameplay elements keep contrast.
 * Texture: CC0 seamless nebula (see public/textures/ATTRIBUTION.md).
 */
function Nebula() {
  // Configure tiling in the onLoad callback (runs post-load, outside render)
  const texture = useTexture(
    `${import.meta.env.BASE_URL}textures/nebula.webp`,
    (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 1);
      t.colorSpace = THREE.SRGBColorSpace;
    }
  );

  return (
    // Oversized and shifted down so the plane edge stays outside the
    // downward-pitched camera frustum at any window aspect ratio
    <mesh position={[0, -20, -100]} renderOrder={-1}>
      <planeGeometry args={[420, 260]} />
      <meshBasicMaterial
        map={texture}
        color="#9a9db8"
        fog={false}
        depthWrite={false}
      />
    </mesh>
  );
}

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
      {/* Environment for realistic reflections on ship materials.
          Same file as drei's "night" preset, self-hosted (no CDN fetch);
          CC0 via Poly Haven — see public/hdri/ATTRIBUTION.md */}
      <Environment files={`${import.meta.env.BASE_URL}hdri/night.hdr`} />

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

      {/* Background color - deep space black (fallback while nebula loads) */}
      <color attach="background" args={['#000008']} />

      {/* Nebula backdrop behind all gameplay */}
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>

      {/* Fog for depth - objects fade into darkness at distance */}
      <fog attach="fog" args={['#000008', 30, 80]} />

      {/* Explosion particle bursts */}
      <ExplosionManager />

      {/* "+100" score floaters at kill positions */}
      <ScoreFloaterManager />
      
      {/* OrbitControls for development - can be removed in production */}
      {/* <OrbitControls /> */}
    </>
  );
}
