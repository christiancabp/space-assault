/**
 * Pilot client — one decision round trip to the serverless proxy.
 *
 * Posts the state snapshot to /api/pilot (same-origin, key stays server-side) and
 * returns the normalized decision. The caller supplies an AbortSignal so a slow
 * tick can be cancelled by the loop's per-tick timeout.
 */

import type { PilotState, PilotDecision } from './types';
import { GAME_CONFIG } from '../config';

export async function requestDecision(
  state: PilotState,
  signal: AbortSignal
): Promise<PilotDecision> {
  const res = await fetch(GAME_CONFIG.AI_PILOT.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`AI pilot request failed (${res.status})`);
  }

  return (await res.json()) as PilotDecision;
}
