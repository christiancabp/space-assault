/**
 * Shared types for the AI pilot feature.
 *
 * `PilotState` is the compact, human-readable snapshot the browser sends to
 * `/api/pilot`. `PilotDecision` is the normalized result the function returns,
 * composed from Jev's typed answers. The Vercel function (`api/pilot.ts`)
 * mirrors these shapes — keep the two in sync.
 */

export type HorizontalMove = 'left' | 'center' | 'right';
export type VerticalMove = 'up' | 'center' | 'down';
export type PilotMode = 'attack' | 'evade';

/** One invader as a point on the readable 2D plane, plus depth and a threat flag. */
export interface PilotInvader {
  x: number;
  y: number;
  z: number;
  /** 3D distance from the ship — the proximity rating (nearest first). */
  distance: number;
  /** True while the invader is in its fast dive (`phase === 'attacking'`). */
  diving: boolean;
}

/** Compact snapshot of the game sent to the model each tick. */
export interface PilotState {
  ship: { x: number; y: number };
  playfield: { x: [number, number]; y: [number, number] };
  invaders: PilotInvader[];
}

/** Normalized decision returned by `/api/pilot` (composed from Jev's answers). */
export interface PilotDecision {
  mode: { choice: PilotMode; confidence: number };
  aimHorizontal: { choice: HorizontalMove; confidence: number };
  aimVertical: { choice: VerticalMove; confidence: number };
}
