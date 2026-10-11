import type { ContentIndex } from '../content/registry';
import type { MomentActionKind, TraitEffects } from '../content/story-types';
import type { Player } from '../model/person';
import type { Skill } from '../model/skills';

/** All of a player's trait effects folded into one: additive fields add, multipliers multiply. */
export interface MergedTraits {
  shotMod: number;
  clutchMod: number;
  usageMul: number;
  stamina: number;
  growth: number;
  growthSkill: Partial<Record<Skill, number>>;
  injuryRisk: number;
  recovery: number;
  confidenceSwing: number;
  grades: number;
  chemistry: number;
  coachTrust: number;
  reputation: number;
  slumpResist: number;
  temper: number;
  momentEdge: Partial<Record<MomentActionKind, number>>;
}

export function mergeTraits(index: ContentIndex, p: Player): MergedTraits {
  const m: MergedTraits = {
    shotMod: 0,
    clutchMod: 0,
    usageMul: 1,
    stamina: 60,
    growth: 1,
    growthSkill: {},
    injuryRisk: 1,
    recovery: 1,
    confidenceSwing: 1,
    grades: 1,
    chemistry: 1,
    coachTrust: 1,
    reputation: 1,
    slumpResist: 0.3,
    temper: 0,
    momentEdge: {},
  };
  for (const id of p.traits) {
    const e: TraitEffects | undefined = index.trait.get(id)?.effects;
    if (!e) continue;
    m.shotMod += e.shotMod ?? 0;
    m.clutchMod += e.clutchMod ?? 0;
    m.usageMul *= e.usageMul ?? 1;
    if (e.stamina !== undefined) m.stamina = e.stamina;
    m.growth *= e.growth ?? 1;
    for (const [skill, mul] of Object.entries(e.growthSkill ?? {}) as [Skill, number][])
      m.growthSkill[skill] = (m.growthSkill[skill] ?? 1) * mul;
    m.injuryRisk *= e.injuryRisk ?? 1;
    m.recovery *= e.recovery ?? 1;
    m.confidenceSwing *= e.confidenceSwing ?? 1;
    m.grades *= e.grades ?? 1;
    m.chemistry *= e.chemistry ?? 1;
    m.coachTrust *= e.coachTrust ?? 1;
    m.reputation *= e.reputation ?? 1;
    if (e.slumpResist !== undefined) m.slumpResist = Math.max(m.slumpResist, e.slumpResist);
    m.temper += e.temper ?? 0;
    for (const [kind, v] of Object.entries(e.momentEdge ?? {}) as [MomentActionKind, number][])
      m.momentEdge[kind] = (m.momentEdge[kind] ?? 0) + v;
  }
  return m;
}
