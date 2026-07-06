/**
 * Play Area Store - Current playable bounds at the player's plane
 *
 * PATTERN: Zustand store read via getState() in useFrame (like enemyStore)
 * - PlayAreaManager recomputes bounds when the viewport changes
 * - Player clamps movement to these bounds; enemy spawns clamp their ranges
 *
 * Defaults to the designed PLAYER_BOUNDS; on narrow (portrait) viewports the
 * visible frustum is thinner than the designed area, so bounds shrink to
 * whatever is actually on screen - the ship can never leave the view.
 */

import { create } from 'zustand';
import { GAME_CONFIG } from '../config';

export interface PlayBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface PlayAreaState {
  bounds: PlayBounds;
  setBounds: (bounds: PlayBounds) => void;
}

export const usePlayAreaStore = create<PlayAreaState>((set) => ({
  bounds: { ...GAME_CONFIG.PLAYER_BOUNDS },

  setBounds: (bounds) => {
    set({ bounds });
  },
}));
