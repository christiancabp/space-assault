/**
 * Settings Store - User preferences (audio volumes, mutes)
 *
 * PATTERN: Zustand store with persist middleware
 * - Persisted to localStorage so settings survive reloads
 * - soundManager subscribes (outside React) and applies values to its
 *   Web Audio gain buses; UI components bind sliders/toggles via hooks
 *
 * Volumes are stored as linear slider values (0..1); the loudness
 * curve (v²) is applied in soundManager where gain is set.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GAME_CONFIG } from '../config';

interface SettingsState {
  musicVolume: number; // 0..1 slider position
  sfxVolume: number;   // 0..1 slider position
  musicMuted: boolean;
  sfxMuted: boolean;

  // Actions
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMusicMuted: () => void;
  toggleSfxMuted: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      musicVolume: GAME_CONFIG.AUDIO.musicVolume,
      sfxVolume: GAME_CONFIG.AUDIO.sfxVolume,
      musicMuted: false,
      sfxMuted: false,

      setMusicVolume: (volume) => set({ musicVolume: volume }),
      setSfxVolume: (volume) => set({ sfxVolume: volume }),
      toggleMusicMuted: () => set((state) => ({ musicMuted: !state.musicMuted })),
      toggleSfxMuted: () => set((state) => ({ sfxMuted: !state.sfxMuted })),
    }),
    { name: 'space-assault-settings' }
  )
);
