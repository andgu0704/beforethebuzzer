import { clamp } from '../core/math';
import type { PersonId, TeamId } from '../core/ids';
import type { CoachTactics } from '../model/person';
import type { PlayStyle, Position, Skills } from '../model/skills';
import { deriveRatings, deriveTendencies, overallOf } from './ratings';
import type { LeagueRules } from './rules';
import { totalRegulationSec } from './rules';
import type { SimPlayer, SimTeam } from './types';

export type Role = 'bench' | 'rotation' | 'starter' | 'star';

export interface RosterEntry {
  readonly id: PersonId;
  readonly position: Position;
  readonly style: PlayStyle;
  readonly skills: Skills;
  readonly heightCm: number;
  readonly wingspanCm: number;
  readonly confidence: number;
  readonly energy: number;
  readonly health: number;
  readonly isUser: boolean;
}

/** Extra effects from traits and status, computed by the career layer. */
export interface PlayerModifiers {
  readonly shotMod?: number;
  readonly clutchMod?: number;
  readonly usageMul?: number;
  readonly stamina?: number;
}

export interface PrepareOptions {
  readonly teamId: TeamId;
  readonly roster: readonly RosterEntry[];
  readonly tactics: CoachTactics;
  readonly acumen: number;
  readonly rules: LeagueRules;
  /** Forces the user's role; the coach decides everyone else's. */
  readonly userRole?: Role;
  readonly modifiers?: ReadonlyMap<PersonId, PlayerModifiers>;
}

export interface PreparedTeam {
  readonly team: SimTeam;
  readonly roles: ReadonlyMap<PersonId, Role>;
}

/** Minutes share by depth-chart rank, before scaling to the game length. */
function minutesProfile(count: number, depth: number): number[] {
  const out: number[] = [];
  for (let rank = 0; rank < count; rank++) {
    if (rank < 5) out.push([35, 33, 31.5, 30, 28.5][rank] ?? 28);
    else if (rank < depth) out.push(Math.max(8, 22 - (rank - 5) * 4.2));
    else out.push(Math.max(0.5, 3.2 - (rank - depth) * 0.9));
  }
  return out;
}

const ROLE_RANK: Record<Role, (depth: number) => number> = {
  star: () => 0,
  starter: () => 3,
  rotation: () => 6,
  bench: (depth) => depth + 1,
};

export function prepareTeam(o: PrepareOptions): PreparedTeam {
  const healthy = o.roster.filter((p) => p.health > 0);
  const scored = healthy.map((p) => {
    const ovr = overallOf(p.skills, p.position, p.heightCm);
    const condition = (Math.min(p.energy, 70) - 70) * 0.08 + (Math.min(p.health, 85) - 85) * 0.1;
    return { p, ovr, score: ovr + condition };
  });
  scored.sort((a, b) => b.score - a.score || (a.p.id < b.p.id ? -1 : 1));

  const depth = clamp(Math.round(o.tactics.depth), 7, 10);
  if (o.userRole) {
    const userIndex = scored.findIndex((s) => s.p.isUser);
    if (userIndex >= 0) {
      const [user] = scored.splice(userIndex, 1);
      if (user) scored.splice(Math.min(scored.length, ROLE_RANK[o.userRole](depth)), 0, user);
    }
  }

  // Starters: the top five by rank, nudged so a lineup has a guard and a big.
  const order = scored.slice();
  const starters = new Set(order.slice(0, 5).map((s) => s.p.id));
  const hasGuard = order.slice(0, 5).some((s) => s.p.position === 'PG' || s.p.position === 'SG');
  if (!hasGuard) {
    const guard = order.slice(5).find((s) => s.p.position === 'PG' || s.p.position === 'SG');
    const out = order[4];
    if (guard && out && o.userRole !== 'starter' && !out.p.isUser) {
      starters.delete(out.p.id);
      starters.add(guard.p.id);
      order.splice(order.indexOf(guard), 1);
      order.splice(4, 1, guard);
      order.splice(5, 0, out);
    }
  }

  const profile = minutesProfile(order.length, depth);
  const totalShare = profile.reduce((a, b) => a + b, 0);
  const totalSec = totalRegulationSec(o.rules) * 5;
  const roles = new Map<PersonId, Role>();
  const bestOvr = Math.max(...order.map((s) => s.ovr));

  const players: SimPlayer[] = order.map((s, rank) => {
    const p = s.p;
    const share = profile[rank] ?? 0;
    const targetSec = (share / totalShare) * totalSec;
    const minutes = (targetSec / totalSec) * 200;
    const isStar =
      rank === 0 &&
      s.ovr >= bestOvr - 0.01 &&
      (o.userRole === undefined || o.userRole === 'star' || !p.isUser);
    const role: Role =
      (p.isUser && o.userRole) ||
      (isStar && minutes >= 30
        ? 'star'
        : starters.has(p.id)
          ? 'starter'
          : minutes >= 11
            ? 'rotation'
            : 'bench');
    roles.set(p.id, role);
    const r = deriveRatings(p.skills, p.heightCm, p.wingspanCm);
    const mods = o.modifiers?.get(p.id);
    const confidenceMod = ((p.confidence - 50) / 50) * 0.14;
    const energyMod = p.energy < 45 ? -(45 - p.energy) / 140 : 0;
    const roleUsage =
      role === 'star' ? 1.4 : role === 'starter' ? 1 : role === 'rotation' ? 0.85 : 0.7;
    return {
      id: p.id,
      position: p.position,
      r,
      tend: deriveTendencies(p.style, p.position, r),
      targetSec,
      starter: starters.has(p.id),
      usage: roleUsage * (mods?.usageMul ?? 1) * (0.9 + (p.confidence - 50) / 500),
      shotMod: confidenceMod + energyMod + (mods?.shotMod ?? 0),
      clutchMod: mods?.clutchMod ?? 0,
      stamina: clamp((mods?.stamina ?? 60) + (p.energy - 60) * 0.4, 10, 100),
      isUser: p.isUser,
    };
  });

  return { team: { teamId: o.teamId, players, tactics: o.tactics, acumen: o.acumen }, roles };
}
