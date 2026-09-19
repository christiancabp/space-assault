/**
 * AI Pilot Store - engagement flag, decision log, and per-game session stats.
 *
 * Kept separate from gameStore so the frequently-updated decision log / stats
 * (a few times per second) only re-render the small HUD widgets, not the whole
 * game. `enabled` is transient (never persisted).
 *
 * `decisionLog` is newest-first and capped; it feeds the scrolling readout and
 * clears each game. Stats (requests / decisions / engagedMs) accumulate while
 * engaged; `engageStartedAt` is the current segment's start (null when idle) so
 * consumers can show live engaged-time = engagedMs + (now - engageStartedAt).
 * Everything resets at the start of each game (see AiPilotController).
 */

import { create } from 'zustand';
import type { PilotDecision } from '../ai/types';

export type AiPilotStatus = 'idle' | 'thinking' | 'error';

export interface DecisionLogEntry {
  id: number;
  decision: PilotDecision;
}

/** Cap the log so a long session can't grow memory unbounded (~4 min at 2/s). */
const MAX_LOG = 500;

interface AiPilotState {
  enabled: boolean;
  status: AiPilotStatus;
  decisionLog: DecisionLogEntry[]; // newest first
  decisionSeq: number; // monotonic id source for log keys

  // Per-game session stats
  requests: number; // decision requests attempted while engaged
  decisions: number; // successful decisions received (requests minus failures)
  engagedMs: number; // committed engaged wall-time from finished segments
  engageStartedAt: number | null; // start of the current segment, or null when idle

  setEnabled: (value: boolean) => void;
  toggle: () => void;
  setStatus: (status: AiPilotStatus) => void;
  pushDecision: (decision: PilotDecision) => void;

  recordRequest: () => void;
  recordDecision: () => void;
  addEngaged: (ms: number) => void;
  setEngageStart: (ts: number | null) => void;
  resetStats: () => void;
}

export const useAiPilotStore = create<AiPilotState>((set) => ({
  enabled: false,
  status: 'idle',
  decisionLog: [],
  decisionSeq: 0,

  requests: 0,
  decisions: 0,
  engagedMs: 0,
  engageStartedAt: null,

  setEnabled: (value) => set({ enabled: value }),
  toggle: () => set((state) => ({ enabled: !state.enabled })),
  setStatus: (status) => set({ status }),
  pushDecision: (decision) =>
    set((state) => {
      const id = state.decisionSeq + 1;
      return {
        decisionSeq: id,
        decisionLog: [{ id, decision }, ...state.decisionLog].slice(0, MAX_LOG),
      };
    }),

  recordRequest: () => set((state) => ({ requests: state.requests + 1 })),
  recordDecision: () => set((state) => ({ decisions: state.decisions + 1 })),
  addEngaged: (ms) => set((state) => ({ engagedMs: state.engagedMs + ms })),
  setEngageStart: (ts) => set({ engageStartedAt: ts }),
  resetStats: () =>
    set({
      requests: 0,
      decisions: 0,
      engagedMs: 0,
      engageStartedAt: null,
      decisionLog: [],
      decisionSeq: 0,
    }),
}));
