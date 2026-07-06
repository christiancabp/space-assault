/**
 * ShipPreviewCanvas - Reusable 3D ship preview
 *
 * Renders a single ship in its own lightweight Canvas, on a transparent
 * background so it composes over whatever overlay it sits in. Used by both
 * the ShipSelector (large, drag-to-rotate) and the main menu snapshot
 * (small, look-only). A single OrbitControls drives the turntable:
 * `autoRotate` always spins, `enableRotate` gates user drag.
 *
 * Ship components self-center at the group origin and are normalized to
 * ~3 game units, so one fixed camera + origin orbit target frames them all.
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { ShipModel } from '../ships';
import type { ShipId } from '../types/ship.types';

interface ShipPreviewCanvasProps {
  shipId: ShipId;
  // Enable click-drag rotation (selector). Off = look-only (menu snapshot).
  interactive?: boolean;
}

export function ShipPreviewCanvas({ shipId, interactive = false }: ShipPreviewCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 6], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Lighting rig trimmed from the gameplay Scene */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 15, -20]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 5, 25]} intensity={0.6} color="#4a9eff" />
      <directionalLight position={[-15, 10, 0]} intensity={0.4} color="#9966ff" />

      {/* Environment provides reflections for the ships' PBR materials.
          Separate Suspense boundaries: browsing to a not-yet-loaded ship
          suspends only the model, so the environment doesn't flicker. */}
      <Suspense fallback={null}>
        <Environment files={`${import.meta.env.BASE_URL}hdri/night.hdr`} />
      </Suspense>
      <Suspense fallback={null}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <ShipModel shipId={shipId} />
        </group>
      </Suspense>

      <OrbitControls
        autoRotate={true}
        autoRotateSpeed={1.5}
        enableZoom={true}
        enablePan={false}
        enableRotate={interactive}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
