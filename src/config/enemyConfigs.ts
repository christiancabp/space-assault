/**
 * Enemy (Invader) Configuration
 *
 * Per-invader model transforms, hitboxes, and explosion tints —
 * mirrors the shipConfigs.ts pattern. Models live in
 * public/models/invaders/ (CC-BY-4.0 by nitwit.friends, see the
 * generated component headers in src/invaders/).
 *
 * Raw model sizes vary wildly (invader_3 is 16.5 units wide,
 * invader_5 only 0.7), so scale normalizes them all to ~1.5-2 world
 * units wide; the boss is deliberately larger. positionOffset re-centers
 * each model's measured bbox center (scripts/measure-glb.mjs).
 */

export type InvaderType = 'invader1' | 'invader3' | 'invader5' | 'boss';

export interface InvaderConfig {
  displayName: string;
  modelPath: string;
  transform: {
    scale: number;
    rotation: [number, number, number];
    positionOffset: [number, number, number];
  };
  hitbox: { width: number; height: number; depth: number };
  explosionColor: string;
}

export const INVADER_CONFIGS: Record<InvaderType, InvaderConfig> = {
  invader1: {
    displayName: 'Invader I',
    modelPath: '/models/invaders/invader_1.glb',
    transform: {
      scale: 1.6,
      rotation: [0, 0, 0],
      positionOffset: [0.08, -0.64, 0.72],
    },
    hitbox: { width: 1.76, height: 1.28, depth: 1.2 },
    explosionColor: '#7ddf64', // Arcade green
  },
  invader3: {
    displayName: 'Invader III',
    modelPath: '/models/invaders/invader_3.glb',
    transform: {
      scale: 0.11,
      rotation: [0, 0, 0],
      positionOffset: [0.5, -0.08, 0],
    },
    hitbox: { width: 1.82, height: 1.32, depth: 1.2 },
    explosionColor: '#4adfff', // Cyan
  },
  invader5: {
    displayName: 'Invader V',
    modelPath: '/models/invaders/invader_5.glb',
    transform: {
      scale: 2.1,
      rotation: [0, 0, 0],
      positionOffset: [0.1, -0.74, -0.1],
    },
    hitbox: { width: 1.47, height: 1.47, depth: 1.2 },
    explosionColor: '#e05ce3', // Magenta
  },
  boss: {
    displayName: 'Boss Invader',
    modelPath: '/models/invaders/boss_invader.glb',
    transform: {
      scale: 2.0,
      rotation: [0, 0, 0],
      positionOffset: [0.1, -0.7, -0.1],
    },
    hitbox: { width: 3.0, height: 1.4, depth: 1.2 },
    explosionColor: '#ff9944', // Menacing orange
  },
};

// Regular spawn pool (boss excluded by default - see pickInvaderType)
export const REGULAR_INVADERS: InvaderType[] = ['invader1', 'invader3', 'invader5'];

export function getInvaderConfig(type: InvaderType): InvaderConfig {
  return INVADER_CONFIGS[type];
}
