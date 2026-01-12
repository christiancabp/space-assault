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
import type { ShipId } from '../types/ship.types';
import { GAME_CONFIG } from '../config';
import { DEFAULT_SHIP_ID } from '../config';

interface PlayerState {
  // Position synced from Player component
  position: Vector3;

  // Brief invulnerability after getting hit
  isInvulnerable: boolean;

  // Barrel roll state (also grants invincibility)
  isBarrelRolling: boolean;

  // Selected ship for player
  selectedShipId: ShipId;

  // Actions
  setPosition: (pos: Partial<Vector3>) => void;
  setInvulnerable: (value: boolean) => void;
  setBarrelRolling: (value: boolean) => void;
  setShipId: (id: ShipId) => void;
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
  isBarrelRolling: false,
  selectedShipId: DEFAULT_SHIP_ID,

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

  // Toggle barrel rolling state (grants invincibility)
  setBarrelRolling: (value) => {
    set({ isBarrelRolling: value });
  },

  // Select a ship
  setShipId: (id) => {
    set({ selectedShipId: id });
  },

  // Reset player to starting position
  resetPlayer: () => {
    set({
      position: { ...INITIAL_POSITION },
      isInvulnerable: false,
      isBarrelRolling: false,
    });
  },
}));
