/**
 * HUD - Heads-Up Display
 *
 * Shows score, lives, and the AI pilot controls during gameplay.
 * - Score value pops (scale + glow) each time it changes: re-keying the
 *   span by score restarts its CSS animation
 * - Lives readout pulses red on the last life
 * - AI pilot: a toggle button plus a live readout of Jev's latest typed
 *   judgment ("watch it think"), isolated in AiReadout so only that small row
 *   re-renders at decision cadence
 *
 * PATTERN: HTML overlay over Canvas
 * - Uses CSS positioning (defined in index.css)
 * - Subscribes to specific store slices to minimize re-renders
 */

import { useGameStore } from '../stores/gameStore';
import { useAiPilotStore } from '../stores/aiPilotStore';
import { GAME_CONFIG } from '../config';

/**
 * Live typed-judgment readout. Subscribes to lastDecision/status so only this
 * row re-renders as decisions stream in (a few times per second).
 */
function AiReadout() {
  const decision = useAiPilotStore((state) => state.lastDecision);
  const status = useAiPilotStore((state) => state.status);

  if (status === 'error') {
    return <div className="ai-readout error">SIGNAL LOST</div>;
  }
  if (!decision) {
    return <div className="ai-readout">…THINKING</div>;
  }

  return (
    <div className={`ai-readout mode-${decision.mode.choice}`}>
      <span>MODE {decision.mode.choice}</span>
      <span>X {decision.aimHorizontal.choice}</span>
      <span>Y {decision.aimVertical.choice}</span>
      <span>FIRE ABS</span>
    </div>
  );
}

export function HUD() {
  // Subscribe only to the values we display
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const aiEnabled = useAiPilotStore((state) => state.enabled);
  const toggleAi = useAiPilotStore((state) => state.toggle);

  // Format score with leading zeros (e.g., "000100")
  const formattedScore = score.toString().padStart(6, '0');

  // Display lives as diamond symbols
  const livesDisplay = '◆'.repeat(lives);

  // "KeyP" -> "P" for the button hint
  const toggleKeyLabel = GAME_CONFIG.AI_PILOT.toggleKey.replace('Key', '');

  return (
    <>
      <div className="hud">
        <div className="score">
          SCORE:{' '}
          <span key={score} className="score-value">
            {formattedScore}
          </span>
        </div>
        <div className={`lives${lives === 1 ? ' danger' : ''}`}>
          LIVES: {livesDisplay}
        </div>
      </div>

      <div className="ai-hud">
        <button
          className={`ai-toggle${aiEnabled ? ' active' : ''}`}
          onClick={(event) => {
            toggleAi();
            // Drop focus so Space/Enter don't re-trigger the button mid-game
            event.currentTarget.blur();
          }}
        >
          {aiEnabled ? '■ AI PILOT ENGAGED' : `▶ AI PILOT  (${toggleKeyLabel})`}
        </button>
        {aiEnabled && <AiReadout />}
      </div>
    </>
  );
}
