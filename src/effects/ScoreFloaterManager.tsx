/**
 * ScoreFloaterManager - Renders "+100" floaters at kill positions
 *
 * PATTERN: Entity-Manager (like ExplosionManager)
 * - Subscribes to floaters in effectsStore
 * - Each floater drifts upward and self-removes after its lifetime
 * - drei <Html> anchors the DOM text to the 3D position, so the number
 *   appears exactly where the enemy died and tracks the camera
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ScoreFloater as ScoreFloaterData } from '../types/game.types';
import { useEffectsStore } from '../stores/effectsStore';
import { GAME_CONFIG } from '../config';

const { floaterLifetimeMs, floaterRise } = GAME_CONFIG.UI;

function ScoreFloater({ floater }: { floater: ScoreFloaterData }) {
  const groupRef = useRef<THREE.Group>(null);

  // Self-remove after lifetime (CSS handles the fade)
  useEffect(() => {
    const timer = setTimeout(() => {
      useEffectsStore.getState().removeFloater(floater.id);
    }, floaterLifetimeMs);
    return () => clearTimeout(timer);
  }, [floater.id]);

  // Drift upward over the lifetime
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y += (floaterRise / (floaterLifetimeMs / 1000)) * delta;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[floater.position.x, floater.position.y, floater.position.z]}
    >
      <Html center zIndexRange={[10, 0]}>
        <span className="score-floater">{floater.text}</span>
      </Html>
    </group>
  );
}

export function ScoreFloaterManager() {
  const floaters = useEffectsStore((state) => state.floaters);

  return (
    <>
      {floaters.map((floater) => (
        <ScoreFloater key={floater.id} floater={floater} />
      ))}
    </>
  );
}
