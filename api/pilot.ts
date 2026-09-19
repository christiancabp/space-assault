/**
 * /api/pilot — TypeSafe (Jev) autopilot decision proxy.
 *
 * Runs server-side on Vercel's Node runtime so the TYPESAFE_API_KEY never
 * reaches the browser. The browser POSTs a compact game-state snapshot; this
 * function asks Jev four parallel questions (mode / horizontal / vertical / fire)
 * and returns a normalized decision. The question wording here is the main lever
 * for how the pilot behaves — tune it freely.
 *
 * Request  body: { state: PilotState }   (see src/ai/types.ts)
 * Response body: { mode, aimHorizontal, aimVertical, fire }  (PilotDecision)
 *
 * NOTE: this file is built by Vercel, not by the app's `tsc` (tsconfig excludes
 * /api). Keep the response shape in sync with src/ai/types.ts by hand.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { EntryType } from '@typesafe-ai/sdk';
import { choice, noul, TypeSafeClient, APIError } from '@typesafe-ai/sdk';

// One client reused across warm invocations. Reads TYPESAFE_API_KEY from env.
let cachedClient: TypeSafeClient | null = null;
function getClient(): TypeSafeClient {
  if (!cachedClient) {
    cachedClient = new TypeSafeClient({
      // Fail a single attempt fast; the game simply re-decides on the next tick.
      timeout: 4000,
      retry: { maxRetries: 1 },
    });
  }
  return cachedClient;
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
  fire: noul(
    "Is an invader lined up close to directly ahead of the ship right now, so firing would hit it? This is true only when the ship and an invader share nearly the same x and y."
  ),
};

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

  if (!process.env.TYPESAFE_API_KEY) {
    res
      .status(500)
      .json({ error: 'TYPESAFE_API_KEY is not configured on the server' });
    return;
  }

  try {
    const { answers, usage } = await getClient().systemOne({
      state: state as EntryType,
      questions,
    });

    // Server-side visibility only (helps watch token spend during dev).
    console.info(
      `[pilot] tokens in=${usage.input_tokens} out=${usage.output_tokens}`
    );

    res.status(200).json({
      mode: {
        choice: answers.mode.choice,
        confidence: answers.mode.confidence,
      },
      aimHorizontal: {
        choice: answers.aim_horizontal.choice,
        confidence: answers.aim_horizontal.confidence,
      },
      aimVertical: {
        choice: answers.aim_vertical.choice,
        confidence: answers.aim_vertical.confidence,
      },
      fire: { probability: answers.fire.noul },
    });
  } catch (err) {
    const status = err instanceof APIError ? err.status : 502;
    console.error('[pilot] upstream error', err);
    res.status(status >= 400 && status < 600 ? status : 502).json({
      error: 'AI pilot upstream error',
    });
  }
}
