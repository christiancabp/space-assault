/**
 * Sound Manager - Web Audio playback for SFX and music
 *
 * PATTERN: Module with getState()-style access (like collision system)
 * - Plain module, no React: callable from useFrame and the collision system
 * - Gain graph: sfx/music buses -> master -> destination
 * - SFX play with slight random pitch variance so rapid fire doesn't sound robotic
 * - Music follows the game phase (start on play, duck on pause, stop on game over)
 * - Bus volumes/mutes come from settingsStore (user-adjustable, persisted);
 *   slider values are squared before hitting the gain node because perceived
 *   loudness is logarithmic - a linear mapping crams all audible change
 *   into the bottom of the slider
 *
 * RESILIENCE: every step is wrapped - if the context can't start or a file
 * fails to decode, the game simply runs silent (warnings in console).
 *
 * NOTE: Browsers create AudioContexts in a "suspended" state until a user
 * gesture. We resume inside the phase subscription, which fires synchronously
 * from the START button click / Enter keypress - a valid gesture stack.
 */

import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { GAME_CONFIG } from '../config';

export type SfxName = 'laser' | 'explosion' | 'playerHit' | 'gameOver';

const BASE = import.meta.env.BASE_URL;

const SFX_FILES: Record<SfxName, string> = {
  laser: `${BASE}sounds/laser.mp3`,
  explosion: `${BASE}sounds/explosion.mp3`,
  playerHit: `${BASE}sounds/player-hit.mp3`,
  gameOver: `${BASE}sounds/game-over.mp3`,
};

const MUSIC_FILE = `${BASE}sounds/music.mp3`;

const { AUDIO } = GAME_CONFIG;

// Module state
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let initialized = false;
let duckFactor = 1; // 1 while playing, AUDIO.pauseDuck while paused

const buffers = new Map<string, AudioBuffer>();

/** Fetch and decode one audio file into the buffer cache (silent on failure) */
async function loadBuffer(url: string): Promise<void> {
  if (!ctx || buffers.has(url)) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.arrayBuffer();
    buffers.set(url, await ctx.decodeAudioData(data));
  } catch (error) {
    console.warn(`[audio] Failed to load ${url} - continuing without it`, error);
  }
}

/**
 * Initialize the audio system (idempotent). Call once at app startup.
 * Creates the context suspended; playback resumes on the first game start.
 */
export function initAudio(): void {
  if (initialized) return;
  initialized = true;

  try {
    ctx = new AudioContext();

    masterGain = ctx.createGain();
    masterGain.gain.value = AUDIO.masterVolume;
    masterGain.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.connect(masterGain);

    musicGain = ctx.createGain();
    musicGain.connect(masterGain);
  } catch (error) {
    console.warn('[audio] Web Audio unavailable - running silent', error);
    ctx = null;
    return;
  }

  // Apply persisted user volumes/mutes now and on every settings change
  applyAudioSettings();
  useSettingsStore.subscribe(() => applyAudioSettings());

  // Preload everything in the background
  Object.values(SFX_FILES).forEach((url) => void loadBuffer(url));
  void loadBuffer(MUSIC_FILE);

  // Music + stingers follow the game phase
  useGameStore.subscribe((state, prevState) => {
    if (state.phase === prevState.phase) return;
    handlePhaseChange(state.phase, prevState.phase);
  });
}

/** Play a one-shot sound effect with slight random pitch variance */
export function playSfx(name: SfxName): void {
  if (!ctx || !sfxGain) return;
  const buffer = buffers.get(SFX_FILES[name]);
  if (!buffer) return;

  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value =
      1 + (Math.random() * 2 - 1) * AUDIO.pitchVariance;
    source.connect(sfxGain);
    source.start();
  } catch (error) {
    console.warn(`[audio] Failed to play ${name}`, error);
  }
}

function startMusic(): void {
  if (!ctx || !musicGain) return;
  const buffer = buffers.get(MUSIC_FILE);
  if (!buffer) return;

  stopMusic();
  try {
    musicSource = ctx.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true;
    musicSource.connect(musicGain);
    musicSource.start();
  } catch (error) {
    console.warn('[audio] Failed to start music', error);
  }
}

function stopMusic(): void {
  if (musicSource) {
    try {
      musicSource.stop();
    } catch {
      // Already stopped - fine
    }
    musicSource = null;
  }
}

/**
 * Apply user volume/mute settings (and the pause duck) to the buses.
 * Squares the slider values for a perceptually even loudness ramp;
 * short setTargetAtTime ramps avoid clicks.
 */
function applyAudioSettings(): void {
  if (!ctx || !sfxGain || !musicGain) return;
  const { musicVolume, sfxVolume, musicMuted, sfxMuted } =
    useSettingsStore.getState();

  const sfx = sfxMuted ? 0 : sfxVolume * sfxVolume;
  const music = musicMuted ? 0 : musicVolume * musicVolume * duckFactor;

  sfxGain.gain.setTargetAtTime(sfx, ctx.currentTime, 0.1);
  musicGain.gain.setTargetAtTime(music, ctx.currentTime, 0.1);
}

function handlePhaseChange(phase: string, prevPhase: string): void {
  if (!ctx) return;

  switch (phase) {
    case 'playing':
      // Phase changes fire synchronously from a click/keypress, so this
      // resume() happens inside a valid user gesture
      void ctx.resume().catch(() => {});
      duckFactor = 1;
      applyAudioSettings();
      if (prevPhase !== 'paused') {
        startMusic();
      }
      break;

    case 'paused':
      duckFactor = AUDIO.pauseDuck;
      applyAudioSettings();
      break;

    case 'gameOver':
      stopMusic();
      playSfx('gameOver');
      break;

    default: // 'menu', 'shipSelect'
      stopMusic();
      break;
  }
}
