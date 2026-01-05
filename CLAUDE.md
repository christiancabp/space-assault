# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Assault is a React 19 + TypeScript + Vite single-page application.

## Development Commands

```bash
npm run dev      # Start dev server with HMR (typically localhost:5173)
npm run build    # Type-check with tsc then bundle with Vite
npm run lint     # Run ESLint on all files
npm run preview  # Preview production build locally
```

## Architecture

- **Entry Point:** `src/main.tsx` creates React root and renders `App` in StrictMode to `#root`
- **Main Component:** `src/App.tsx` - functional component using hooks
- **Build:** Vite handles bundling; TypeScript handles type checking separately via `tsc -b`
- **Styling:** Global styles in `index.css`, component styles in `App.css`

## TypeScript Configuration

Uses project references with separate configs:
- `tsconfig.app.json` - App code (ES2022, strict mode fully enabled)
- `tsconfig.node.json` - Build tooling (ES2023)

All strict TypeScript flags are enabled including `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.

## Linting

ESLint uses the modern flat config format (`eslint.config.js`) with:
- typescript-eslint recommended rules
- react-hooks recommended rules
- react-refresh plugin for Vite HMR
