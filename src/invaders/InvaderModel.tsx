/*
 * InvaderModel - Renders any invader GLB by type
 *
 * Uses drei's <Clone> on the loaded GLTF scene, which handles any node
 * structure (invader_1/5/boss are a single mesh; invader_3 is five) and
 * gives each enemy instance its own copy of the scene graph.
 *
 * Models (all CC-BY-4.0, via Sketchfab):
 * - Invader_1, Invader_5, Boss_Invader by nitwit.friends
 *   (https://sketchfab.com/nitwit.friends)
 * - Space Invader #3 by alban (https://sketchfab.com/alban)
 *
 * Includes an error boundary: a missing/corrupt GLB falls back to the
 * classic cube so a spawn can never crash the game.
 */

import { Component, Suspense, type ReactNode } from 'react';
import { Clone, useGLTF } from '@react-three/drei';
import { INVADER_CONFIGS, type InvaderType } from '../config/enemyConfigs';
import { GAME_CONFIG } from '../config';

/** Classic cube fallback (previous enemy visual) */
export function EnemyCube() {
  const { ENEMY_SIZE, COLORS } = GAME_CONFIG;
  return (
    <mesh>
      <boxGeometry args={[ENEMY_SIZE.x, ENEMY_SIZE.y, ENEMY_SIZE.z]} />
      <meshStandardMaterial
        color={COLORS.enemy}
        emissive={COLORS.enemy}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function InvaderMesh({ type }: { type: InvaderType }) {
  const config = INVADER_CONFIGS[type];
  const { scene } = useGLTF(config.modelPath);

  return (
    <group
      scale={config.transform.scale}
      rotation={config.transform.rotation}
      position={config.transform.positionOffset}
      dispose={null}
    >
      <Clone object={scene} />
    </group>
  );
}

// Render the cube if a model fails to load - never crash a spawn
class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <EnemyCube /> : this.props.children;
  }
}

export function InvaderModel({ type }: { type: InvaderType }) {
  return (
    <ModelErrorBoundary>
      <Suspense fallback={<EnemyCube />}>
        <InvaderMesh type={type} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

// Preload all invader models so the loading screen covers them
for (const config of Object.values(INVADER_CONFIGS)) {
  useGLTF.preload(config.modelPath);
}
