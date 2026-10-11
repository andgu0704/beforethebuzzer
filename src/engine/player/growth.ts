import { clamp, dpow } from '../core/math';
import { SKILLS, type Skill, type Skills } from '../model/skills';

/** Diminishing returns on blocks spent on one skill in a week. */
const BLOCK_RETURNS = [1, 0.72, 0.5, 0.34, 0.23, 0.16, 0.11, 0.08, 0.06, 0.04];

export function trainingEffect(blocks: number): number {
  let total = 0;
  for (let i = 0; i < blocks; i++) total += BLOCK_RETURNS[i] ?? 0.05;
  return total;
}

/** How much a body still develops at a given age (1 = fully, 0 = no longer). */
export function ageFactor(age: number): number {
  const table: Record<number, number> = {
    17: 1.05,
    18: 1,
    19: 1,
    20: 0.95,
    21: 0.88,
    22: 0.78,
    23: 0.66,
    24: 0.53,
    25: 0.4,
    26: 0.28,
    27: 0.18,
    28: 0.1,
    29: 0.05,
  };
  if (age < 17) return 1.05;
  return table[age] ?? 0;
}

/** Skill lost per week to ageing, from 30 on; athleticism goes first. */
export function declinePerWeek(age: number, skill: Skill): number {
  if (age < 30) return 0;
  const years = age - 29;
  const base = 0.008 * years;
  return skill === 'athleticism' ? base * 2.2 : skill === 'gameSense' ? -base * 0.3 : base * 0.7;
}

export interface GrowthInput {
  readonly skills: Skills;
  readonly ceiling: Skills;
  readonly age: number;
  /** Training blocks per skill this period, per week. */
  readonly train: Readonly<Partial<Record<Skill, number>>>;
  /** Film-study blocks per week (game sense). */
  readonly film: number;
  /** Minutes per week in games, with level of competition already applied. */
  readonly gameMinutes: number;
  /** 1–100. */
  readonly coachDevelopment: number;
  readonly growthRate: number;
  readonly traitGrowth: number;
  readonly traitSkill: Readonly<Partial<Record<Skill, number>>>;
  /** 0–1: tiredness penalty on training. */
  readonly fatigue: number;
  readonly weeks: number;
}

const TRAIN_RATE = 0.075;
const PASSIVE_RATE = 0.008;
const GAME_RATE = 0.00045;

/** Skill changes over `weeks` weeks. Returns the new skills (fractional values). */
export function grow(input: GrowthInput): Skills {
  const out = { ...input.skills };
  const age = ageFactor(input.age);
  const coach = 0.78 + input.coachDevelopment / 230;
  const common = age * coach * input.growthRate * input.traitGrowth * (1 - 0.6 * input.fatigue);
  for (const skill of SKILLS) {
    const gap = Math.max(0, input.ceiling[skill] - out[skill]);
    const room = gap <= 0 ? 0 : dpow(gap / 20, 1.4);
    let blocks = input.train[skill] ?? 0;
    if (skill === 'gameSense') blocks += input.film * 0.7;
    const perWeek =
      TRAIN_RATE *
        trainingEffect(Math.round(blocks)) *
        room *
        common *
        (input.traitSkill[skill] ?? 1) +
      PASSIVE_RATE * room * common +
      GAME_RATE * input.gameMinutes * room * common;
    const gain = Math.min(gap, perWeek * input.weeks);
    const loss = declinePerWeek(input.age, skill) * input.weeks;
    out[skill] = clamp(Math.round((out[skill] + gain - loss) * 100) / 100, 1, 99);
  }
  return out;
}
