import { useMemo } from 'react';

import { useT } from '../i18n';
import { clipTextEn, type ClipText } from './text';

/** The clip's labels from the text catalog, falling back to the built-in English. */
export function useClipText(): ClipText {
  const { tr } = useT();
  return useMemo(() => {
    const phases: Record<string, string> = {};
    for (const key of Object.keys(clipTextEn.phases)) {
      const k = `ui.clip.phases.${key}`;
      phases[key] = tr.has(k) ? tr.t(k) : (clipTextEn.phases[key] ?? '');
    }
    return {
      phases,
      replay: tr.t('ui.clip.replay'),
      skip: tr.t('ui.clip.skip'),
      play: tr.t('ui.clip.play'),
      playAgain: tr.t('ui.clip.playAgain'),
    };
  }, [tr]);
}
