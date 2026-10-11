import { useMemo } from 'react';
import { getLocales } from 'expo-localization';

import type { Message } from '@/engine/model/career';
import { translatorFor, type NameResolver, type Translator } from '@/i18n';
import { worldNames } from '@/i18n/names';
import { useGame } from '@/state/game';

let shared: Translator | null = null;

/** The translator for the device language (English until more catalogs exist). */
export function translator(): Translator {
  shared ??= translatorFor(getLocales()[0]?.languageTag ?? 'en');
  return shared;
}

const NO_NAMES: NameResolver = { person: () => '', team: () => '' };

/** Translator plus name resolution for the open career; re-renders on renames. */
export function useT(): {
  t: Translator['t'];
  tr: Translator;
  names: NameResolver;
  m: (message: Message) => string;
} {
  const tr = translator();
  const state = useGame((g) => g.state);
  const rev = useGame((g) => g.rev);
  return useMemo(() => {
    const names = state ? worldNames(state.world, tr) : NO_NAMES;
    return { t: tr.t, tr, names, m: (message: Message) => tr.message(message, names) };
    // rev changes when names are edited
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, rev, tr]);
}
