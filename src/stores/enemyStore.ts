/**
 * Enemy Store - Manages all enemy entities
 *
 * PATTERN: Entity array with CRUD operations
 * - Enemies are stored as an array
 * - Each enemy has a unique ID for targeting
 * - Manager component reads array and renders Enemy components
 * - Individual Enemy components update their own position via updateEnemy
 *
 * NOTE: Position updates happen frequently (every frame), so we use
 * getState() in useFrame rather than subscribing to avoid re-renders.
 */

import { create } from 'zustand';
import type { Enemy, Vector3, EnemyPhase } from '../types/game.types';
import { GAME_CONFIG } from '../config';
import { REGULAR_INVADERS, type InvaderType } from '../config/enemyConfigs';
import { usePlayAreaStore } from './playAreaStore';

interface EnemyState {
  enemies: Enemy[];

  // Actions
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  updateEnemy: (id: string, updates: Partial<Enemy>) => void;
  updateEnemyPosition: (id: string, position: Vector3) => void;
  clearEnemies: () => void;
}

export const useEnemyStore = create<EnemyState>((set) => ({
  enemies: [],

  // Add a new enemy to the game
  addEnemy: (enemy) => {
    set((state) => ({
      enemies: [...state.enemies, enemy],
    }));
  },

  // Remove enemy by ID (when destroyed or exits screen)
  removeEnemy: (id) => {
    set((state) => ({
      enemies: state.enemies.filter((e) => e.id !== id),
    }));
  },

  // Update any enemy properties (phase, health, etc.)
  updateEnemy: (id, updates) => {
    set((state) => ({
      enemies: state.enemies.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },

  // Optimized position-only update (called every frame)
  updateEnemyPosition: (id, position) => {
    set((state) => ({
      enemies: state.enemies.map((e) =>
        e.id === id ? { ...e, position } : e
      ),
    }));
  },

  // Clear all enemies (on game reset)
  clearEnemies: () => {
    set({ enemies: [] });
  },
}));

/**
 * TODO(chrisb): pick which invader model each spawn uses — this shapes the
 * game's variety and difficulty flavor. The fallback below is uniform random
 * among the three regular invaders; some directions to consider:
 *
 * - Weighted: small invaders common, big ones rare
 *   (e.g. invader5 50%, invader1 30%, invader3 20%)
 * - Escalation: read useGameStore.getState().score and shift the mix
 *   toward tougher-looking invaders as the score climbs
 * - Boss cameo: every Nth spawn returns 'boss' (it's bigger — 3-unit-wide
 *   hitbox — so it reads as a mini-event). REGULAR_INVADERS excludes it.
 *
 * There's no wrong answer; it's game-design taste. ~5-8 lines.
 */
function pickInvaderType(): InvaderType {
  return REGULAR_INVADERS[Math.floor(Math.random() * REGULAR_INVADERS.length)];
}

/**
 * Helper function to create a new enemy entity
 * Called by EnemyManager when spawning
 */
export function createEnemy(id: string): Enemy {
  const { ENEMY_SPAWN_Z, ENEMY_SPAWN_X_RANGE, ENEMY_SPAWN_Y_RANGE, ENEMY_APPROACH_SPEED } = GAME_CONFIG;

  // Clamp spawn ranges to the live play bounds so enemies always arrive
  // inside the visible corridor (narrower on portrait phones)
  const bounds = usePlayAreaStore.getState().bounds;
  const xMin = Math.max(ENEMY_SPAWN_X_RANGE.min, bounds.minX);
  const xMax = Math.min(ENEMY_SPAWN_X_RANGE.max, bounds.maxX);
  const yMin = Math.max(ENEMY_SPAWN_Y_RANGE.min, bounds.minY);
  const yMax = Math.min(ENEMY_SPAWN_Y_RANGE.max, bounds.maxY);

  // Random X position within spawn range
  const spawnX = Math.random() * (xMax - xMin) + xMin;

  // Random Y position within spawn range (vertical variety)
  const spawnY = Math.random() * (yMax - yMin) + yMin;

  return {
    id,
    position: {
      x: spawnX,
      y: spawnY,
      z: ENEMY_SPAWN_Z,
    },
    velocity: {
      x: 0,
      y: 0,
      z: ENEMY_APPROACH_SPEED, // Moving toward player (positive Z)
    },
    health: 1,
    phase: 'approaching' as EnemyPhase,
    invaderType: pickInvaderType(),
  };
}
