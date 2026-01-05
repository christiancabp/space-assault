/**
 * BulletManager - Renders all active bullets
 *
 * PATTERN: Manager component
 * - Subscribes to bullet array from store
 * - Maps array to Bullet components
 * - Each Bullet manages its own lifecycle
 */

import { useBulletStore } from '../stores/bulletStore';
import { Bullet } from './Bullet';

export function BulletManager() {
  // Subscribe to bullets array
  const bullets = useBulletStore((state) => state.bullets);

  return (
    <>
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}
    </>
  );
}
