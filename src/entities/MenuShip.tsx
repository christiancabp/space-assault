/**
 * MenuShip - The selected ship idling in the scene behind the main menu
 *
 * Gentle bob + slow yaw sway so the menu feels alive; engine flames come
 * from the ship components themselves. Replaces the static snapshot that
 * used to render in a separate canvas.
 *
 * PATTERN: Entity with useFrame animation (no store writes - purely visual)
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../stores/playerStore';
import { ShipModel } from '../ships';

const BASE_Y = 4.6;  // High enough to float in the open gap between title and panels
const BASE_Z = 2.5;  // Closer to the menu camera so the ship reads larger
const BASE_YAW = Math.PI * 0.78; // Three-quarter view (engine flame trails to the side)

export function MenuShip() {
  const groupRef = useRef<THREE.Group>(null);
  const selectedShipId = usePlayerStore((state) => state.selectedShipId);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Idle motion: bob + slow yaw sway + slight roll
    groupRef.current.position.y = BASE_Y + Math.sin(t * 0.8) * 0.3;
    groupRef.current.rotation.y = BASE_YAW + Math.sin(t * 0.3) * 0.25;
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.06;
  });

  return (
    <group ref={groupRef} position={[0, BASE_Y, BASE_Z]} rotation={[0, BASE_YAW, 0]}>
      <ShipModel shipId={selectedShipId} />
    </group>
  );
}
