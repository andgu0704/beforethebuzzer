import { asPersonId, asTeamId, type TeamId } from '../core/ids';
import type { Rng } from '../core/rng';
import type { CoachTactics } from '../model/person';
import { POSITIONS, type Position } from '../model/skills';
import { pickHeight, pickStyle, pickWingspan, rollSkills } from '../player/archetypes';
import type { RosterEntry } from '../game/prepare';

/** Balanced roster positions for 13 players. */
const ROSTER_POSITIONS: Position[] = [
  'PG',
  'PG',
  'SG',
  'SG',
  'SG',
  'SF',
  'SF',
  'SF',
  'PF',
  'PF',
  'PF',
  'C',
  'C',
];

export interface FixtureTeam {
  readonly teamId: TeamId;
  readonly roster: RosterEntry[];
  readonly tactics: CoachTactics;
}

/** A random team for engine tests. `level` is the mean skill (college ~46, pro ~63). */
export function fixtureTeam(rng: Rng, name: string, level: number, size = 13): FixtureTeam {
  const teamLevel = level + rng.normal(0, 3.5);
  const roster: RosterEntry[] = [];
  for (let i = 0; i < size; i++) {
    const position = ROSTER_POSITIONS[i % ROSTER_POSITIONS.length] ?? POSITIONS[i % 5] ?? 'SF';
    const style = pickStyle(rng, position);
    const heightCm = pickHeight(rng, position);
    // Better players at the top of the roster.
    const base = teamLevel + 6 - i * 0.9 + rng.normal(0, 3);
    roster.push({
      id: asPersonId(`${name}-${i}`),
      position,
      style,
      skills: rollSkills(rng, base, style),
      heightCm,
      wingspanCm: pickWingspan(rng, heightCm),
      confidence: 50 + rng.normal(0, 8),
      energy: 80,
      health: 100,
      isUser: false,
    });
  }
  return {
    teamId: asTeamId(name),
    roster,
    tactics: {
      pace: 50 + rng.normal(0, 12),
      threeRate: 50 + rng.normal(0, 15),
      pressure: 50 + rng.normal(0, 12),
      depth: rng.int(7, 10),
    },
  };
}
