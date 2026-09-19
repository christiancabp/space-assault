/**
 * AI Pilot Store - engagement flag + live decision for the HUD.
 *
 * Kept separate from gameStore so the frequently-updated `lastDecision` (a few
 * times per second) only re-renders the small HUD readout, not the whole game.
 * `enabled` is transient (never persisted). The controller flips it back off when
 * the pilot hits its per-engage request cap, and a movement key hands control back.
 */

import { create } from 'zustand';
import type { PilotDecision } from '../ai/types';

export type AiPilotStatus = 'idle' | 'thinking' | 'error';

interface AiPilotState {
  enabled: boolean;
  status: AiPilotStatus;
  lastDecision: PilotDecision | null;

  setEnabled: (value: boolean) => void;
  toggle: () => void;
  setStatus: (status: AiPilotStatus) => void;
  setLastDecision: (decision: PilotDecision | null) => void;
}

export const useAiPilotStore = create<AiPilotState>((set) => ({
  enabled: false,
  status: 'idle',
  lastDecision: null,

  setEnabled: (value) => set({ enabled: value }),
  toggle: () => set((state) => ({ enabled: !state.enabled })),
  setStatus: (status) => set({ status }),
  setLastDecision: (decision) => set({ lastDecision: decision }),
}));
