/**
 * AiStats - live AI pilot telemetry on the HUD.
 *
 * Desktop: a compact panel under the score (always shown once the pilot runs).
 * Mobile (coarse pointer): hidden behind a 📊 performance icon that toggles a
 * small overlay — see the `@media (pointer: ...)` rules in index.css.
 *
 * Values are recomputed on a timer (not in render) so the component stays pure
 * and the live rates tick smoothly. Engaged-time is live: committed engagedMs
 * plus the current running segment (engageStartedAt).
 */

import { useEffect, useState } from 'react';
import { useAiPilotStore } from '../stores/aiPilotStore';
import { useGameStore } from '../stores/gameStore';
import { isTouchDevice } from '../input/touchInput';
import { GAME_CONFIG } from '../config';

interface LiveStats {
  kills: number;
  escapes: number;
  killRate: number;
  decisionsPerSec: number;
  requestsPerSec: number;
  decisions: number;
  engagedSec: number;
}

const REFRESH_MS = 250;

export function AiStats() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    const compute = () => {
      const ai = useAiPilotStore.getState();
      const game = useGameStore.getState();

      // Nothing to show until the pilot has actually run this game.
      if (!ai.enabled && ai.requests === 0) {
        setStats(null);
        return;
      }

      const kills = Math.round(game.score / GAME_CONFIG.POINTS_PER_ENEMY);
      const escapes = Math.round(game.enemyScore / 10);
      const liveMs =
        ai.engagedMs +
        (ai.engageStartedAt !== null ? Date.now() - ai.engageStartedAt : 0);
      const sec = liveMs / 1000;

      setStats({
        kills,
        escapes,
        killRate:
          kills + escapes > 0
            ? Math.round((kills / (kills + escapes)) * 100)
            : 100,
        decisionsPerSec: sec > 0 ? ai.decisions / sec : 0,
        requestsPerSec: sec > 0 ? ai.requests / sec : 0,
        decisions: ai.decisions,
        engagedSec: sec,
      });
    };

    compute();
    const handle = setInterval(compute, REFRESH_MS);
    return () => clearInterval(handle);
  }, []);

  if (!stats) return null;

  return (
    <div className="ai-stats-hud">
      {/* Touch devices: tuck the panel behind a 📊 icon. Desktop: always shown. */}
      {isTouchDevice && (
        <button
          className="ai-stats-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle AI performance stats"
        >
          📊
        </button>
      )}

      {(!isTouchDevice || open) && (
        <div className="ai-stats-panel">
          <div className="ai-stats-title">AI PILOT · LIVE</div>
        <div className="ai-stat-row">
          <span>Kills / escapes</span>
          <span>
            {stats.kills} / {stats.escapes}
          </span>
        </div>
        <div className="ai-stat-row">
          <span>Kill rate</span>
          <span>{stats.killRate}%</span>
        </div>
        <div className="ai-stat-row">
          <span>Decisions/s</span>
          <span>{stats.decisionsPerSec.toFixed(1)}</span>
        </div>
        <div className="ai-stat-row">
          <span>Requests/s</span>
          <span>{stats.requestsPerSec.toFixed(1)}</span>
        </div>
        <div className="ai-stat-row">
          <span>Decisions</span>
          <span>{stats.decisions}</span>
        </div>
        <div className="ai-stat-row">
          <span>Engaged</span>
          <span>{stats.engagedSec.toFixed(0)}s</span>
        </div>
        </div>
      )}
    </div>
  );
}
