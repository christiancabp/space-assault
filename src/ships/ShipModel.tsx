/**
 * ShipModel - Config-driven ship renderer
 *
 * Renders any roster ship from its SHIP_CONFIGS entry: the GLB scene via
 * drei <Clone> (same pattern as InvaderModel — robust to node renames and
 * transform rewrites from GLB compression, which break gltfjsx-baked JSX)
 * wrapped in the config transform, plus engine flames at the config mounts.
 *
 * Model credits live in public/models/ATTRIBUTION.md (CC-BY-4.0).
 *
 * Only the persisted ship selection is preloaded at boot; the other ships
 * stream on demand when browsed in the ship selector (suspending on the
 * Suspense boundary in ShipPreviewCanvas).
 */

import { Clone, useGLTF } from '@react-three/drei';
import { getShipConfig } from '../config/shipConfigs';
import { usePlayerStore } from '../stores/playerStore';
import { EnginePropulsion } from '../effects';
import type { ShipId } from '../types/ship.types';

interface ShipModelProps {
  shipId: ShipId;
}

export function ShipModel({ shipId }: ShipModelProps) {
  const config = getShipConfig(shipId);
  const { scene } = useGLTF(config.modelPath);

  return (
    <group dispose={null}>
      <group
        scale={config.transform.scale}
        rotation={config.transform.rotation}
        position={config.transform.positionOffset}
      >
        <Clone object={scene} />
      </group>

      {/* Engine propulsion effects */}
      {config.engines.map((engine, index) => (
        <EnginePropulsion
          key={index}
          position={engine.position}
          scale={engine.scale}
          coreColor={engine.color}
        />
      ))}
    </group>
  );
}

// Warm only the persisted selection at boot (zustand persist hydrates from
// localStorage synchronously, so the id is valid at module-eval time).
// getShipConfig falls back to the default ship if the stored id is stale.
useGLTF.preload(getShipConfig(usePlayerStore.getState().selectedShipId).modelPath);
