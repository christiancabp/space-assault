/**
 * CameraRig - Owns the camera every frame: menu cinematics + screen shake
 *
 * Two poses, one blend:
 * - Menu pose: slow Lissajous drift around UI.MENU_CAMERA (cinematic idle)
 * - Gameplay pose: fixed CAMERA config + trauma-based shake
 * The blend eases between them when the phase changes, giving a smooth
 * camera flight into the action when the game starts.
 *
 * Shake uses trauma² so small hits feel subtle and big hits violent.
 * The collision system adds trauma; this rig only consumes it.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffectsStore } from '../stores/effectsStore';
import { useGameStore } from '../stores/gameStore';
import { GAME_CONFIG } from '../config';

const { CAMERA, SCREEN_SHAKE, UI } = GAME_CONFIG;
const MENU_CAM = UI.MENU_CAMERA;

interface ShakeOffset {
  x: number;      // Positional offset (world units)
  y: number;
  roll: number;   // Camera Z-rotation (radians)
}

/**
 * Map trauma (0..1) + elapsed time to a camera offset.
 *
 * - trauma² makes small hits whisper and big hits slam
 * - Two detuned sine waves per axis (incommensurate frequencies + phase
 *   offsets) so the motion reads as chaotic impact, not a metronome
 * - Roll carries most of the perceived violence; even a tiny rotation
 *   amplitude is felt more than positional offset
 *
 * Tune via SCREEN_SHAKE in gameConfig.ts (maxOffset, maxRoll, frequency).
 */
function computeShakeOffset(trauma: number, time: number): ShakeOffset {
  const shake = trauma * trauma;
  const f = SCREEN_SHAKE.frequency;

  return {
    x: SCREEN_SHAKE.maxOffset * shake *
      (Math.sin(time * f) * 0.6 + Math.sin(time * f * 1.7 + 2.3) * 0.4),
    y: SCREEN_SHAKE.maxOffset * shake *
      (Math.sin(time * f * 1.3 + 7.1) * 0.6 + Math.sin(time * f * 0.8 + 4.9) * 0.4),
    roll: SCREEN_SHAKE.maxRoll * shake *
      (Math.sin(time * f * 0.9 + 3.7) * 0.7 + Math.sin(time * f * 1.5 + 1.2) * 0.3),
  };
}

export function CameraRig() {
  // 1 = gameplay pose, 0 = menu pose; eased toward the target each frame
  const blendRef = useRef(0);

  useFrame((state, delta) => {
    const { camera, clock } = state;
    const time = clock.elapsedTime;

    const phase = useGameStore.getState().phase;
    const inGame = phase === 'playing' || phase === 'paused' || phase === 'gameOver';

    // Ease the pose blend (framerate-independent damping)
    blendRef.current = THREE.MathUtils.damp(
      blendRef.current,
      inGame ? 1 : 0,
      MENU_CAM.blendSpeed,
      delta
    );
    const blend = blendRef.current;

    // Menu pose: slow Lissajous drift (incommensurate frequencies never repeat)
    const driftX = Math.sin(time * 0.21) * MENU_CAM.driftX;
    const driftY = Math.sin(time * 0.13 + 2.0) * MENU_CAM.driftY;

    // Gameplay pose: fixed camera + trauma shake
    const { trauma, decayTrauma } = useEffectsStore.getState();
    const offset = trauma > 0
      ? computeShakeOffset(trauma, time)
      : { x: 0, y: 0, roll: 0 };

    // Blend position and look-at between the two poses
    camera.position.set(
      THREE.MathUtils.lerp(MENU_CAM.position.x + driftX, CAMERA.position.x + offset.x, blend),
      THREE.MathUtils.lerp(MENU_CAM.position.y + driftY, CAMERA.position.y + offset.y, blend),
      THREE.MathUtils.lerp(MENU_CAM.position.z, CAMERA.position.z, blend)
    );
    camera.lookAt(
      THREE.MathUtils.lerp(MENU_CAM.lookAt.x, CAMERA.lookAt.x, blend),
      THREE.MathUtils.lerp(MENU_CAM.lookAt.y, CAMERA.lookAt.y, blend),
      THREE.MathUtils.lerp(MENU_CAM.lookAt.z, CAMERA.lookAt.z, blend)
    );
    camera.rotation.z += offset.roll * blend;

    if (trauma > 0) {
      decayTrauma(SCREEN_SHAKE.decayPerSecond * delta);
    }
  });

  return null;
}
