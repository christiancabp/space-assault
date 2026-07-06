/**
 * CameraRig - Trauma-based screen shake
 *
 * Every frame:
 * 1. Reads `trauma` (0..1) from effectsStore via getState() (no re-renders)
 * 2. Computes a shake offset and applies it around the base camera pose
 * 3. Decays trauma toward zero
 *
 * The collision system adds trauma on kills/hits; this rig only consumes it.
 * Shake magnitude uses trauma² so small hits feel subtle and big hits violent.
 */

import { useFrame } from '@react-three/fiber';
import { useEffectsStore } from '../stores/effectsStore';
import { GAME_CONFIG } from '../config';

const { CAMERA, SCREEN_SHAKE } = GAME_CONFIG;

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
  useFrame((state, delta) => {
    const { trauma, decayTrauma } = useEffectsStore.getState();
    const { camera, clock } = state;

    const offset = trauma > 0
      ? computeShakeOffset(trauma, clock.elapsedTime)
      : { x: 0, y: 0, roll: 0 };

    // Apply shake around the fixed base pose so it never drifts
    camera.position.set(
      CAMERA.position.x + offset.x,
      CAMERA.position.y + offset.y,
      CAMERA.position.z
    );
    camera.lookAt(CAMERA.lookAt.x, CAMERA.lookAt.y, CAMERA.lookAt.z);
    camera.rotation.z += offset.roll;

    if (trauma > 0) {
      decayTrauma(SCREEN_SHAKE.decayPerSecond * delta);
    }
  });

  return null;
}
