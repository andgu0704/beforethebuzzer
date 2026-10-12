import { create } from 'zustand';

import { kv } from '@/platform/storage';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  haptics: boolean;
  /** Simulate ahead stops at every key moment instead of resolving routine ones. */
  stopAtEveryMoment: boolean;
  clipAutoplay: boolean;
  /** Key moments end in a timing skill check (off: the odds alone decide). */
  skillChecks: boolean;
  /** One-line tips already shown, by id. */
  tipsSeen: Record<string, true>;
  lastCareer: string | null;
}

const DEFAULTS: Settings = {
  theme: 'system',
  haptics: true,
  stopAtEveryMoment: false,
  clipAutoplay: true,
  skillChecks: true,
  tipsSeen: {},
  lastCareer: null,
};

const KEY = 'settings.v1';

function load(): Settings {
  try {
    const raw = kv.get(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

interface SettingsStore extends Settings {
  update(patch: Partial<Settings>): void;
  markTip(id: string): void;
}

export const useSettings = create<SettingsStore>()((set, get) => ({
  ...load(),
  update(patch) {
    set(patch);
    const s = get();
    const plain: Settings = {
      theme: s.theme,
      haptics: s.haptics,
      stopAtEveryMoment: s.stopAtEveryMoment,
      clipAutoplay: s.clipAutoplay,
      skillChecks: s.skillChecks,
      tipsSeen: s.tipsSeen,
      lastCareer: s.lastCareer,
    };
    kv.set(KEY, JSON.stringify(plain));
  },
  markTip(id) {
    get().update({ tipsSeen: { ...get().tipsSeen, [id]: true } });
  },
}));
