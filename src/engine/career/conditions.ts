import { collegePhase, weekIndex } from '../core/calendar';
import type { Conditions, StatusKey } from '../content/story-types';
import type { ContentIndex } from '../content/registry';
import type { Career } from '../model/career';
import type { Player } from '../model/person';
import { userOf, type GameState } from './state';

export function statusValue(career: Career, p: Player, key: StatusKey): number {
  switch (key) {
    case 'energy':
      return p.energy;
    case 'health':
      return p.health;
    case 'confidence':
      return p.confidence;
    default:
      return career[key];
  }
}

export function collegeSeasonsDone(p: Player): number {
  if (p.affiliation.kind === 'college') return p.affiliation.classYear - 1;
  return p.lines.filter((l) => l.league === 'college' && !l.competition).length;
}

function within(value: number, [lo, hi]: readonly [number, number]): boolean {
  return value >= lo && value <= hi;
}

/** True if every stated condition holds right now. */
export function meets(state: GameState, index: ContentIndex, c: Conditions | undefined): boolean {
  if (!c) return true;
  const career = state.career;
  const p = userOf(state);
  const week = state.world.date.week;
  if (c.stages) {
    const stage =
      career.stage === 'highSchool'
        ? 'highSchool'
        : career.stage === 'pro'
          ? 'pro'
          : career.stage === 'college' && !career.draft.declared
            ? 'college'
            : 'prospect';
    if (!c.stages.includes(stage)) return false;
  }
  if (c.phases && !c.phases.includes(collegePhase(week))) return false;
  if (c.weeks && !within(week, c.weeks)) return false;
  if (c.collegeSeasons && !within(collegeSeasonsDone(p), c.collegeSeasons)) return false;
  if (c.flagsAll && !c.flagsAll.every((f) => career.flags[f])) return false;
  if (c.flagsNone && c.flagsNone.some((f) => career.flags[f])) return false;
  if (c.flagRecent) {
    const f = career.flags[c.flagRecent.id];
    if (!f || weekIndex(state.world.date) - f.setAt > c.flagRecent.withinWeeks) return false;
  }
  if (c.traitsAny && !c.traitsAny.some((t) => p.traits.includes(t))) return false;
  if (c.traitsNone && c.traitsNone.some((t) => p.traits.includes(t))) return false;
  if (c.status) {
    for (const [key, range] of Object.entries(c.status) as [
      StatusKey,
      readonly [number, number],
    ][]) {
      if (!within(statusValue(career, p, key), range)) return false;
    }
  }
  if (c.relations) {
    for (const [key, range] of Object.entries(c.relations) as [
      keyof Career['relations'],
      readonly [number, number],
    ][]) {
      if (!within(career.relations[key], range)) return false;
    }
  }
  if (c.skillsMin) {
    for (const [skill, min] of Object.entries(c.skillsMin) as [keyof Player['skills'], number][])
      if (p.skills[skill] < min) return false;
  }
  if (c.roles && !c.roles.includes(career.role)) return false;
  if (c.styles && !c.styles.includes(p.style)) return false;
  if (c.positions && !c.positions.includes(p.position)) return false;
  if (c.lastGame) {
    const last = career.recent[career.recent.length - 1];
    const recent = !!last && weekIndex(state.world.date) - weekIndex(last.date) <= 1;
    const kind =
      !last || !recent
        ? 'none'
        : last.vsExpected >= 6
          ? 'bigGame'
          : last.vsExpected <= -5
            ? 'badGame'
            : last.won
              ? 'win'
              : 'loss';
    const ok =
      c.lastGame === kind ||
      (c.lastGame === 'win' && recent && last.won) ||
      (c.lastGame === 'loss' && recent && !last.won);
    if (!ok) return false;
  }
  if (c.form && career.form !== c.form) return false;
  if (c.injured !== undefined && c.injured !== (p.injury !== null)) return false;
  if (c.hasAgent !== undefined && c.hasAgent !== (career.agentId !== null)) return false;
  if (c.declared !== undefined && c.declared !== career.draft.declared) return false;
  if (c.projectedPick) {
    const [best, worst] = career.draft.projected;
    if (worst < c.projectedPick[0] || best > c.projectedPick[1]) return false;
  }
  if (c.nationStrength) {
    const strength = index.nation.get(p.nation)?.strength ?? 50;
    if (!within(strength, c.nationStrength)) return false;
  }
  return true;
}
