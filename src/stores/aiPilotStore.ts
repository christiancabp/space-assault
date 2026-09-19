/**
 * AI Pilot Store - engagement flag, live decision, and per-game session stats.
 *
 * Kept separate from gameStore so the frequently-updated `lastDecision`/stats
 * (a few times per second) only re-render the small HUD readout / Game Over
 * panel, not the whole game. `enabled` is transient (never persisted).
 *
 * Stats (requests / decisions / engagedMs) accumulate while the pilot is engaged
 * and reset at the start of each game (see AiPilotController). They're surfaced
 * on the Game Over screen.
 */

import { create } from 'zustand';
import type { PilotDecision } from '../ai/types';

export type AiPilotStatus = 'idle' | 'thinking' | 'error';

interface AiPilotState {
  enabled: boolean;
  status: AiPilotStatus;
  lastDecision: PilotDecision | null;

  // Per-game session stats
  requests: number; // decision requests attempted while engaged
  decisions: number; // successful decisions received (requests minus failures)
  engagedMs: number; // total wall-time the pilot was actively deciding

  setEnabled: (value: boolean) => void;
  toggle: () => void;
  setStatus: (status: AiPilotStatus) => void;
  setLastDecision: (decision: PilotDecision | null) => void;

  recordRequest: () => void;
  recordDecision: () => void;
  addEngaged: (ms: number) => void;
  resetStats: () => void;
}

export const useAiPilotStore = create<AiPilotState>((set) => ({
  enabled: false,
  status: 'idle',
  lastDecision: null,

  requests: 0,
  decisions: 0,
  engagedMs: 0,

  setEnabled: (value) => set({ enabled: value }),
  toggle: () => set((state) => ({ enabled: !state.enabled })),
  setStatus: (status) => set({ status }),
  setLastDecision: (decision) => set({ lastDecision: decision }),

  recordRequest: () => set((state) => ({ requests: state.requests + 1 })),
  recordDecision: () => set((state) => ({ decisions: state.decisions + 1 })),
  addEngaged: (ms) => set((state) => ({ engagedMs: state.engagedMs + ms })),
  resetStats: () =>
    set({ requests: 0, decisions: 0, engagedMs: 0, lastDecision: null }),
}));
