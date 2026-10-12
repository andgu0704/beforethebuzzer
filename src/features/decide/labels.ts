import type { GameState } from '@/engine/career/state';
import type { ContentIndex } from '@/engine/content/registry';
import type { Conditions } from '@/engine/content/story-types';
import type { GameId } from '@/engine/core/ids';
import { rulesForGame } from '@/engine/season/play';
import type { Translator } from '@/i18n';

/** "0:42" or "12:05" */
export function clockText(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function periodText(
  state: GameState,
  gameId: GameId,
  period: number,
  t: Translator['t'],
): string {
  const game = state.world.games[gameId];
  const rules = game ? rulesForGame(game) : null;
  const regulation = rules?.periods ?? 4;
  if (period > regulation) return t('ui.decide.moment.period.ot');
  if (regulation === 2) return t(`ui.decide.moment.period.${period}`);
  return `${t(`ui.decide.moment.quarter.${period}`)} Q`;
}

/**
 * Why a choice is on offer, for the "Because you…" badge: the earlier decision that set the
 * flag it needs, a trait, or a skill.
 */
export function becauseOf(
  state: GameState,
  index: ContentIndex,
  requires: Conditions | undefined,
  t: Translator['t'],
  message: (key: string) => string,
): string | null {
  if (!requires) return null;
  const flag = requires.flagsAll?.[0] ?? requires.flagRecent?.id;
  if (flag) {
    const record = state.career.flags[flag];
    if (record?.cause.kind === 'event' && record.cause.choice) {
      const key = `events.${record.cause.ref}.choices.${record.cause.choice}.timeline`;
      const text = message(key);
      if (text !== key)
        return t('ui.decide.becauseYou', { what: lowerFirst(text.replace(/\.$/, '')) });
    }
    if (record?.cause.kind === 'moment')
      return t('ui.decide.becauseYou', {
        what: t(`moments.${record.cause.ref}.title`).toLowerCase(),
      });
  }
  const trait = requires.traitsAny?.[0];
  if (trait && index.trait.get(trait)) return t('ui.decide.becauseTrait', { trait });
  const skill = requires.skillsMin ? Object.entries(requires.skillsMin)[0] : undefined;
  if (skill)
    return t('ui.decide.becauseSkill', {
      skillName: t(`skills.${skill[0]}`).toLowerCase(),
      n: skill[1],
    });
  return null;
}

function lowerFirst(s: string): string {
  return s.length > 1 && s[1] !== s[1]?.toUpperCase()
    ? (s[0]?.toLowerCase() ?? '') + s.slice(1)
    : s;
}
