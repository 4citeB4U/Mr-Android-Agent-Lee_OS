/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UTILS.AUDIO.MANAGER
TAG: UTILS.AUDIO.MANAGER.CORE

5WH:
WHAT = Core audio manager — preloads, plays, stops, and controls volume for all app sounds
WHY = Centralizes all audio asset management to avoid duplicate HTMLAudioElement instances
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = utils/audioManager.ts
WHEN = 2026
HOW = Singleton object with a sound registry keyed by name, loaded from /sound/

LICENSE:
MIT
*/

const sounds: Record<string, HTMLAudioElement> = {};

export const SOUND_KEYS = {
  appLoading:       'appLoading',
  appOpen:          'appOpen',
  buttonClick:      'buttonClick',
  navClick:         'navClick',
  universeIntro:    'universeIntro',
  universeAmbient:  'universeAmbient',
  universeCar:      'universeCar',
  universeExit:     'universeExit',
  settingsOpen:     'settingsOpen',
  idle:             'idle',
} as const;

export type SoundKey = keyof typeof SOUND_KEYS;

const SOUND_FILES: Record<string, string> = {
  appLoading:      '/sound/introtoapp.wav',
  appOpen:         '/sound/introtoagentlee.wav',
  buttonClick:     '/sound/buttonsound3.wav',
  navClick:        '/sound/button4.wav',
  universeIntro:   '/sound/Universe-intro.wav',
  universeAmbient: '/sound/otnoise.wav',
  universeCar:     '/sound/universe-car.wav',
  universeExit:    '/sound/buttonsound2.mp3',
  settingsOpen:    '/sound/settingsopening.wav',
  idle:            '/sound/introtoapp.wav',
};

export const audioManager = {
  /**
   * Preload all registered audio assets into memory.
   * Call once on app boot.
   */
  preload() {
    Object.entries(SOUND_FILES).forEach(([key, src]) => {
      if (!sounds[key]) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        sounds[key] = audio;
      }
    });
  },

  /**
   * Play a sound once (not looped).
   */
  play(name: string) {
    const audio = sounds[name];
    if (!audio) return;
    audio.loop = false;
    // Clone to allow overlapping short sounds (buttons)
    if (name === 'buttonClick' || name === 'navClick') {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(() => {});
    } else {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  },

  /**
   * Play a sound looped at a given volume (0–1).
   */
  playLoop(name: string, volume = 1.0) {
    const audio = sounds[name];
    if (!audio) return;
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, volume));
    if (audio.paused) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  },

  /**
   * Stop a sound and reset its position.
   */
  stop(name: string) {
    const audio = sounds[name];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  },

  /**
   * Stop ALL registered sounds immediately.
   */
  stopAll() {
    Object.values(sounds).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  },

  /**
   * Set the volume of a named sound (0–1).
   */
  setVolume(name: string, value: number) {
    const audio = sounds[name];
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, value));
  },

  /**
   * Returns true if the named sound is currently playing.
   */
  isPlaying(name: string): boolean {
    const audio = sounds[name];
    return audio ? !audio.paused && !audio.ended : false;
  },
};
