/**
 * Player Store - Player position and state
 *
 * Tracks player position for collision detection.
 * The actual mesh position is controlled via useRef in Player component,
 * but we sync it here so collision system can access it.
 *
 * PATTERN: Separating render state (useRef) from logic state (Zustand)
 * - useRef: Direct mesh manipulation in useFrame (no re-renders)
 * - Zustand: State that other systems need to read (collision detection)
 */

import { create } from 'zustand';
import type { Vector3 } from '../types/game.types';
import { GAME_CONFIG } from '../constants/gameConfig';

interface PlayerState {
  // Position synced from Player component
  position: Vector3;

  // Brief invulnerability after getting hit
  isInvulnerable: boolean;

  // Actions
  setPosition: (pos: Partial<Vector3>) => void;
  setInvulnerable: (value: boolean) => void;
  resetPlayer: () => void;
}

// Initial player position
const INITIAL_POSITION: Vector3 = {
  x: 0,
  y: 1,
  z: GAME_CONFIG.PLAYER_Z,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  position: { ...INITIAL_POSITION },
  isInvulnerable: false,

  // Update position (partial updates allowed)
  setPosition: (pos) => {
    set((state) => ({
      position: { ...state.position, ...pos },
    }));
  },

  // Toggle invulnerability (used after getting hit)
  setInvulnerable: (value) => {
    set({ isInvulnerable: value });
  },

  // Reset player to starting position
  resetPlayer: () => {
    set({
      position: { ...INITIAL_POSITION },
      isInvulnerable: false,
    });
  },
}));
