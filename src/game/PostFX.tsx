/**
 * PostFX - Post-processing pipeline
 *
 * Currently a single Bloom pass: anything brighter than the luminance
 * threshold (engine flames, bullets, explosion cores, bright stars)
 * gets a neon glow. All values tunable in GAME_CONFIG.BLOOM.
 *
 * NOTE: EffectComposer takes over the render loop; keep this as the
 * last child of the Canvas.
 */

import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { GAME_CONFIG } from '../config';

export function PostFX() {
  const { intensity, luminanceThreshold, luminanceSmoothing, mipmapBlur } =
    GAME_CONFIG.BLOOM;

  return (
    <EffectComposer>
      <Bloom
        intensity={intensity}
        luminanceThreshold={luminanceThreshold}
        luminanceSmoothing={luminanceSmoothing}
        mipmapBlur={mipmapBlur}
      />
    </EffectComposer>
  );
}
