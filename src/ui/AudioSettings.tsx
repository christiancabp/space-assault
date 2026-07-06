/**
 * AudioSettings - Music/SFX volume sliders with mute toggles
 *
 * Shared panel rendered on the start menu and pause screen.
 * Binds directly to settingsStore; soundManager subscribes to the same
 * store and applies changes to its gain buses, so sliders take effect
 * live (including mid-game from the pause screen).
 */

import { useSettingsStore } from '../stores/settingsStore';

interface VolumeRowProps {
  label: string;
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMuted: () => void;
}

function VolumeRow({ label, volume, muted, onVolumeChange, onToggleMuted }: VolumeRowProps) {
  return (
    <div className="audio-row">
      <span className="audio-label">{label}</span>
      <button
        type="button"
        className="audio-mute"
        onClick={onToggleMuted}
        aria-label={`${muted ? 'Unmute' : 'Mute'} ${label.toLowerCase()}`}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        className="audio-slider"
        min={0}
        max={100}
        value={Math.round(volume * 100)}
        disabled={muted}
        onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
        aria-label={`${label} volume`}
      />
    </div>
  );
}

export function AudioSettings() {
  const musicVolume = useSettingsStore((state) => state.musicVolume);
  const sfxVolume = useSettingsStore((state) => state.sfxVolume);
  const musicMuted = useSettingsStore((state) => state.musicMuted);
  const sfxMuted = useSettingsStore((state) => state.sfxMuted);
  const setMusicVolume = useSettingsStore((state) => state.setMusicVolume);
  const setSfxVolume = useSettingsStore((state) => state.setSfxVolume);
  const toggleMusicMuted = useSettingsStore((state) => state.toggleMusicMuted);
  const toggleSfxMuted = useSettingsStore((state) => state.toggleSfxMuted);

  return (
    <div className="audio-settings">
      <h2>AUDIO</h2>
      <VolumeRow
        label="Music"
        volume={musicVolume}
        muted={musicMuted}
        onVolumeChange={setMusicVolume}
        onToggleMuted={toggleMusicMuted}
      />
      <VolumeRow
        label="Effects"
        volume={sfxVolume}
        muted={sfxMuted}
        onVolumeChange={setSfxVolume}
        onToggleMuted={toggleSfxMuted}
      />
    </div>
  );
}
