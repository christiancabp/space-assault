/**
 * /api/pilot — TypeSafe (Jev) autopilot decision proxy (production, Vercel).
 *
 * SELF-CONTAINED on purpose: no imports besides erased type-only ones, so there
 * is nothing for the serverless bundler to trace/exclude (an earlier split into
 * an underscore-prefixed helper crashed the function at load in prod). Calls the
 * TypeSafe HTTP API directly with native fetch — a thin proxy needs no SDK.
 *
 * The named `decidePilot` export is reused by the local Vite dev middleware
 * (vite.config.ts). The default export is the Vercel handler.
 *
 * NOTE: built by Vercel, not the app's tsc (tsconfig excludes /api). Keep the
 * response shape in sync with src/ai/types.ts by hand.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

/** Normalized decision returned to the browser (mirrors src/ai/types.ts PilotDecision). */
export interface PilotDecisionResult {
  mode: { choice: string; confidence: number };
  aimHorizontal: { choice: string; confidence: number };
  aimVertical: { choice: string; confidence: number };
}

// State shape: { grid: number[][], dims: {cols,rows}, ship: {col,row} }.
// `grid` is rows from top (0) to bottom; each number is an enemy's imminence
// (0 = empty, 9 = about to reach and pass the ship). Only the ship moves.
const questions = {
  mode: {
    type: 'choice',
    instructions:
      'You pilot a ship on a 2D grid. In `grid`, each number is an enemy\'s imminence (9 = about to reach and get PAST the ship; 0 = empty). `ship` is your cell {col,row}. Should you attack or evade? Choose "evade" ONLY as a last resort — when an enemy with imminence 8 or 9 sits in the ship\'s own column (same col), about to collide. Otherwise choose "attack".',
    criteria: {
      attack: 'No enemy is about to collide — keep hunting the invaders.',
      evade: 'An enemy is about to reach the ship in its column — dodge now.',
    },
  },
  aim_horizontal: {
    type: 'choice',
    instructions:
      "Move toward the most urgent enemy in `grid` (the highest number; if tied, the one nearest the ship). Compare that enemy's column to ship.col.",
    criteria: {
      left: "The target enemy's column is less than ship.col (it is to the left).",
      center: 'The target enemy is in the same column as the ship.',
      right: "The target enemy's column is greater than ship.col (it is to the right).",
    },
  },
  aim_vertical: {
    type: 'choice',
    instructions:
      "Move toward the most urgent enemy's ROW. IMPORTANT: row 0 is the TOP of the grid, so moving UP means a SMALLER row number. Compare the target enemy's row to ship.row.",
    criteria: {
      up: "The target enemy's row is less than ship.row (higher up, smaller row number).",
      center: 'The target enemy is in the same row as the ship.',
      down: "The target enemy's row is greater than ship.row (lower down, larger row number).",
    },
  },
  // NOTE: no "fire" question — the pilot is always-be-shooting, so firing is decided in code.
};

interface ChoiceAnswer {
  choice: string;
  confidence: number;
}

/** Ask Jev the three questions over `state` and return a normalized decision. */
export async function decidePilot(
  state: unknown,
  apiKey: string
): Promise<PilotDecisionResult> {
  const res = await fetch(TYPESAFE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state, model: 'jev-latest', questions }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`TypeSafe ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    answers: {
      mode: ChoiceAnswer;
      aim_horizontal: ChoiceAnswer;
      aim_vertical: ChoiceAnswer;
    };
  };
  const a = data.answers;

  return {
    mode: { choice: a.mode.choice, confidence: a.mode.confidence },
    aimHorizontal: {
      choice: a.aim_horizontal.choice,
      confidence: a.aim_horizontal.confidence,
    },
    aimVertical: {
      choice: a.aim_vertical.choice,
      confidence: a.aim_vertical.confidence,
    },
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as { state?: unknown } | undefined;
  const state = body?.state;
  if (state === null || typeof state !== 'object') {
    res.status(400).json({ error: 'Missing or invalid "state" in request body' });
    return;
  }

  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'TYPESAFE_API_KEY is not configured on the server' });
    return;
  }

  try {
    const decision = await decidePilot(state, apiKey);
    res.status(200).json(decision);
  } catch (err) {
    console.error('[pilot] upstream error', err);
    res.status(502).json({ error: 'AI pilot upstream error' });
  }
}
