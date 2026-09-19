/**
 * Enemy lifecycle tracing — a study aid for tuning the AI pilot.
 *
 * Logs spawn / kill / escape events to the console so we can watch the flow
 * (how many invaders leak past vs. get killed). Gated by GAME_CONFIG.AI_PILOT.trace
 * so it stays silent unless we're actively studying. Temporary tooling.
 */

import { GAME_CONFIG } from '../config';

export type EnemyEventType = 'spawn' | 'kill' | 'escape';

export function traceEnemy(
  event: EnemyEventType,
  info: Record<string, unknown>
): void {
  // Dev only — never spam a production visitor's console.
  if (!import.meta.env.DEV || !GAME_CONFIG.AI_PILOT.trace) return;
  console.info(`[enemy:${event}]`, info);
}
