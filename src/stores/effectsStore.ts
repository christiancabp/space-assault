/**
 * Effects Store - Manages visual feedback effects (explosions, screen shake)
 *
 * PATTERN: Entity array with CRUD operations (same as enemyStore)
 * - Explosions are spawned by the collision system via getState()
 * - ExplosionManager reads the array and renders Explosion components
 * - Each Explosion removes itself after its lifetime
 *
 * Screen shake uses the "trauma" model: systems add trauma (clamped 0..1),
 * the CameraRig applies shake proportional to trauma² and decays it each
 * frame. Squaring makes small hits subtle and big hits violent.
 */

import { create } from 'zustand';
import type { Explosion, Vector3 } from '../types/game.types';

interface EffectsState {
  explosions: Explosion[];
  trauma: number;

  // Actions
  spawnExplosion: (position: Vector3, color: string) => void;
  removeExplosion: (id: string) => void;
  addTrauma: (amount: number) => void;
  decayTrauma: (amount: number) => void;
  clearEffects: () => void;
}

// Module-level counter for unique explosion IDs
let explosionCounter = 0;

export const useEffectsStore = create<EffectsState>((set) => ({
  explosions: [],
  trauma: 0,

  // Spawn an explosion burst at a destruction point
  spawnExplosion: (position, color) => {
    const explosion: Explosion = {
      id: `explosion-${explosionCounter++}`,
      position: { ...position },
      color,
    };
    set((state) => ({
      explosions: [...state.explosions, explosion],
    }));
  },

  // Remove explosion by ID (called by Explosion when its lifetime ends)
  removeExplosion: (id) => {
    set((state) => ({
      explosions: state.explosions.filter((e) => e.id !== id),
    }));
  },

  // Add screen-shake trauma, clamped to 1 (CameraRig consumes this)
  addTrauma: (amount) => {
    set((state) => ({
      trauma: Math.min(1, state.trauma + amount),
    }));
  },

  // Decay trauma toward 0 (called by CameraRig each frame)
  decayTrauma: (amount) => {
    set((state) => ({
      trauma: Math.max(0, state.trauma - amount),
    }));
  },

  // Clear all effects (on game reset)
  clearEffects: () => {
    set({ explosions: [], trauma: 0 });
  },
}));
