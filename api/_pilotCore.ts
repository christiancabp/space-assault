/**
 * Shared TypeSafe decision core for the AI pilot.
 *
 * Used by BOTH the production Vercel function (api/pilot.ts) and the local Vite
 * dev middleware (vite.config.ts), so the questions + response shape live in one
 * place. The leading underscore keeps Vercel from treating this as a route.
 *
 * Calls the TypeSafe HTTP API directly with fetch (no SDK) — a thin proxy needs
 * no client library, and this avoids any dependency-bundling issues in the
 * serverless runtime. The question wording below is the main behavior lever.
 */

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
  // NOTE: no "fire" question — the pilot is always-be-shooting (holds the
  // trigger down the whole time it is engaged), so firing is decided in code.
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
    usage?: { input_tokens: number; output_tokens: number };
  };
  const a = data.answers;

  if (data.usage) {
    // Server-side visibility only (helps watch token spend during dev).
    console.info(
      `[pilot] tokens in=${data.usage.input_tokens} out=${data.usage.output_tokens}`
    );
  }

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
