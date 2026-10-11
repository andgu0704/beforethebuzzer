import { clamp, dexp } from '../core/math';
import type { TeamId } from '../core/ids';
import type { NationDef } from '../content/world-types';
import { overallOf } from '../game/ratings';
import type { Affiliation, Player } from '../model/person';
import type { CollegeTeam } from '../model/team';
import { generatePlayer, type GenContext } from '../player/generate';
import { remainingGrowth } from '../player/potential';

export const ROSTER_SIZE = 13;
export const CLASS_SIZE = 600;

/** Base skill level of the recruit at a given rank in a class of `size`. */
export function recruitLevel(rank: number, size: number): number {
  return 30 + 18 * dexp(-rank / 85) + 6 * (1 - rank / size);
}

/** How scouts value a prospect: current ability plus a share of what is left to grow. */
export function prospectScore(p: Player): number {
  const overall = overallOf(p.skills, p.position, p.heightCm);
  return overall + remainingGrowth(p.skills, p.ceiling) * 0.45;
}

export interface ClassOptions {
  readonly gradYear: number;
  readonly size: number;
  /** Skill added for years already spent in college. */
  readonly experience: number;
  readonly affiliation: (p: Player) => Affiliation;
}

/** Generates a high-school class, ranked by scouting score (rank 1 is the best). */
export function generateClass(ctx: GenContext, o: ClassOptions): Player[] {
  const nations = ctx.index.content.nations;
  const out: Player[] = [];
  for (let rank = 0; rank < o.size; rank++) {
    const nation: NationDef = ctx.rng.weighted(nations, (n) => n.talentShare);
    const level = recruitLevel(rank, o.size) + o.experience + ctx.rng.normal(0, 2);
    const p = generatePlayer(ctx, {
      nation,
      birthYear: o.gradYear - 18,
      level,
      gapBonus: rank < 50 ? 2 : rank > 400 ? -1.5 : 0,
      affiliation: { kind: 'highSchool', graduationYear: o.gradYear },
    });
    p.affiliation = o.affiliation(p);
    out.push(p);
  }
  out.sort((a, b) => prospectScore(b) - prospectScore(a));
  out.forEach((p, i) => (p.recruitRank = i + 1));
  return out;
}

/**
 * Sends recruits to colleges in rank order. Better programmes land better players, with
 * plenty of noise, and a team that is short at a position looks harder for one.
 * Returns the recruits nobody signed.
 */
export function assignRecruits(
  ctx: GenContext,
  recruits: readonly Player[],
  colleges: readonly CollegeTeam[],
  capPerTeam: number,
  season: number,
): Player[] {
  const { rng, world } = ctx;
  const signedThisClass = new Map<TeamId, number>();
  const unsigned: Player[] = [];
  for (const p of recruits) {
    const options = colleges.filter(
      (c) => c.roster.length < ROSTER_SIZE && (signedThisClass.get(c.id) ?? 0) < capPerTeam,
    );
    if (options.length === 0) {
      unsigned.push(p);
      continue;
    }
    const rankFactor = clamp(1 - (p.recruitRank ?? 300) / 300, 0, 1);
    const team = rng.weighted(options, (c) => {
      const positionCount = c.roster.filter((id) => {
        const q = world.people[id];
        return q?.kind === 'player' && q.position === p.position;
      }).length;
      const need = positionCount === 0 ? 1.8 : positionCount >= 4 ? 0.4 : 1;
      // Top recruits weigh prestige heavily; lower ones take what is open.
      const pull = dexp((c.prestige / 100) * 5 * (0.3 + rankFactor));
      return pull * need * (0.6 + rng.next() * 0.8);
    });
    p.affiliation = { kind: 'college', teamId: team.id, classYear: 1 };
    p.stints.push({ team: team.id, league: 'college', fromSeason: season, toSeason: null });
    team.roster.push(p.id);
    signedThisClass.set(team.id, (signedThisClass.get(team.id) ?? 0) + 1);
  }
  return unsigned;
}
