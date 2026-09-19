/**
 * /api/pilot — TypeSafe (Jev) autopilot decision proxy (production, Vercel).
 *
 * Runs server-side on Vercel's Node runtime so the TYPESAFE_API_KEY never
 * reaches the browser. The browser POSTs a compact game-state snapshot; this
 * returns a normalized PilotDecision. The actual questions + response shape live
 * in ./_pilotCore.ts (shared with the local Vite dev middleware).
 *
 * NOTE: this file is built by Vercel, not by the app's `tsc` (tsconfig excludes
 * /api). Keep the response shape in sync with src/ai/types.ts by hand.
 *
 * Request  body: { state: PilotState }   (see src/ai/types.ts)
 * Response body: PilotDecision
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { decidePilot, APIError } from './_pilotCore';

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
    const decision = await decidePilot(state);
    res.status(200).json(decision);
  } catch (err) {
    const status = err instanceof APIError ? err.status : 502;
    console.error('[pilot] upstream error', err);
    res.status(status >= 400 && status < 600 ? status : 502).json({
      error: 'AI pilot upstream error',
    });
  }
}
