/**
 * PlayAreaManager - Derives playable bounds from what the camera can see
 *
 * On every viewport resize, casts rays through the screen corners of a
 * virtual camera fixed at the GAMEPLAY pose (not the live camera - menu
 * drift and screen shake must not jitter the bounds) and intersects them
 * with the player's z=0 plane. The visible rectangle, inset by the ship's
 * half-size, is intersected with the designed PLAYER_BOUNDS:
 *
 * - Desktop/landscape: frustum is wider than the designed area -> bounds
 *   unchanged (±10 x)
 * - Portrait phone: frustum is thinner -> bounds shrink to the screen,
 *   giving a tall, narrow play corridor the ship can't leave
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayAreaStore } from '../stores/playAreaStore';
import { GAME_CONFIG } from '../config';

const SHIP_MARGIN = 1.2; // Keep the ship's extents fully on screen

function computeVisibleBounds(aspect: number) {
  const { CAMERA, PLAYER_Z } = GAME_CONFIG;

  // Virtual camera at the base gameplay pose
  const cam = new THREE.PerspectiveCamera(CAMERA.fov, aspect, 0.1, 200);
  cam.position.set(CAMERA.position.x, CAMERA.position.y, CAMERA.position.z);
  cam.lookAt(CAMERA.lookAt.x, CAMERA.lookAt.y, CAMERA.lookAt.z);
  cam.updateMatrixWorld();

  // Intersect rays through the four NDC corners with the player plane (z=0)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const point = new THREE.Vector3(nx, ny, 0.5).unproject(cam);
    const dir = point.sub(cam.position).normalize();
    const t = (PLAYER_Z - cam.position.z) / dir.z;
    const hit = cam.position.clone().addScaledVector(dir, t);
    minX = Math.min(minX, hit.x);
    maxX = Math.max(maxX, hit.x);
    minY = Math.min(minY, hit.y);
    maxY = Math.max(maxY, hit.y);
  }

  // Inset by ship size, then never exceed the designed play area
  const designed = GAME_CONFIG.PLAYER_BOUNDS;
  return {
    minX: Math.max(minX + SHIP_MARGIN, designed.minX),
    maxX: Math.min(maxX - SHIP_MARGIN, designed.maxX),
    minY: Math.max(minY + SHIP_MARGIN, designed.minY),
    maxY: Math.min(maxY - SHIP_MARGIN, designed.maxY),
  };
}

export function PlayAreaManager() {
  const size = useThree((state) => state.size);

  useEffect(() => {
    const bounds = computeVisibleBounds(size.width / size.height);
    usePlayAreaStore.getState().setBounds(bounds);
  }, [size.width, size.height]);

  return null;
}
