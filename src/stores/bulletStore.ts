/**
 * Bullet Store - Manages all bullet entities
 *
 * Similar pattern to enemyStore - array of entities with CRUD.
 * Bullets track their owner ('player' or enemy ID) for collision logic.
 *
 * PATTERN: Simple entity management
 * - BulletManager subscribes to array and renders Bullet components
 * - Each Bullet handles its own movement in useFrame
 * - Collision system reads bullets via getState() for hit detection
 */

import { create } from 'zustand';
import type { Bullet, Vector3 } from '../types/game.types';
import { GAME_CONFIG } from '../constants/gameConfig';

interface BulletState {
  bullets: Bullet[];

  // Actions
  addBullet: (bullet: Bullet) => void;
  removeBullet: (id: string) => void;
  updateBulletPosition: (id: string, position: Vector3) => void;
  clearBullets: () => void;
}

export const useBulletStore = create<BulletState>((set) => ({
  bullets: [],

  // Add a new bullet (player or enemy fired)
  addBullet: (bullet) => {
    set((state) => ({
      bullets: [...state.bullets, bullet],
    }));
  },

  // Remove bullet by ID (hit something or went off-screen)
  removeBullet: (id) => {
    set((state) => ({
      bullets: state.bullets.filter((b) => b.id !== id),
    }));
  },

  // Update bullet position (called every frame by Bullet component)
  updateBulletPosition: (id, position) => {
    set((state) => ({
      bullets: state.bullets.map((b) =>
        b.id === id ? { ...b, position } : b
      ),
    }));
  },

  // Clear all bullets (on game reset)
  clearBullets: () => {
    set({ bullets: [] });
  },
}));

/**
 * Helper function to create a player bullet
 * Called when player fires (spacebar)
 */
export function createPlayerBullet(playerPosition: Vector3): Bullet {
  return {
    id: `bullet-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    position: {
      x: playerPosition.x,
      y: playerPosition.y,
      z: playerPosition.z - 1, // Spawn slightly in front of player
    },
    velocity: {
      x: 0,
      y: 0,
      z: -GAME_CONFIG.BULLET_SPEED, // Moving away from player (negative Z)
    },
    ownerId: 'player',
  };
}
