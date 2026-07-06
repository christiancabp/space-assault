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
 * TODO(chrisb): implement the shake curve — this function defines how a hit FEELS.
 *
 * Map trauma (0..1) + elapsed time to a camera offset. Config knobs available:
 *   SCREEN_SHAKE.maxOffset   - max positional shake at trauma=1 (0.45 units)
 *   SCREEN_SHAKE.maxRoll     - max roll at trauma=1 (0.06 rad)
 *   SCREEN_SHAKE.frequency   - oscillation speed (22)
 *
 * Things to consider:
 * - Use trauma * trauma so shake ramps in hard and tails off gently.
 * - Pure sin(time * frequency) looks mechanical; sampling two sine waves at
 *   different frequencies/phases per axis (e.g. sin(t*f) and sin(t*f*1.3 + 7))
 *   reads as chaotic, which feels more like an impact.
 * - Roll (rotation) sells the shake more than position does — even a tiny
 *   roll amplitude is felt. Games like Nuclear Throne shake almost entirely
 *   with rotation.
 *
 * A minimal working version (feel free to start here and iterate):
 *   const shake = trauma * trauma;
 *   return {
 *     x: SCREEN_SHAKE.maxOffset * shake * Math.sin(time * SCREEN_SHAKE.frequency),
 *     y: SCREEN_SHAKE.maxOffset * shake * Math.sin(time * SCREEN_SHAKE.frequency * 1.3 + 7),
 *     roll: SCREEN_SHAKE.maxRoll * shake * Math.sin(time * SCREEN_SHAKE.frequency * 0.9 + 3),
 *   };
 */
function computeShakeOffset(trauma: number, time: number): ShakeOffset {
  // Placeholder: no shake until implemented (game runs fine without it)
  void trauma;
  void time;
  return { x: 0, y: 0, roll: 0 };
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
