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
    modelPath: '/models/rocketship.glb',
    transform: {
      // Scale to match game units
      scale: [0.1, 0.1, 0.1],
      // Rotate to face negative Z (toward enemies)
      rotation: [Math.PI, 0, 0],
      // Center offset if needed
      positionOffset: [0, 0, 1],
    },
    hitbox: {
      width: 1,
      height: 1,
      depth: 1,
    },
    // Single center engine at rear of ship
    engines: [
      {
        position: [0, 0, 1],
        scale: 1.4,
        color: '#ff6600' // Optional: override default flame color
      },
    ],
  },

  'guardians-ship': {
    id: 'guardians-ship',
    displayName: 'Milano',
    modelPath: '/models/guardians-ship.glb',
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

  'planet-express': {
    id: 'planet-express',
    displayName: 'Planet Express',
    modelPath: '/models/planet-express.glb',
    transform: {
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
    modelPath: '/models/rick-n-morty.glb',
    transform: {
      // Raw model: 219 x 174 x 200, centered, sits 47 units up
      scale: [0.01, 0.01, 0.01],
      rotation: [0, Math.PI, 0],
      positionOffset: [0, -0.66, 0],
    },
    hitbox: {
      width: 2,
      height: 2,
      depth: 2,
    },
    // Dual rear thruster
    engines: [
      {
        position: [0.9, 0.05, 0.4],
        scale: 1.3,
        color: '#7fff00'
      },
      {
        position: [-0.9, 0.05, 0.4],
        scale: 1.3,
        color: '#7fff00'
      },
    ],
  },

  'sayan-capsule': {
    id: 'sayan-capsule',
    displayName: 'Saiyan Capsule',
    modelPath: '/models/sayan-capsule.glb',
    transform: {
      // Raw model: 0.72 unit sphere, perfectly centered
      scale: [1, 1, 1],
      rotation: [0, Math.PI, 0],
      positionOffset: [0, 0, 0],
    },
    hitbox: {
      width: 1,
      height: 1,
      depth: 1,
    },
    // Single rear thruster
    engines: [
      {
        position: [0, 0, 0.5],
        scale: 3,
        color: '#ffffff'
      },
    ],
  },

  'space-shuttle': {
    id: 'space-shuttle',
    displayName: 'Space Shuttle',
    modelPath: '/models/space-shuttle.glb',
    transform: {
      // Raw model: 81 x 30 x 51, slightly off-center
      scale: [0.04, 0.04, 0.04],
      rotation: [0, -Math.PI/2, 0],
      positionOffset: [0, 0, -0.1],
    },
    hitbox: {
      width: 2,
      height: 1.2,
      depth: 2,
    },
    // Three main engines clustered at rear
    engines: [
      {
        position: [0, 0.15, 1.5],
        scale: 1,
        color: '#ffaa33'
      },
      {
        position: [-0.19, -0.1, 1.5],
        scale: 1,
        color: '#ffaa33'
      },
      {
        position: [0.19, -0.1, 1.5],
        scale: 1,
        color: '#ffaa33'
      },
    ],
  },

  starship: {
    id: 'starship',
    displayName: 'Starship',
    modelPath: '/models/starship.glb',
    transform: {
      // Raw model: 2000 x 5318 x 1105 — modeled vertically (nose up),
      // rotated -90° on X so the nose points toward enemies (-Z)
      scale: [0.0006, 0.0006, 0.0006],
      rotation: [-Math.PI / 2, 0, 0],
      positionOffset: [0, 0.01, -1.59],
    },
    hitbox: {
      width: 1,
      height: 0.7,
      depth: 3,
    },
    // Raptor engine cluster at rear
    engines: [
      {
        position: [0, 0, 2],
        scale: 2.5,
        color: '#9955ff'
      },
    ],
  },

  'tie-fighter': {
    id: 'tie-fighter',
    displayName: 'TIE Fighter',
    modelPath: '/models/tie-fighter.glb',
    transform: {
      // Raw model: 5.8 x 6.6 x 5.5, off-center at [2.135, 2.424, -2.022]
      // positionOffset = -(rotation × scale × model center) — recompute if rotation changes
      scale: [0.45, 0.45, 0.45],
      rotation: [Math.PI / 2, 0, 0],
      positionOffset: [-0.9, 1.1, -1],
    },
    hitbox: {
      width: 2,
      height: 2,
      depth: 2,
    },
    // Twin ion engines at rear of pod
    engines: [
      {
        position: [0, 0, 0.5],
        scale: 2,
        color: '#9955ff'
      },
    ],
  },

  'time-machine': {
    id: 'time-machine',
    displayName: 'Time Machine',
    modelPath: '/models/time-machine.glb',
    transform: {
      // Raw model: 5.9 x 4.1 x 5.9, sits 2.6 units up
      scale: [0.5, 0.5, 0.5],
      rotation: [(-Math.PI / 2), 0, 0],
      positionOffset: [0, 0, 1],
    },
    hitbox: {
      width: 3,
      height: 2,
      depth: 2.9,
    },
    // Single thruster under the pod
    engines: [
      {
        position: [0,0.65,0.5],
        scale: 1.2,
        color: '#ffee44'
      },
      {
        position: [0.6,0.2,0.5],
        scale: 1.2,
        color: '#ffee44'
      },
      {
        position: [-0.6,0.2,0.5],
        scale: 1.2,
        color: '#ffee44'
      },
      {
        position: [0.4, -0.5, 0.5],
        scale: 1.2,
        color: '#ffee44'
      },
      {
        position: [-0.4, -0.5, 0.5],
        scale: 1.2,
        color: '#ffee44'
      },
    ],
  },
};

// Roster order for browsing in the ship selector (most popular first)
export const SHIP_IDS: ShipId[] = [
  'starship',
  'tie-fighter',
  'rocketship',
  'guardians-ship',
  'planet-express',
  'rick-n-morty',
  'sayan-capsule',
  'space-shuttle',
  'time-machine',
];

// Default ship when no selection made
export const DEFAULT_SHIP_ID: ShipId = 'starship';

// Helper to get config with fallback
export function getShipConfig(shipId: ShipId): ShipConfig {
  return SHIP_CONFIGS[shipId] ?? SHIP_CONFIGS[DEFAULT_SHIP_ID];
}
