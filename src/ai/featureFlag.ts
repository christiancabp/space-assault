/**
 * The AI pilot is a hidden feature — its UI (toggle button, mini-map, live
 * readout) and the P hotkey only appear when the app is opened at the /ai-pilot
 * route. Everywhere else the game plays as normal with no trace of it.
 *
 * Computed once at load: the SPA has no client-side routing, so the path is fixed
 * for the session. Trailing slash tolerated; works under a base path too.
 */
export const AI_PILOT_UNLOCKED =
  typeof window !== 'undefined' &&
  window.location.pathname.replace(/\/+$/, '').endsWith('/ai-pilot');
