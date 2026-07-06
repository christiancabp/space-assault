/**
 * ExplosionManager - Renders all active explosion bursts
 *
 * PATTERN: Entity-Manager (like EnemyManager / BulletManager)
 * - Subscribes to the explosions array in effectsStore
 * - Each Explosion handles its own animation and self-removal
 */

import { useEffectsStore } from '../stores/effectsStore';
import { Explosion } from './Explosion';

export function ExplosionManager() {
  const explosions = useEffectsStore((state) => state.explosions);

  return (
    <>
      {explosions.map((explosion) => (
        <Explosion key={explosion.id} explosion={explosion} />
      ))}
    </>
  );
}
