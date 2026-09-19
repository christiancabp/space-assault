/**
 * Shared TypeSafe decision core for the AI pilot.
 *
 * Used by BOTH the production Vercel function (api/pilot.ts) and the local Vite
 * dev middleware (vite.config.ts), so the question wording and response shape
 * live in exactly one place. The leading underscore keeps Vercel from treating
 * this file as a routable serverless function.
 *
 * The question wording below is the main lever for how the pilot behaves.
 */

import type { EntryType } from '@typesafe-ai/sdk';
import { choice, TypeSafeClient, APIError } from '@typesafe-ai/sdk';

/** Normalized decision returned to the browser (mirrors src/ai/types.ts PilotDecision). */
export interface PilotDecisionResult {
  mode: { choice: string; confidence: number };
  aimHorizontal: { choice: string; confidence: number };
  aimVertical: { choice: string; confidence: number };
}

// The four judgments, asked in parallel over the same state (one ~100ms request).
// State shape: { grid: number[][], dims: {cols,rows}, ship: {col,row} }.
// `grid` is rows from top (0) to bottom; each number is an enemy's imminence
// (0 = empty, 9 = about to reach and pass the ship). Only the ship moves.
const questions = {
  mode: choice(
    'You pilot a ship on a 2D grid. In `grid`, each number is an enemy\'s imminence (9 = about to reach and get PAST the ship; 0 = empty). `ship` is your cell {col,row}. Should you attack or evade? Choose "evade" ONLY as a last resort — when an enemy with imminence 8 or 9 sits in the ship\'s own column (same col), about to collide. Otherwise choose "attack".',
    {
      attack: 'No enemy is about to collide — keep hunting the invaders.',
      evade: 'An enemy is about to reach the ship in its column — dodge now.',
    }
  ),
  aim_horizontal: choice(
    'Move toward the most urgent enemy in `grid` (the highest number; if tied, the one nearest the ship). Compare that enemy\'s column to ship.col.',
    {
      left: "The target enemy's column is less than ship.col (it is to the left).",
      center: 'The target enemy is in the same column as the ship.',
      right: "The target enemy's column is greater than ship.col (it is to the right).",
    }
  ),
  aim_vertical: choice(
    'Move toward the most urgent enemy\'s ROW. IMPORTANT: row 0 is the TOP of the grid, so moving UP means a SMALLER row number. Compare the target enemy\'s row to ship.row.',
    {
      up: "The target enemy's row is less than ship.row (higher up, smaller row number).",
      center: 'The target enemy is in the same row as the ship.',
      down: "The target enemy's row is greater than ship.row (lower down, larger row number).",
    }
  ),
  // NOTE: no "fire" question — the pilot is always-be-shooting (holds the
  // trigger down the whole time it is engaged), so firing is decided in code.
};

// One client reused across warm invocations. When apiKey is omitted the SDK
// falls back to the TYPESAFE_API_KEY environment variable.
let cachedClient: TypeSafeClient | null = null;
function getClient(apiKey?: string): TypeSafeClient {
  if (!cachedClient) {
    cachedClient = new TypeSafeClient({
      apiKey,
      // Fail a single attempt fast; the game simply re-decides on the next tick.
      timeout: 4000,
      retry: { maxRetries: 1 },
    });
  }
  return cachedClient;
}

/** Ask Jev the four questions over `state` and return a normalized decision. */
export async function decidePilot(
  state: unknown,
  apiKey?: string
): Promise<PilotDecisionResult> {
  const { answers, usage } = await getClient(apiKey).systemOne({
    state: state as EntryType,
    questions,
  });

  // Server-side visibility only (helps watch token spend during dev).
  console.info(
    `[pilot] tokens in=${usage.input_tokens} out=${usage.output_tokens}`
  );

  return {
    mode: { choice: answers.mode.choice, confidence: answers.mode.confidence },
    aimHorizontal: {
      choice: answers.aim_horizontal.choice,
      confidence: answers.aim_horizontal.confidence,
    },
    aimVertical: {
      choice: answers.aim_vertical.choice,
      confidence: answers.aim_vertical.confidence,
    },
  };
}

export { APIError };
