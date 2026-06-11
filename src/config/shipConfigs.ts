/**
 * Ship Configurations - Transform, hitbox, and engine data for each ship
 *
 * Each ship needs different adjustments based on how the 3D model was created.
 * Engine mounts define where propulsion effects will appear (future feature).
 */

import type { ShipId, ShipConfig } from '../types/ship.types';

// Ship configurations indexed by ShipId
export const SHIP_CONFIGS: Record<ShipId, ShipConfig> = {
  rocketship: {
    id: 'rocketship',
    displayName: 'Rocketship',
    transform: {
      // Scale to match game units
      scale: [0.1, 0.1, 0.1],
      // Rotate to face negative Z (toward enemies)
      rotation: [Math.PI, 0, 0],
      // Center offset if needed
      positionOffset: [0, 0, 0],
    },
    hitbox: {
      width: 1,
      height: 1,
      depth: 1,
    },
    // Single center engine at rear of ship
    engines: [
      {
        position: [0, 0, 0],
        scale: 1.2,
        color: '#ff6600' // Optional: override default flame color
      },
    ],
  },

  'guardians-ship': {
    id: 'guardians-ship',
    displayName: 'Milano',
    transform: {
      // Scale to match game units (adjust as needed)
      scale: [0.0006, 0.0006, 0.0006],
      // Rotate to face negative Z (toward enemies)
      rotation: [0, 0, 0],
      // Center offset if needed
      positionOffset: [0, 0, 0],
    },
    hitbox: {
      width: 2.5,
      height: 1,
      depth: 3,
    },
    // Twin wing engines
    engines: [
      {
        position: [-0.3, 0, 0.6],
        scale: 1.2,
        color: '#00aaff'
      },
      {
        position: [0.3, 0, 0.6],
        scale: 1.2,
        color: '#00aaff'
      },
    ],
  },

  // ── New ships below: scale/offset derived from measured GLB bounding boxes
  // (scripts/measure-glb.mjs) so each ship starts at ~3 game units across.
  // Rotation, engine mounts, and fine-tuning still need in-game adjustment.

  'planet-express': {
    id: 'planet-express',
    displayName: 'Planet Express',
    transform: {
      // Raw model: 57.3 x 26.9 x 19.2, off-center at [-4.4, -51.5, -50.9]
      // positionOffset = -(rotation × scale × model center) — recompute if rotation changes
      scale: [0.07, 0.07, 0.07],
      rotation: [0, Math.PI / 2, 0],
      positionOffset: [3.56, 3.61, -0.31],
    },
    hitbox: {
      width: 1.3,
      height: 1.9,
      depth: 3,
    },
    // Single rear engine
    engines: [
      {
        position: [-0.1, -0.2, 1.3],
        scale: 1.6,
        color: '#3399ff'
      },
    ],
  },

  'rick-n-morty': {
    id: 'rick-n-morty',
    displayName: "Rick's Ship",
    transform: {
      // Raw model: 219 x 174 x 200, centered, sits 47 units up
      scale: [0.01, 0.01, 0.01],
      rotation: [0, Math.PI, 0],
      positionOffset: [0, -0.66, 0],
    },
    hitbox: {
      width: 3,
      height: 2.4,
      depth: 2,
    },
    // Single rear thruster
    engines: [
      {
        position: [0.9, 0.05, 0.6],
        scale: 1.3,
        color: '#7fff00'
      },
      {
        position: [-0.9, 0.05, 0.6],
        scale: 1.3,
        color: '#7fff00'
      },
    ],
  },

  'sayan-capsule': {
    id: 'sayan-capsule',
    displayName: 'Saiyan Capsule',
    transform: {
      // Raw model: 0.72 unit sphere, perfectly centered
      scale: [4, 4, 4],
      rotation: [0, 0, 0],
      positionOffset: [0, 0, 0],
    },
    hitbox: {
      width: 2.9,
      height: 2.9,
      depth: 2.9,
    },
    // Single rear thruster
    engines: [
      {
        position: [0, 0, 1.5],
        scale: 1.2,
        color: '#ff6600'
      },
    ],
  },

  'space-shuttle': {
    id: 'space-shuttle',
    displayName: 'Space Shuttle',
    transform: {
      // Raw model: 81 x 30 x 51, slightly off-center
      scale: [0.04, 0.04, 0.04],
      rotation: [0, 0, 0],
      positionOffset: [-0.16, -0.32, 0],
    },
    hitbox: {
      width: 3.2,
      height: 1.2,
      depth: 2,
    },
    // Three main engines clustered at rear
    engines: [
      {
        position: [0, 0.2, 1],
        scale: 1,
        color: '#ffaa33'
      },
      {
        position: [-0.25, -0.1, 1],
        scale: 1,
        color: '#ffaa33'
      },
      {
        position: [0.25, -0.1, 1],
        scale: 1,
        color: '#ffaa33'
      },
    ],
  },

  starship: {
    id: 'starship',
    displayName: 'Starship',
    transform: {
      // Raw model: 2000 x 5318 x 1105 — modeled vertically (nose up),
      // rotated -90° on X so the nose points toward enemies (-Z)
      scale: [0.0006, 0.0006, 0.0006],
      rotation: [-Math.PI / 2, 0, 0],
      positionOffset: [0, 0.01, -1.59],
    },
    hitbox: {
      width: 1.2,
      height: 0.7,
      depth: 3.2,
    },
    // Raptor engine cluster at rear
    engines: [
      {
        position: [0, 0, 1.6],
        scale: 1.4,
        color: '#9955ff'
      },
    ],
  },

  'tie-fighter': {
    id: 'tie-fighter',
    displayName: 'TIE Fighter',
    transform: {
      // Raw model: 5.8 x 6.6 x 5.5, off-center at [2.1, 2.4, -2.0]
      scale: [0.45, 0.45, 0.45],
      rotation: [0, 0, 0],
      positionOffset: [-0.96, -1.09, 0.91],
    },
    hitbox: {
      width: 2.6,
      height: 3,
      depth: 2.5,
    },
    // Twin ion engines at rear of pod
    engines: [
      {
        position: [-0.2, 0, 1.3],
        scale: 1,
        color: '#00ffaa'
      },
      {
        position: [0.2, 0, 1.3],
        scale: 1,
        color: '#00ffaa'
      },
    ],
  },

  'time-machine': {
    id: 'time-machine',
    displayName: 'Time Machine',
    transform: {
      // Raw model: 5.9 x 4.1 x 5.9, sits 2.6 units up
      scale: [0.5, 0.5, 0.5],
      rotation: [0, 0, 0],
      positionOffset: [-0.08, -1.32, -0.08],
    },
    hitbox: {
      width: 3,
      height: 2,
      depth: 2.9,
    },
    // Single thruster under the pod
    engines: [
      {
        position: [0, -0.5, 1.4],
        scale: 1.2,
        color: '#ffee44'
      },
    ],
  },
};

// Default ship when no selection made
export const DEFAULT_SHIP_ID: ShipId = 'rick-n-morty';

// Helper to get config with fallback
export function getShipConfig(shipId: ShipId): ShipConfig {
  return SHIP_CONFIGS[shipId] ?? SHIP_CONFIGS[DEFAULT_SHIP_ID];
}
