/**
 * Game Store - Central game state management
 *
 * Handles the game state machine (menu → playing → gameOver),
 * score tracking, and player lives.
 *
 * PATTERN: Zustand store with actions
 * - State is accessed via hooks: useGameStore(state => state.score)
 * - Actions modify state: useGameStore.getState().addScore(100)
 * - Can be accessed outside React: useGameStore.getState()
 */

import { create } from 'zustand';
import type { GamePhase } from '../types/game.types';
import { GAME_CONFIG } from '../constants/gameConfig';

interface GameState {
  // State
  phase: GamePhase;
  score: number;
  lives: number;

  // Actions
  startGame: () => void;
  endGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  phase: 'menu',
  score: 0,
  lives: GAME_CONFIG.PLAYER_START_LIVES,

  // Start a new game
  startGame: () => {
    set({
      phase: 'playing',
      score: 0,
      lives: GAME_CONFIG.PLAYER_START_LIVES,
    });
  },

  // End the game (player lost all lives)
  endGame: () => {
    set({ phase: 'gameOver' });
  },

  // Pause gameplay
  pauseGame: () => {
    if (get().phase === 'playing') {
      set({ phase: 'paused' });
    }
  },

  // Resume from pause
  resumeGame: () => {
    if (get().phase === 'paused') {
      set({ phase: 'playing' });
    }
  },

  // Add points to score
  addScore: (points: number) => {
    set((state) => ({ score: state.score + points }));
  },

  // Lose a life - triggers game over if no lives left
  loseLife: () => {
    const currentLives = get().lives;
    if (currentLives <= 1) {
      // Last life lost - game over
      set({ lives: 0, phase: 'gameOver' });
    } else {
      set({ lives: currentLives - 1 });
    }
  },

  // Reset to initial state (back to menu)
  resetGame: () => {
    set({
      phase: 'menu',
      score: 0,
      lives: GAME_CONFIG.PLAYER_START_LIVES,
    });
  },
}));
