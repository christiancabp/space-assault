/**
 * Watermark - Developer authorship signature
 *
 * A subtle HUD-style corner mark shown on non-gameplay screens (menu,
 * ship-select, game-over) that credits the game's author with links out
 * to their GitHub and portfolio. Purely presentational.
 *
 * Icons are inline SVG (no external requests, survives the strict asset
 * setup) and tint via `currentColor`, so they inherit the link's accent
 * color and hover glow. Outbound links mirror CreditsScreen's pattern:
 * target="_blank" rel="noopener noreferrer" (noopener is required for any
 * _blank link so the opened tab can't reach back through window.opener).
 */

const GITHUB_URL = 'https://github.com/christiancabp';
const WEBSITE_URL = 'https://christian-bermeo.netlify.app/';

// GitHub "octocat" mark (official 16x16 logo path).
function GitHubIcon() {
  return (
    <svg
      className="dev-watermark-icon"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

// Classic Space Invaders "crab" sprite (11x8 pixel grid), drawn as one
// path of 1x1 cells. crispEdges keeps the pixels sharp at any scale.
function InvaderIcon() {
  return (
    <svg
      className="dev-watermark-icon invader-icon"
      viewBox="0 0 11 8"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <path
        fill="currentColor"
        d="M2 0h1v1h-1z M8 0h1v1h-1z M3 1h1v1h-1z M7 1h1v1h-1z M2 2h7v1h-7z M1 3h2v1h-2z M4 3h3v1h-3z M8 3h2v1h-2z M0 4h11v1h-11z M0 5h1v1h-1z M2 5h7v1h-7z M10 5h1v1h-1z M0 6h1v1h-1z M2 6h1v1h-1z M8 6h1v1h-1z M10 6h1v1h-1z M3 7h2v1h-2z M6 7h2v1h-2z"
      />
    </svg>
  );
}

export function Watermark() {
  return (
    <div className="dev-watermark">
      <span className="dev-watermark-name">
        <span className="dev-watermark-mark">&#9670;</span> Built by Christian Bermeo
      </span>
      <span className="dev-watermark-links">
        <a
          className="dev-watermark-link"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubIcon />
          <span>GitHub</span>
        </a>
        <span className="dev-watermark-sep" aria-hidden="true">
          &middot;
        </span>
        <a
          className="dev-watermark-link"
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <InvaderIcon />
          <span>Website</span>
        </a>
      </span>
    </div>
  );
}
