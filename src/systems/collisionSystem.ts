/**
 * Collision System - Handles all collision detection
 *
 * Uses simple AABB (Axis-Aligned Bounding Box) collision detection.
 * Called every frame from GameLoop.
 *
 * PATTERN: System function accessed outside React
 * - Uses getState() to read stores without subscribing
 * - Modifies state directly via store actions
 * - No React re-renders during collision checks
 */

import { useEnemyStore } from '../stores/enemyStore';
import { useBulletStore } from '../stores/bulletStore';
import { usePlayerStore } from '../stores/playerStore';
import { useGameStore } from '../stores/gameStore';
import { GAME_CONFIG } from '../constants/gameConfig';

// Hitbox definition for collision checks
interface Hitbox {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

/**
 * Check if two hitboxes intersect (AABB collision)
 * Returns true if the boxes overlap on all three axes
 */
function boxesIntersect(a: Hitbox, b: Hitbox): boolean {
  return (
    Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2 &&
    Math.abs(a.z - b.z) < (a.depth + b.depth) / 2
  );
}

/**
 * Main collision check function
 * Called every frame from GameLoop
 */
export function checkCollisions(): void {
  // Get current state from all stores (no subscription, just snapshot)
  const enemies = useEnemyStore.getState().enemies;
  const bullets = useBulletStore.getState().bullets;
  const playerPos = usePlayerStore.getState().position;
  const isInvulnerable = usePlayerStore.getState().isInvulnerable;

  // Get store actions
  const removeEnemy = useEnemyStore.getState().removeEnemy;
  const removeBullet = useBulletStore.getState().removeBullet;
  const addScore = useGameStore.getState().addScore;
  const loseLife = useGameStore.getState().loseLife;
  const setInvulnerable = usePlayerStore.getState().setInvulnerable;

  // Define hitbox sizes
  const { BULLET_SIZE, ENEMY_SIZE } = GAME_CONFIG;

  // Player hitbox (slightly smaller than visual for fairness)
  const playerHitbox: Hitbox = {
    x: playerPos.x,
    y: playerPos.y,
    z: playerPos.z,
    width: 0.8,
    height: 0.4,
    depth: 1.2,
  };

  // Track entities to remove (avoid modifying arrays while iterating)
  const bulletsToRemove = new Set<string>();
  const enemiesToRemove = new Set<string>();

  // Check bullet-enemy collisions
  for (const bullet of bullets) {
    // Only player bullets damage enemies
    if (bullet.ownerId !== 'player') continue;

    const bulletHitbox: Hitbox = {
      x: bullet.position.x,
      y: bullet.position.y,
      z: bullet.position.z,
      width: BULLET_SIZE.x,
      height: BULLET_SIZE.y,
      depth: BULLET_SIZE.z,
    };

    for (const enemy of enemies) {
      // Skip if already marked for removal
      if (enemiesToRemove.has(enemy.id)) continue;

      const enemyHitbox: Hitbox = {
        x: enemy.position.x,
        y: enemy.position.y,
        z: enemy.position.z,
        width: ENEMY_SIZE.x,
        height: ENEMY_SIZE.y,
        depth: ENEMY_SIZE.z,
      };

      if (boxesIntersect(bulletHitbox, enemyHitbox)) {
        // Hit! Mark both for removal
        bulletsToRemove.add(bullet.id);
        enemiesToRemove.add(enemy.id);

        // Add score
        addScore(GAME_CONFIG.POINTS_PER_ENEMY);

        // Bullet can only hit one enemy
        break;
      }
    }
  }

  // Check enemy-player collisions
  if (!isInvulnerable) {
    for (const enemy of enemies) {
      // Skip if already marked for removal
      if (enemiesToRemove.has(enemy.id)) continue;

      const enemyHitbox: Hitbox = {
        x: enemy.position.x,
        y: enemy.position.y,
        z: enemy.position.z,
        width: ENEMY_SIZE.x,
        height: ENEMY_SIZE.y,
        depth: ENEMY_SIZE.z,
      };

      if (boxesIntersect(playerHitbox, enemyHitbox)) {
        // Collision with player!
        enemiesToRemove.add(enemy.id);
        loseLife();

        // Brief invulnerability
        setInvulnerable(true);
        setTimeout(() => {
          usePlayerStore.getState().setInvulnerable(false);
        }, 1500);

        // Only one collision per frame
        break;
      }
    }
  }

  // Remove marked entities
  bulletsToRemove.forEach((id) => removeBullet(id));
  enemiesToRemove.forEach((id) => removeEnemy(id));
}
