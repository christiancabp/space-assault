/**
 * Shared types for the AI pilot feature.
 *
 * `PilotState` is the compact 2D-grid snapshot the browser sends to `/api/pilot`.
 * `PilotDecision` is the normalized result the function returns, composed from
 * Jev's typed answers. The Vercel function (`api/pilot.ts` / `api/_pilotCore.ts`)
 * mirrors these shapes — keep the two in sync.
 */

export type HorizontalMove = 'left' | 'center' | 'right';
export type VerticalMove = 'up' | 'center' | 'down';
export type PilotMode = 'attack' | 'evade';

/**
 * The playfield as a grid the model can read at a glance. `grid` is rows from top
 * (0) to bottom; each number is an enemy's imminence (0 empty, 9 = about to reach
 * and pass the ship). `ship` is the ship's current cell.
 */
export interface PilotState {
  grid: number[][];
  dims: { cols: number; rows: number };
  ship: { col: number; row: number };
}

/** Normalized decision returned by `/api/pilot` (composed from Jev's answers). */
export interface PilotDecision {
  mode: { choice: PilotMode; confidence: number };
  aimHorizontal: { choice: HorizontalMove; confidence: number };
  aimVertical: { choice: VerticalMove; confidence: number };
}
