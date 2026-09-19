/**
 * AI Pilot input — module-level mutable control state.
 *
 * Mirrors `src/input/touchInput.ts`: the AiPilotController writes these fields at
 * decision cadence (a few times per second); Player reads them every frame while
 * the autopilot is engaged. Zero re-renders, same approach as keyboard/touch.
 *
 * moveX/moveY are normalized -1..1 (world convention: +y is up). `dodge` is a
 * one-shot: the controller sets it true to request a barrel roll; Player consumes
 * it (sets it back to false) once the roll starts.
 */

export const aiInput = {
  moveX: 0,
  moveY: 0,
  firing: false,
  dodge: false,
};

export function resetAiInput(): void {
  aiInput.moveX = 0;
  aiInput.moveY = 0;
  aiInput.firing = false;
  aiInput.dodge = false;
}
