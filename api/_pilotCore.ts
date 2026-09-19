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
const questions = {
  mode: choice(
    'Should the ship press the attack or evade? The ship fires forward and the ONLY danger is an invader colliding with it. Choose "evade" ONLY as a last resort: when a diving invader is very close to the ship in both x and y and its z has nearly reached the ship. Otherwise choose "attack".',
    {
      attack: 'Safe enough to hunt — no invader is about to collide with the ship.',
      evade: 'A collision is imminent — a diving invader is nearly on top of the ship.',
    }
  ),
  aim_horizontal: choice(
    "Which way should the ship move horizontally to line up a shot on the NEAREST invader (the first in the list)? Bullets travel straight ahead, so the ship's x must match the target's x. Compare ship.x to that invader's x.",
    {
      left: "The nearest invader's x is less than the ship's x (it is to the left).",
      center: "The ship's x already matches the nearest invader's x.",
      right: "The nearest invader's x is greater than the ship's x (it is to the right).",
    }
  ),
  aim_vertical: choice(
    "Which way should the ship move vertically to line up with the NEAREST invader's y? Compare ship.y to that invader's y.",
    {
      up: "The nearest invader's y is greater than the ship's y (it is above).",
      center: "The ship's y already matches the nearest invader's y.",
      down: "The nearest invader's y is less than the ship's y (it is below).",
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
